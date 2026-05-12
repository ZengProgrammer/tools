use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::Manager;
use tauri::Emitter;
use crate::mode::{AppMode, ModeState, save_mode, float_navigate};
use crate::db::DbState;
use crate::autostart::{check_autostart, enable_autostart};

pub fn build_tray_menu<R: tauri::Runtime>(app: &impl tauri::Manager<R>, mode: &AppMode) -> Result<Menu<R>, tauri::Error> {
    match mode {
        AppMode::Desktop => {
            let home = MenuItem::with_id(app, "home", "首页", true, None::<&str>)?;
            let translate = MenuItem::with_id(app, "translate", "翻译工具", true, None::<&str>)?;
            let json_tool = MenuItem::with_id(app, "json", "JSON工具", true, None::<&str>)?;
            let sql_tool = MenuItem::with_id(app, "sql", "SQL工具", true, None::<&str>)?;
            let timestamp = MenuItem::with_id(app, "timestamp", "时间戳工具", true, None::<&str>)?;
            let sep1 = PredefinedMenuItem::separator(app)?;
            let toggle_max = MenuItem::with_id(app, "toggle_max", "最大化/最小化", true, None::<&str>)?;
            let toggle_show = MenuItem::with_id(app, "toggle_show", "显示/隐藏", true, None::<&str>)?;
            let autostart = MenuItem::with_id(app, "autostart", "添加开机自启", true, None::<&str>)?;
            let switch = MenuItem::with_id(app, "switch_mode", "切换悬浮窗", true, None::<&str>)?;
            let sep2 = PredefinedMenuItem::separator(app)?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            Menu::with_items(app, &[
                &home, &translate, &json_tool, &sql_tool, &timestamp,
                &sep1,
                &toggle_max, &toggle_show, &autostart, &switch,
                &sep2, &quit,
            ])
        }
        AppMode::Floating => {
            let translate = MenuItem::with_id(app, "float_translate", "翻译工具", true, None::<&str>)?;
            let json_tool = MenuItem::with_id(app, "float_json", "JSON工具", true, None::<&str>)?;
            let sql_tool = MenuItem::with_id(app, "float_sql", "SQL工具", true, None::<&str>)?;
            let timestamp = MenuItem::with_id(app, "float_timestamp", "时间戳工具", true, None::<&str>)?;
            let sep1 = PredefinedMenuItem::separator(app)?;
            let toggle_show = MenuItem::with_id(app, "toggle_show", "显示/隐藏", true, None::<&str>)?;
            let autostart = MenuItem::with_id(app, "autostart", "添加开机自启", true, None::<&str>)?;
            let switch = MenuItem::with_id(app, "switch_mode", "切换桌面", true, None::<&str>)?;
            let sep2 = PredefinedMenuItem::separator(app)?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            Menu::with_items(app, &[
                &translate, &json_tool, &sql_tool, &timestamp,
                &sep1,
                &toggle_show, &autostart, &switch,
                &sep2, &quit,
            ])
        }
    }
}

pub fn rebuild_tray(app: &tauri::AppHandle, mode: &AppMode) -> Result<(), tauri::Error> {
    let menu = build_tray_menu(app, mode)?;
    if let Some(tray) = app.tray_by_id("main-tray") {
        tray.set_menu(Some(menu))?;
        tray.set_tooltip(Some(match mode { AppMode::Desktop => "桌面模式", AppMode::Floating => "悬浮窗模式" }))?;
    }
    Ok(())
}

fn show_and_navigate(app: &tauri::AppHandle, path: &str) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
        let _ = w.emit("navigate", path);
        let _ = w.eval(&format!("window.location.hash = '{}'", path));
    }
}

pub fn handle_menu_event(app: &tauri::AppHandle, event: tauri::menu::MenuEvent) {
    let id = event.id.as_ref();
    match id {
        "home" => show_and_navigate(app, "/"),
        "translate" => show_and_navigate(app, "/translate"),
        "json" => show_and_navigate(app, "/json"),
        "sql" => show_and_navigate(app, "/sql"),
        "timestamp" => show_and_navigate(app, "/timestamp"),
        "float_translate" => float_navigate(app, "translate"),
        "float_json" => float_navigate(app, "json"),
        "float_sql" => float_navigate(app, "sql"),
        "float_timestamp" => float_navigate(app, "timestamp"),
        "toggle_show" => {
            let mode = app.state::<ModeState>().0.lock().unwrap().clone();
            let label = match mode { AppMode::Desktop => "main", AppMode::Floating => "floating-ball" };
            if let Some(w) = app.get_webview_window(label) {
                if w.is_visible().unwrap_or(false) {
                    let _ = w.hide();
                } else {
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
        }
        "toggle_max" => {
            if let Some(w) = app.get_webview_window("main") {
                if w.is_maximized().unwrap_or(false) {
                    let _ = w.unmaximize();
                } else {
                    let _ = w.maximize();
                }
            }
        }
        "autostart" => {
            if check_autostart() {
                let _ = rfd::MessageDialog::new()
                    .set_title("Tools")
                    .set_description("已添加开机自启，如需禁用请在任务管理器「启动」中操作")
                    .show();
            } else if enable_autostart().is_ok() {
                let _ = rfd::MessageDialog::new()
                    .set_title("Tools")
                    .set_description("已添加开机自启")
                    .show();
            }
        }
        "switch_mode" => {
            let state = app.state::<ModeState>();
            let current = state.0.lock().unwrap().clone();
            match current {
                AppMode::Desktop => {
                    // Emit globally so all windows know desktop is the source
                    let _ = app.emit("switch-sync", "main");
                    if let Some(w) = app.get_webview_window("main") { let _ = w.hide(); }
                    if let Some(fb) = app.get_webview_window("floating-ball") {
                        let _ = fb.show();
                        let _ = fb.set_focus();
                    }
                    *state.0.lock().unwrap() = AppMode::Floating;
                    save_mode(&app.state::<DbState>(), &AppMode::Floating);
                    let _ = rebuild_tray(app, &AppMode::Floating);
                }
                AppMode::Floating => {
                    // Emit globally so all windows know floating is the source
                    let _ = app.emit("switch-sync", "floating-ball");
                    if let Some(fb) = app.get_webview_window("floating-ball") { let _ = fb.hide(); }
                    for label in &["tool-translate", "tool-json", "tool-sql"] {
                        if let Some(w) = app.get_webview_window(label) { let _ = w.close(); }
                    }
                    if let Some(w) = app.get_webview_window("main") {
                        let _ = w.show();
                        let _ = w.unminimize();
                        let _ = w.set_focus();
                        let was_pinned = w.is_always_on_top().unwrap_or(false);
                        let _ = w.set_always_on_top(true);
                        std::thread::sleep(std::time::Duration::from_millis(50));
                        if !was_pinned {
                            let _ = w.set_always_on_top(false);
                        }
                    }
                    *state.0.lock().unwrap() = AppMode::Desktop;
                    save_mode(&app.state::<DbState>(), &AppMode::Desktop);
                    let _ = rebuild_tray(app, &AppMode::Desktop);
                }
            }
        }
        "quit" => {
            for label in &["main", "floating-ball", "tool-translate", "tool-json", "tool-sql"] {
                if let Some(w) = app.get_webview_window(label) { let _ = w.close(); }
            }
            app.exit(0);
        }
        _ => {}
    }
}
