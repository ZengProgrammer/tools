use std::sync::Mutex;
use tauri::Manager;
use tauri::Emitter;
use crate::db::DbState;

#[derive(Clone, PartialEq)]
pub enum AppMode {
    Desktop,
    Floating,
}

pub struct ModeState(pub Mutex<AppMode>);

pub fn save_mode(state: &tauri::State<'_, DbState>, mode: &AppMode) {
    let val = match mode { AppMode::Desktop => "desktop", AppMode::Floating => "floating" };
    let conn = state.0.lock().ok();
    if let Some(c) = conn {
        let _ = c.execute(
            "INSERT INTO settings (key, value) VALUES ('app_mode', ?1) ON CONFLICT(key) DO UPDATE SET value = ?1",
            rusqlite::params![val],
        );
    }
}

pub fn load_mode(state: &tauri::State<'_, DbState>) -> AppMode {
    let conn = state.0.lock().ok();
    if let Some(c) = conn {
        let val: Option<String> = c.query_row(
            "SELECT value FROM settings WHERE key = 'app_mode'", [], |row| row.get(0),
        ).ok();
        if let Some(v) = val {
            if v == "floating" { return AppMode::Floating; }
        }
    }
    AppMode::Desktop
}

pub fn float_navigate(app: &tauri::AppHandle, tool: &str) {
    if let Some(fb) = app.get_webview_window("floating-ball") {
        let _ = fb.show();
        let _ = fb.set_focus();
        let _ = fb.emit("float-navigate", tool);
        let _ = fb.eval(&format!("window.__floatNav && window.__floatNav('{}')", tool));
    }
}
