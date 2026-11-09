use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant};

use mouse_position::mouse_position::Mouse;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};

/// Max cursor Y (physical px from desktop top) to count as “top edge”.
const TOP_EDGE_PX: i32 = 8;
/// How long the cursor must stay in the edge before opening (ms).
const EDGE_DWELL_MS: u64 = 450;
/// Poll interval for global cursor (ms).
const POLL_MS: u64 = 40;

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

/// Rough primary width from cursor x (no Win32 dependency).
fn estimate_screen_width(cursor_x: i32) -> i32 {
    const CANDIDATES: [i32; 6] = [1280, 1366, 1440, 1600, 1920, 2560];
    for w in CANDIDATES {
        if cursor_x >= 0 && cursor_x < w {
            return w;
        }
    }
    if cursor_x < 0 {
        return 1920;
    }
    (cursor_x + 200).max(1920)
}

/// Background thread: global cursor poll (works while window is hidden / in tray).
fn start_edge_watcher(app: tauri::AppHandle, enabled: Arc<AtomicBool>) {
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

            // Only arm when overlay is hidden (tray mode)
            if is_main_visible(&app) {
                edge_since = None;
                fired_this_dwell = false;
                continue;
            }

            let near_top = match Mouse::get_mouse_position() {
                Mouse::Position { x, y } => {
                    // Middle of the top edge only (~36% band centered)
                    let screen_w = estimate_screen_width(x);
                    let mid = screen_w / 2;
                    let half_zone = (screen_w as f64 * 0.18) as i32;
                    let in_center = (x - mid).abs() <= half_zone;
                    y >= 0 && y <= TOP_EDGE_PX && in_center
                }
                Mouse::Error => false,
            };

            if near_top {
                if edge_since.is_none() {
                    edge_since = Some(Instant::now());
                    fired_this_dwell = false;
                }
                if !fired_this_dwell {
                    if let Some(t0) = edge_since {
                        if t0.elapsed() >= Duration::from_millis(EDGE_DWELL_MS) {
                            show_overlay(&app);
                            fired_this_dwell = true;
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let edge_enabled = Arc::new(AtomicBool::new(true));
    let edge_for_setup = edge_enabled.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(edge_enabled)
        .invoke_handler(tauri::generate_handler![
            show_main_window,
            hide_main_window,
            set_edge_watch_enabled
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

            start_edge_watcher(app.handle().clone(), edge_for_setup);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
