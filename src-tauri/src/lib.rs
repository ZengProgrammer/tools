mod db;
mod mode;
mod translate;
mod autostart;
mod tray;
mod commands;
mod domain;

use std::sync::Mutex;
use tauri::Manager;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use db::{init_db, DbState};
use mode::{AppMode, ModeState, load_mode};
use tray::{build_tray_menu, rebuild_tray, handle_menu_event};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
                let _ = window.show();
            }
            let _ = rfd::MessageDialog::new().set_title("Tools").set_description("该程序已运行").show();
        }))
        .setup(|app| {
            init_db(app)?;
            app.manage(ModeState(Mutex::new(AppMode::Desktop)));

            let menu = build_tray_menu(app, &AppMode::Desktop)?;
            let _tray = TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app_handle, event| handle_menu_event(app_handle, event))
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up, ..
                    } = event {
                        let app = tray.app_handle();
                        let mode = app.state::<ModeState>().0.lock().unwrap().clone();
                        let label = match mode { AppMode::Desktop => "main", AppMode::Floating => "floating-ball" };
                        if let Some(w) = app.get_webview_window(label) {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(app)?;

            let _fb = tauri::WebviewWindowBuilder::new(
                app, "floating-ball",
                tauri::WebviewUrl::App("index.html".into()),
            )
            .title("悬浮窗")
            .inner_size(780.0, 480.0)
            .min_inner_size(72.0, 72.0)
            .center()
            .decorations(false)
            .always_on_top(true)
            .skip_taskbar(true)
            .transparent(true)
            .resizable(false)
            .visible(false)
            .build();

            let saved = load_mode(&app.state::<DbState>());
            if saved == AppMode::Floating {
                *app.state::<ModeState>().0.lock().unwrap() = AppMode::Floating;
                let _ = rebuild_tray(app.handle(), &AppMode::Floating);
                if let Some(fb) = app.get_webview_window("floating-ball") {
                    let _ = fb.show();
                    let _ = fb.set_focus();
                }
            } else if let Some(w) = app.get_webview_window("main") {
                let _ = w.show();
                let _ = w.set_focus();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            translate::translate_text,
            db::load_settings,
            db::save_setting,
            db::get_translation_history,
            db::get_translation_history_count,
            db::delete_translation_history,
            db::save_input_history,
            db::get_input_history,
            db::get_input_history_count,
            db::delete_input_history,
            db::get_prompt_templates,
            db::save_prompt_template,
            db::delete_prompt_template,
            db::set_default_prompt_template,
            domain::resolve_dns,
            domain::ping_domain,
            domain::check_ssl,
            commands::get_app_mode,
            commands::enable_autostart_cmd,
            commands::open_tool_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
