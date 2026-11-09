use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};

use mouse_position::mouse_position::Mouse;
use serde::{Deserialize, Serialize};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};

const POLL_MS: u64 = 40;

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct EdgeZoneConfig {
    /// 0–1 center along primary width
    center_frac: f64,
    /// 0–1 width fraction
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

/// Primary monitor size in physical pixels.
fn primary_screen_size() -> (i32, i32) {
    #[cfg(target_os = "windows")]
    {
        // SM_CXSCREEN = 0, SM_CYSCREEN = 1
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
    #[cfg(target_os = "linux")]
    {
        // Best-effort; Wayland may not expose this the same way
        if let Ok(w) = std::env::var("GDK_SCALE") {
            let _ = w;
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

        // Lightweight game heuristics
        const GAME_HINTS: &[&str] = &[
            "steam",
            "epicgames",
            "game",
            "unity",
            "unreal",
            "riot",
            "valorant",
            "league",
            "cs2",
            "dota",
            "minecraft",
            "roblox",
            "origin",
            "battle.net",
            "ea-desktop",
        ];
        if GAME_HINTS.iter().any(|h| path.contains(h) || name.contains(h)) {
            return FgClass::Game;
        }
        // Fullscreen-ish exclusive often ends with these
        if name.ends_with(".exe")
            && (name.contains("game")
                || name.contains("client") && path.contains("games"))
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

            // Already visible or a show is in-flight → never open a second one
            if is_main_visible(&app) || opening.load(Ordering::SeqCst) {
                edge_since = None;
                fired_this_dwell = false;
                continue;
            }

            let cfg = zone.lock().map(|g| g.clone()).unwrap_or_default();
            let (screen_w, _screen_h) = primary_screen_size();
            let depth = cfg.depth_px.max(4);
            let width = ((screen_w as f64) * cfg.width_frac.clamp(0.05, 1.0)).round() as i32;
            let center = ((screen_w as f64) * cfg.center_frac.clamp(0.0, 1.0)).round() as i32;
            let left = (center - width / 2).max(0);
            let right = (center + width / 2).min(screen_w);

            let near = match Mouse::get_mouse_position() {
                Mouse::Position { x, y } => y >= 0 && y <= depth && x >= left && x <= right,
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
                        if t0.elapsed() >= Duration::from_millis(need) {
                            // Single-open gate
                            if opening
                                .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
                                .is_ok()
                            {
                                if !is_main_visible(&app) {
                                    show_overlay(&app);
                                }
                                fired_this_dwell = true;
                                // Release gate after a short pause so we don't double-fire
                                let opening2 = opening.clone();
                                thread::spawn(move || {
                                    thread::sleep(Duration::from_millis(800));
                                    opening2.store(false, Ordering::SeqCst);
                                });
                            }
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
fn set_edge_watch_enabled(enabled: bool, state: tauri::State<'_, Arc<AtomicBool>>) {
    state.store(enabled, Ordering::Relaxed);
}

#[tauri::command]
fn update_edge_zone(
    zone: EdgeZoneConfig,
    state: tauri::State<'_, Arc<Mutex<EdgeZoneConfig>>>,
) -> Result<(), String> {
    let mut g = state.lock().map_err(|e| e.to_string())?;
    *g = zone;
    Ok(())
}

#[tauri::command]
fn get_primary_screen_size() -> (i32, i32) {
    primary_screen_size()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let edge_enabled = Arc::new(AtomicBool::new(true));
    let edge_for_setup = edge_enabled.clone();
    let zone = Arc::new(Mutex::new(EdgeZoneConfig::default()));
    let zone_for_setup = zone.clone();
    let opening = Arc::new(AtomicBool::new(false));
    let opening_for_setup = opening.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(edge_enabled)
        .manage(zone)
        .manage(opening)
        .invoke_handler(tauri::generate_handler![
            show_main_window,
            hide_main_window,
            set_edge_watch_enabled,
            update_edge_zone,
            get_primary_screen_size
        ])
        .setup(move |app| {
            let show_i = MenuItem::with_id(app, "show", "Show overlay", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("Custom Taby Agent")
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
                })
                .build(app)?;

            if let Some(win) = app.get_webview_window("main") {
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
        .expect("error while running tauri application");
}
