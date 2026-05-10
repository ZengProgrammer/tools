use tauri::Manager;
use crate::mode::ModeState;
use crate::autostart::enable_autostart;

#[tauri::command]
pub fn get_app_mode(state: tauri::State<'_, ModeState>) -> Result<String, String> {
    let mode = state.0.lock().map_err(|e| e.to_string())?;
    Ok(if *mode == crate::mode::AppMode::Desktop { "desktop".into() } else { "floating".into() })
}

#[tauri::command]
pub fn enable_autostart_cmd() -> Result<(), String> {
    enable_autostart()
}

#[tauri::command]
pub fn open_tool_window(app: tauri::AppHandle, tool: String) -> Result<(), String> {
    let label = format!("tool-{}", tool);
    if let Some(w) = app.get_webview_window(&label) {
        let _ = w.show();
        let _ = w.set_focus();
        return Ok(());
    }
    let (title, route) = match tool.as_str() {
        "translate" => ("翻译工具", "/tool/translate"),
        "json" => ("JSON工具", "/tool/json"),
        "sql" => ("SQL工具", "/tool/sql"),
        _ => return Err("Unknown tool".into()),
    };
    let win = tauri::WebviewWindowBuilder::new(&app, &label, tauri::WebviewUrl::App("index.html".into()))
        .title(title)
        .inner_size(700.0, 550.0)
        .min_inner_size(500.0, 350.0)
        .resizable(true)
        .center()
        .build()
        .map_err(|e| format!("{}", e))?;
    let _ = win.eval(&format!("window.location.hash = '{}'", route));
    Ok(())
}
