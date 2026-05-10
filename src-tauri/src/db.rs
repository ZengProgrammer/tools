use std::collections::HashMap;
use std::sync::Mutex;
use rusqlite::Connection;
use tauri::Manager;

pub struct DbState(pub Mutex<Connection>);

pub fn init_db(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let exe_dir = std::env::current_exe()?
        .parent()
        .ok_or("Cannot determine exe directory")?
        .to_path_buf();
    let data_dir = exe_dir.join("data");
    std::fs::create_dir_all(&data_dir)?;
    let db_path = data_dir.join("tools.db");
    let conn = Connection::open(&db_path)?;
    conn.execute_batch("PRAGMA journal_mode=WAL;")?;
    conn.execute_batch("PRAGMA synchronous=FULL;")?;
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS translation_history (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            source_text TEXT NOT NULL,
            source_lang TEXT NOT NULL,
            target_lang TEXT NOT NULL,
            result_text TEXT NOT NULL,
            model       TEXT NOT NULL,
            created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS input_history (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            tool        TEXT NOT NULL,
            input_text  TEXT NOT NULL,
            created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
        );",
    )?;
    app.manage(DbState(Mutex::new(conn)));
    Ok(())
}

#[tauri::command]
pub fn load_settings(state: tauri::State<'_, DbState>) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT key, value FROM settings").map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)))
        .map_err(|e| e.to_string())?;
    let mut settings = HashMap::new();
    for row in rows {
        let (k, v) = row.map_err(|e| e.to_string())?;
        settings.insert(k, v);
    }
    serde_json::to_string(&settings).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_setting(state: tauri::State<'_, DbState>, key: String, value: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2",
        rusqlite::params![key, value],
    ).map_err(|e| e.to_string())?;
    let _ = conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);");
    Ok(())
}

#[derive(serde::Serialize)]
pub struct TranslationRecord {
    pub id: i64,
    pub source_text: String,
    pub source_lang: String,
    pub target_lang: String,
    pub result_text: String,
    pub model: String,
    pub created_at: String,
}

#[tauri::command]
pub fn get_translation_history(state: tauri::State<'_, DbState>, offset: i64, limit: i64, sort_desc: bool) -> Result<Vec<TranslationRecord>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let order = if sort_desc { "DESC" } else { "ASC" };
    let sql = format!("SELECT id, source_text, source_lang, target_lang, result_text, model, created_at FROM translation_history ORDER BY created_at {} LIMIT ?1 OFFSET ?2", order);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(rusqlite::params![limit, offset], |row| Ok(TranslationRecord {
        id: row.get(0)?, source_text: row.get(1)?, source_lang: row.get(2)?, target_lang: row.get(3)?,
        result_text: row.get(4)?, model: row.get(5)?, created_at: row.get(6)?,
    })).map_err(|e| e.to_string())?;
    let mut records = Vec::new();
    for row in rows { records.push(row.map_err(|e| e.to_string())?); }
    Ok(records)
}

#[tauri::command]
pub fn delete_translation_history(state: tauri::State<'_, DbState>, ids: Vec<i64>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    if ids.is_empty() {
        conn.execute("DELETE FROM translation_history", []).map_err(|e| e.to_string())?;
    } else {
        let placeholders = ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let sql = format!("DELETE FROM translation_history WHERE id IN ({})", placeholders);
        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
        let params: Vec<Box<dyn rusqlite::types::ToSql>> = ids.iter().map(|id| Box::new(*id) as Box<dyn rusqlite::types::ToSql>).collect();
        stmt.execute(rusqlite::params_from_iter(params.iter().map(|p| p.as_ref()))).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ---- Input History (JSON / SQL tools) ----

#[derive(serde::Serialize)]
pub struct InputRecord { pub id: i64, pub tool: String, pub input_text: String, pub created_at: String }

#[tauri::command]
pub fn save_input_history(state: tauri::State<'_, DbState>, tool: String, input_text: String) -> Result<(), String> {
    if input_text.trim().is_empty() { return Ok(()); }
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("INSERT INTO input_history (tool, input_text) VALUES (?1, ?2)", rusqlite::params![tool, input_text])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_input_history(state: tauri::State<'_, DbState>, tool: String, offset: i64, limit: i64, sort_desc: bool) -> Result<Vec<InputRecord>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let order = if sort_desc { "DESC" } else { "ASC" };
    let sql = format!("SELECT id, tool, input_text, created_at FROM input_history WHERE tool = ?1 ORDER BY created_at {} LIMIT ?2 OFFSET ?3", order);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(rusqlite::params![tool, limit, offset], |row| Ok(InputRecord {
        id: row.get(0)?, tool: row.get(1)?, input_text: row.get(2)?, created_at: row.get(3)?,
    })).map_err(|e| e.to_string())?;
    let mut records = Vec::new();
    for row in rows { records.push(row.map_err(|e| e.to_string())?); }
    Ok(records)
}

#[tauri::command]
pub fn get_input_history_count(state: tauri::State<'_, DbState>, tool: String) -> Result<i64, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.query_row("SELECT COUNT(*) FROM input_history WHERE tool = ?1", rusqlite::params![tool], |row| row.get(0))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_input_history(state: tauri::State<'_, DbState>, tool: String, ids: Vec<i64>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    if ids.is_empty() {
        conn.execute("DELETE FROM input_history WHERE tool = ?1", rusqlite::params![tool]).map_err(|e| e.to_string())?;
    } else {
        let placeholders = ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let sql = format!("DELETE FROM input_history WHERE tool = ?1 AND id IN ({})", placeholders);
        conn.execute(&sql, rusqlite::params_from_iter(
            std::iter::once(&tool as &dyn rusqlite::types::ToSql).chain(ids.iter().map(|id| id as &dyn rusqlite::types::ToSql))
        )).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_translation_history_count(state: tauri::State<'_, DbState>) -> Result<i64, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.query_row("SELECT COUNT(*) FROM translation_history", [], |row| row.get(0)).map_err(|e| e.to_string())
}
