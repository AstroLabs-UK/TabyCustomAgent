use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use mouse_position::mouse_position::Mouse;
use serde::{Deserialize, Serialize};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};

const POLL_MS: u64 = 40;
const LOG_RETENTION_SECS: u64 = 30 * 24 * 60 * 60; // 30 days

/// Distinct managed state types (Tauri keys by TypeId — cannot manage two Arc<AtomicBool>).
struct EdgeWatchEnabled(Arc<AtomicBool>);
struct DiagnosticsEnabled(Arc<AtomicBool>);
struct ZoneState(Arc<Mutex<EdgeZoneConfig>>);

fn log_dir() -> PathBuf {
    let base = std::env::var_os("LOCALAPPDATA")
        .map(PathBuf::from)
        .or_else(|| {
            std::env::var_os("HOME").map(|h| PathBuf::from(h).join(".local").join("share"))
        })
        .unwrap_or_else(|| PathBuf::from("."));
    base.join("TabyCustomAgent")
}

fn diagnostics_on(flag: &Arc<AtomicBool>) -> bool {
    flag.load(Ordering::Relaxed)
}

fn startup_log(diag: &Arc<AtomicBool>, msg: &str) {
    if !diagnostics_on(diag) {
        return;
    }
    let dir = log_dir();
    let _ = fs::create_dir_all(&dir);
    let path = dir.join("startup.log");
    if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(&path) {
        let ts = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        let _ = writeln!(f, "[{ts}] {msg}");
        let _ = f.flush();
    }
}

fn purge_old_logs() {
    let dir = log_dir();
    let Ok(entries) = fs::read_dir(&dir) else {
        return;
    };
    let now = SystemTime::now();
    for ent in entries.flatten() {
        let path = ent.path();
        if path.extension().and_then(|e| e.to_str()) != Some("log") {
            continue;
        }
        if let Ok(meta) = ent.metadata() {
            if let Ok(modified) = meta.modified() {
                if let Ok(age) = now.duration_since(modified) {
                    if age.as_secs() > LOG_RETENTION_SECS {
                        let _ = fs::remove_file(path);
                    }
                }
            }
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct EdgeZoneConfig {
    center_frac: f64,
    width_frac: f64,
    depth_px: i32,
    dwell_productivity_ms: u64,
    dwell_browser_ms: u64,
    dwell_game_ms: u64,
}

impl Default for EdgeZoneConfig {
    fn default() -> Self {
        Self {
            center_frac: 0.5,
            width_frac: 0.36,
            depth_px: 10,
            dwell_productivity_ms: 500,
            dwell_browser_ms: 700,
            dwell_game_ms: 1000,
        }
    }
}

fn show_overlay(app: &tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.show();
        let _ = win.unminimize();
        let _ = win.set_always_on_top(true);
        let _ = win.set_focus();
    }
    let _ = app.emit("overlay://show", ());
}

fn hide_overlay(app: &tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.hide();
    }
    let _ = app.emit("overlay://hide", ());
}

fn is_main_visible(app: &tauri::AppHandle) -> bool {
    app.get_webview_window("main")
        .and_then(|w| w.is_visible().ok())
        .unwrap_or(false)
}

fn dpi_scale() -> f64 {
    #[cfg(target_os = "windows")]
    {
        extern "system" {
            fn GetDpiForSystem() -> u32;
        }
        unsafe {
            let dpi = GetDpiForSystem();
            if dpi > 0 {
                return dpi as f64 / 96.0;
            }
        }
    }
    1.0
}

/// Logical (CSS) primary size — matches the visualizer.
fn primary_screen_size_logical() -> (i32, i32) {
    let (pw, ph) = primary_screen_size();
    let s = dpi_scale();
    ((pw as f64 / s).round() as i32, (ph as f64 / s).round() as i32)
}

fn primary_screen_size() -> (i32, i32) {
    #[cfg(target_os = "windows")]
    {
        extern "system" {
            fn GetSystemMetrics(index: i32) -> i32;
        }
        unsafe {
            let w = GetSystemMetrics(0);
            let h = GetSystemMetrics(1);
            if w > 0 && h > 0 {
                return (w, h);
            }
        }
    }
    (1920, 1080)
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum FgClass {
    Productivity,
    Browser,
    Game,
}

fn classify_foreground() -> FgClass {
    #[cfg(target_os = "windows")]
    {
        return classify_foreground_windows();
    }
    #[cfg(not(target_os = "windows"))]
    {
        FgClass::Productivity
    }
}

#[cfg(target_os = "windows")]
fn classify_foreground_windows() -> FgClass {
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;

    extern "system" {
        fn GetForegroundWindow() -> isize;
        fn GetWindowThreadProcessId(hwnd: isize, pid: *mut u32) -> u32;
        fn OpenProcess(access: u32, inherit: i32, pid: u32) -> isize;
        fn CloseHandle(handle: isize) -> i32;
        fn QueryFullProcessImageNameW(
            process: isize,
            flags: u32,
            exe: *mut u16,
            size: *mut u32,
        ) -> i32;
    }

    const PROCESS_QUERY_LIMITED_INFORMATION: u32 = 0x1000;

    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd == 0 {
            return FgClass::Productivity;
        }
        let mut pid: u32 = 0;
        GetWindowThreadProcessId(hwnd, &mut pid);
        if pid == 0 {
            return FgClass::Productivity;
        }
        let proc = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
        if proc == 0 {
            return FgClass::Productivity;
        }
        let mut buf = [0u16; 512];
        let mut size = buf.len() as u32;
        let ok = QueryFullProcessImageNameW(proc, 0, buf.as_mut_ptr(), &mut size);
        CloseHandle(proc);
        if ok == 0 {
            return FgClass::Productivity;
        }
        let os = OsString::from_wide(&buf[..size as usize]);
        let path = os.to_string_lossy().to_lowercase();
        let name = path.rsplit(['\\', '/']).next().unwrap_or(&path);

        const BROWSERS: &[&str] = &[
            "chrome.exe",
            "msedge.exe",
            "firefox.exe",
            "brave.exe",
            "opera.exe",
            "vivaldi.exe",
            "iexplore.exe",
            "arc.exe",
        ];
        if BROWSERS.iter().any(|b| name == *b) {
            return FgClass::Browser;
        }

        const GAME_HINTS: &[&str] = &[
            "steam", "epicgames", "game", "unity", "unreal", "riot", "valorant", "league",
            "cs2", "dota", "minecraft", "roblox", "origin", "battle.net",
        ];
        if GAME_HINTS
            .iter()
            .any(|h| path.contains(h) || name.contains(h))
        {
            return FgClass::Game;
        }
        FgClass::Productivity
    }
}

fn dwell_for(cfg: &EdgeZoneConfig, class: FgClass) -> u64 {
    match class {
        FgClass::Productivity => cfg.dwell_productivity_ms,
        FgClass::Browser => cfg.dwell_browser_ms,
        FgClass::Game => cfg.dwell_game_ms,
    }
}

fn start_edge_watcher(
    app: tauri::AppHandle,
    enabled: Arc<AtomicBool>,
    zone: Arc<Mutex<EdgeZoneConfig>>,
    opening: Arc<AtomicBool>,
) {
    thread::spawn(move || {
        let mut edge_since: Option<Instant> = None;
        let mut fired_this_dwell = false;

        loop {
            thread::sleep(Duration::from_millis(POLL_MS));
            if !enabled.load(Ordering::Relaxed) {
                edge_since = None;
                fired_this_dwell = false;
                continue;
            }
            if is_main_visible(&app) || opening.load(Ordering::SeqCst) {
                edge_since = None;
                fired_this_dwell = false;
                continue;
            }

            let cfg = zone.lock().map(|g| g.clone()).unwrap_or_default();
            // Work in logical/CSS pixels so visualizer ↔ hit-test match under DPI scaling
            let scale = dpi_scale();
            let (screen_w, _) = primary_screen_size_logical();
            let depth = cfg.depth_px.max(4);
            let width = ((screen_w as f64) * cfg.width_frac.clamp(0.05, 1.0)).round() as i32;
            let center = ((screen_w as f64) * cfg.center_frac.clamp(0.0, 1.0)).round() as i32;
            let left = (center - width / 2).max(0);
            let right = (center + width / 2).min(screen_w);

            let near = match Mouse::get_mouse_position() {
                Mouse::Position { x, y } => {
                    let lx = (x as f64 / scale).round() as i32;
                    let ly = (y as f64 / scale).round() as i32;
                    ly >= 0 && ly <= depth && lx >= left && lx <= right
                }
                Mouse::Error => false,
            };

            if near {
                if edge_since.is_none() {
                    edge_since = Some(Instant::now());
                    fired_this_dwell = false;
                }
                if !fired_this_dwell {
                    if let Some(t0) = edge_since {
                        let need = dwell_for(&cfg, classify_foreground());
                        if t0.elapsed() >= Duration::from_millis(need)
                            && opening
                                .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
                                .is_ok()
                        {
                            if !is_main_visible(&app) {
                                show_overlay(&app);
                            }
                            fired_this_dwell = true;
                            let opening2 = opening.clone();
                            thread::spawn(move || {
                                thread::sleep(Duration::from_millis(800));
                                opening2.store(false, Ordering::SeqCst);
                            });
                        }
                    }
                }
            } else {
                edge_since = None;
                fired_this_dwell = false;
            }
        }
    });
}

#[tauri::command]
fn show_main_window(app: tauri::AppHandle) {
    show_overlay(&app);
}

#[tauri::command]
fn hide_main_window(app: tauri::AppHandle) {
    hide_overlay(&app);
}

#[tauri::command]
fn set_edge_watch_enabled(enabled: bool, state: tauri::State<'_, EdgeWatchEnabled>) {
    state.0.store(enabled, Ordering::Relaxed);
}

#[tauri::command]
fn set_diagnostics_enabled(enabled: bool, state: tauri::State<'_, DiagnosticsEnabled>) {
    state.0.store(enabled, Ordering::Relaxed);
    if enabled {
        purge_old_logs();
        startup_log(&state.0, "diagnostics enabled");
    }
}

#[tauri::command]
fn update_edge_zone(
    zone: EdgeZoneConfig,
    state: tauri::State<'_, ZoneState>,
) -> Result<(), String> {
    let mut g = state.0.lock().map_err(|e| e.to_string())?;
    *g = zone;
    Ok(())
}

#[tauri::command]
fn get_primary_screen_size() -> (i32, i32) {
    primary_screen_size_logical()
}

/// Returns (screen_w, left, width, depth) in logical CSS pixels — same as visualizer.
#[tauri::command]
fn get_edge_zone_rect(state: tauri::State<'_, ZoneState>) -> (i32, i32, i32, i32) {
    let cfg = state.0.lock().map(|g| g.clone()).unwrap_or_default();
    let (screen_w, _) = primary_screen_size_logical();
    let depth = cfg.depth_px.max(4);
    let width = ((screen_w as f64) * cfg.width_frac.clamp(0.05, 1.0)).round() as i32;
    let center = ((screen_w as f64) * cfg.center_frac.clamp(0.0, 1.0)).round() as i32;
    let left = (center - width / 2).max(0);
    (screen_w, left, width, depth)
}

#[tauri::command]
fn get_startup_log_path() -> String {
    log_dir()
        .join("startup.log")
        .to_string_lossy()
        .to_string()
}


// ─── USB Physical Taby detection + provision ─────────────────

#[derive(Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct UsbPortInfo {
    path: String,
    name: String,
    vid: Option<u16>,
    pid: Option<u16>,
    /// Heuristic: Espressif / common CDC ACM
    likely_esp32: bool,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct UsbProvisionResult {
    ok: bool,
    phase: String,
    message: String,
    port: Option<String>,
    serial: Option<String>,
    ble_mac: Option<String>,
    firmware: Option<String>,
    log: Vec<String>,
}

fn is_likely_esp32(vid: Option<u16>, pid: Option<u16>, name: &str) -> bool {
    let n = name.to_lowercase();
    // Espressif VID 0x303A, common CP210x 0x10C4, CH340 0x1A86
    match vid {
        Some(0x303A) | Some(0x10C4) | Some(0x1A86) | Some(0x0403) => true,
        _ => {
            n.contains("usb serial")
                || n.contains("usb modem")
                || n.contains("esp32")
                || n.contains("jtag")
                || n.contains("silicon labs")
                || n.contains("wch")
        }
    }
}

#[tauri::command]
fn usb_list_ports() -> Result<Vec<UsbPortInfo>, String> {
    let ports = serialport::available_ports().map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for p in ports {
        let (vid, pid, name) = match &p.port_type {
            serialport::SerialPortType::UsbPort(info) => {
                let product = info.product.clone().unwrap_or_default();
                let manu = info.manufacturer.clone().unwrap_or_default();
                let name = format!(
                    "{} {} {}",
                    manu,
                    product,
                    info.serial_number.clone().unwrap_or_default()
                )
                .trim()
                .to_string();
                (Some(info.vid), Some(info.pid), if name.is_empty() { p.port_name.clone() } else { name })
            }
            _ => (None, None, p.port_name.clone()),
        };
        let likely = is_likely_esp32(vid, pid, &name) || {
            let pn = p.port_name.to_lowercase();
            pn.contains("ttyacm") || pn.contains("usbmodem") || pn.contains("com")
        };
        // Prefer ACM / usbmodem; still list all USB-ish
        out.push(UsbPortInfo {
            path: p.port_name.clone(),
            name,
            vid,
            pid,
            likely_esp32: likely,
        });
    }
    // Likely ESP32 first
    out.sort_by(|a, b| b.likely_esp32.cmp(&a.likely_esp32));
    Ok(out)
}

fn app_data_dir() -> std::path::PathBuf {
    dirs_next_path()
}

fn dirs_next_path() -> std::path::PathBuf {
    // Prefer standard locations without extra crate
    if let Ok(p) = std::env::var("LOCALAPPDATA") {
        return std::path::PathBuf::from(p).join("TabyCustomAgent");
    }
    if let Ok(home) = std::env::var("HOME") {
        return std::path::PathBuf::from(home).join(".local/share/TabyCustomAgent");
    }
    std::env::temp_dir().join("TabyCustomAgent")
}

fn run_cmd(program: &str, args: &[&str], cwd: &std::path::Path) -> Result<(i32, String), String> {
    use std::process::Command;
    let output = Command::new(program)
        .args(args)
        .current_dir(cwd)
        .output()
        .map_err(|e| format!("failed to run {}: {}", program, e))?;
    let mut s = String::new();
    s.push_str(&String::from_utf8_lossy(&output.stdout));
    s.push_str(&String::from_utf8_lossy(&output.stderr));
    let code = output.status.code().unwrap_or(-1);
    Ok((code, s))
}

fn find_python() -> Option<String> {
    for c in ["python3", "python", "py"] {
        if let Ok(o) = std::process::Command::new(c).arg("--version").output() {
            if o.status.success() {
                return Some(c.to_string());
            }
        }
    }
    // Windows py -3
    if let Ok(o) = std::process::Command::new("py").args(["-3", "--version"]).output() {
        if o.status.success() {
            return Some("py".to_string());
        }
    }
    None
}

/// Detect plugged board and install upstream firmware-taby release via its tools.
#[tauri::command]
fn usb_provision_taby(
    board: String,
    port: Option<String>,
    ssid: Option<String>,
) -> Result<UsbProvisionResult, String> {
    let mut log: Vec<String> = Vec::new();
    let ports = usb_list_ports()?;
    log.push(format!("ports found: {}", ports.len()));
    for p in &ports {
        log.push(format!(
            "  {} ({}) likely_esp32={}",
            p.path, p.name, p.likely_esp32
        ));
    }

    let chosen = if let Some(ref p) = port {
        ports.iter().find(|x| x.path == *p).cloned().or_else(|| {
            Some(UsbPortInfo {
                path: p.clone(),
                name: p.clone(),
                vid: None,
                pid: None,
                likely_esp32: true,
            })
        })
    } else {
        ports.into_iter().find(|p| p.likely_esp32)
    };

    let Some(chosen) = chosen else {
        return Ok(UsbProvisionResult {
            ok: false,
            phase: "error".into(),
            message: "No USB Taby / ESP32 serial port found. Plug in a data USB cable and try again.".into(),
            port: None,
            serial: None,
            ble_mac: None,
            firmware: None,
            log,
        });
    };
    log.push(format!("using port {}", chosen.path));

    let Some(py) = find_python() else {
        return Ok(UsbProvisionResult {
            ok: false,
            phase: "error".into(),
            message: "Python 3 is required to install firmware. Install from python.org, then retry.".into(),
            port: Some(chosen.path),
            serial: None,
            ble_mac: None,
            firmware: None,
            log,
        });
    };
    log.push(format!("python: {}", py));

    let root = app_data_dir().join("firmware-taby");
    std::fs::create_dir_all(&root).map_err(|e| e.to_string())?;

    // Ensure upstream repo tools exist (shallow clone or pull)
    let git_dir = root.join(".git");
    if !git_dir.exists() {
        log.push("cloning TRIIIS-LABS/firmware-taby…".into());
        let parent = root.parent().unwrap();
        let (code, out) = run_cmd(
            "git",
            &[
                "clone",
                "--depth",
                "1",
                "https://github.com/TRIIIS-LABS/firmware-taby.git",
                root.file_name().unwrap().to_str().unwrap(),
            ],
            parent,
        )?;
        log.push(out.chars().take(800).collect());
        if code != 0 {
            return Ok(UsbProvisionResult {
                ok: false,
                phase: "error".into(),
                message: "Could not download firmware-taby tools (git clone failed). Check network.".into(),
                port: Some(chosen.path),
                serial: None,
                ble_mac: None,
                firmware: None,
                log,
            });
        }
    } else {
        log.push("updating firmware-taby…".into());
        let (_c, out) = run_cmd("git", &["pull", "--ff-only"], &root).unwrap_or((0, String::new()));
        log.push(out.chars().take(400).collect());
    }

    // Bootstrap venv + esptool
    log.push("bootstrap esptool…".into());
    let boot_args: Vec<String> = if py == "py" {
        vec!["-3".into(), "tools/bootstrap.py".into()]
    } else {
        vec!["tools/bootstrap.py".into()]
    };
    let boot_refs: Vec<&str> = boot_args.iter().map(|s| s.as_str()).collect();
    let (code, out) = run_cmd(&py, &boot_refs, &root)?;
    log.push(out.chars().take(1000).collect());
    if code != 0 {
        return Ok(UsbProvisionResult {
            ok: false,
            phase: "error".into(),
            message: "Firmware tool bootstrap failed. See log in Settings.".into(),
            port: Some(chosen.path),
            serial: None,
            ble_mac: None,
            firmware: None,
            log,
        });
    }

    // Prefer venv python
    let venv_py = if cfg!(windows) {
        root.join(".venv/Scripts/python.exe")
    } else {
        root.join(".venv/bin/python")
    };
    let python = if venv_py.exists() {
        venv_py.to_string_lossy().to_string()
    } else {
        py.clone()
    };

    // Download release bundle via upstream helper if present, else instruct
    let board_arg = if board.is_empty() {
        "amoled-1.64".to_string()
    } else {
        board.clone()
    };

    // Try identify first (may fail on blank board — OK)
    log.push("identify (optional)…".into());
    let (_c, id_out) = run_cmd(
        &python,
        &[
            "tools/device.py",
            "identify",
            "--port",
            &chosen.path,
        ],
        &root,
    )
    .unwrap_or((-1, String::new()));
    log.push(id_out.chars().take(600).collect());

    // Flash using install.py — expects bundle; try `tools/install.py flash` with auto bundle fetch if supported
    // Many releases need downloaded zip. Attempt install.py with --board only.
    log.push(format!("flashing board {} on {}…", board_arg, chosen.path));
    let flash_args = [
        "tools/install.py",
        "flash",
        "--board",
        board_arg.as_str(),
        "--port",
        chosen.path.as_str(),
        "--confirmed-board",
    ];
    let (code, out) = run_cmd(&python, &flash_args, &root)?;
    log.push(out.chars().take(2000).collect());

    if code != 0 {
        // Soft success path: device detected but flash needs manual bundle
        return Ok(UsbProvisionResult {
            ok: false,
            phase: "error".into(),
            message: format!(
                "Device found on {} but automatic flash did not complete. Download the matching release from firmware-taby and retry, or run upstream install.py. Details in log.",
                chosen.path
            ),
            port: Some(chosen.path),
            serial: None,
            ble_mac: None,
            firmware: None,
            log,
        });
    }

    // Try read identity after flash
    let (_c, info_out) = run_cmd(
        &python,
        &["tools/device.py", "identify", "--port", &chosen.path],
        &root,
    )
    .unwrap_or((-1, String::new()));
    log.push(info_out.chars().take(600).collect());

    // Parse rough MAC/serial from identify output if present
    let mut ble_mac = None;
    let mut serial = None;
    for line in info_out.lines() {
        let lower = line.to_lowercase();
        if lower.contains("mac") || lower.contains("ble") {
            if let Some(m) = line.split_whitespace().find(|t| t.contains(':') && t.len() >= 11) {
                ble_mac = Some(m.trim_matches(',').to_string());
            }
        }
        if lower.contains("serial") {
            if let Some(s) = line.split(':').nth(1) {
                serial = Some(s.trim().to_string());
            }
        }
    }

    if let Some(ref s) = ssid {
        if !s.is_empty() {
            log.push(format!("wifi ssid requested: {} (write when device protocol supports it)", s));
        }
    }

    Ok(UsbProvisionResult {
        ok: true,
        phase: "done".into(),
        message: format!("Firmware install finished on {}", chosen.path),
        port: Some(chosen.path),
        serial,
        ble_mac,
        firmware: Some(board_arg),
        log,
    })
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    purge_old_logs();

    let edge_enabled = Arc::new(AtomicBool::new(true));
    let edge_for_setup = edge_enabled.clone();
    let zone = Arc::new(Mutex::new(EdgeZoneConfig::default()));
    let zone_for_setup = zone.clone();
    let opening = Arc::new(AtomicBool::new(false));
    let opening_for_setup = opening.clone();
    let diagnostics = Arc::new(AtomicBool::new(false));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(EdgeWatchEnabled(edge_enabled))
        .manage(DiagnosticsEnabled(diagnostics))
        .manage(ZoneState(zone))
        .invoke_handler(tauri::generate_handler![
            show_main_window,
            hide_main_window,
            set_edge_watch_enabled,
            set_diagnostics_enabled,
            update_edge_zone,
            get_primary_screen_size,
            get_edge_zone_rect,
            get_startup_log_path,
            usb_list_ports,
            usb_provision_taby
        ])
        .setup(move |app| {
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
                let _ = win.unminimize();
                let _ = win.set_focus();
            }

            let show_i = MenuItem::with_id(app, "show", "Show overlay", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let mut tray = TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("Taby Custom Agent")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => show_overlay(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_overlay(tray.app_handle());
                    }
                });

            if let Some(icon) = app.default_window_icon() {
                tray = tray.icon(icon.clone());
            }
            let _ = tray.build(app);

            if let Some(win) = app.get_webview_window("main") {
                // Force a real HUD-sized window at startup (never blank fullscreen)
                let _ = win.set_size(tauri::LogicalSize::new(420.0, 320.0));
                let _ = win.center();
                let _ = win.set_always_on_top(true);
                let _ = win.show();
                let _ = win.set_focus();

                let app_handle = app.handle().clone();
                win.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        hide_overlay(&app_handle);
                    }
                });
            }

            start_edge_watcher(
                app.handle().clone(),
                edge_for_setup,
                zone_for_setup,
                opening_for_setup,
            );

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Taby Custom Agent");
}
