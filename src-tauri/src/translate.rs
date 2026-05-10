use serde_json::Value;
use crate::db::DbState;

#[tauri::command]
pub async fn translate_text(
    state: tauri::State<'_, DbState>,
    api_key: String,
    model: String,
    source_lang: String,
    target_lang: String,
    text: String,
    system_prompt: String,
) -> Result<String, String> {
    let source_desc = if source_lang == "auto" { "".to_string() } else { source_lang.clone() };
    let prompt = if source_lang == "auto" {
        system_prompt.replace("{source}", "").replace("{target}", &target_lang).replace("从翻译", "翻译")
    } else {
        system_prompt.replace("{source}", &source_desc).replace("{target}", &target_lang)
    };
    let body = serde_json::json!({
        "model": model,
        "messages": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": text}
        ],
        "temperature": 0.3,
        "max_tokens": 4096
    });
    let client = reqwest::Client::new();
    let response = client.post("https://api.deepseek.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body).send().await
        .map_err(|e| format!("Request failed: {}", e))?;
    if !response.status().is_success() {
        return Err(format!("API error ({}): {}", response.status(), response.text().await.unwrap_or_default()));
    }
    let json: Value = response.json().await.map_err(|e| format!("Failed to parse response: {}", e))?;
    let content = json["choices"][0]["message"]["content"].as_str()
        .ok_or_else(|| "Unexpected API response structure".to_string())?;
    let result = content.trim().to_string();
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO translation_history (source_text, source_lang, target_lang, result_text, model) VALUES (?1,?2,?3,?4,?5)",
        rusqlite::params![text, source_lang, target_lang, result, model],
    ).map_err(|e| format!("Failed to save history: {}", e))?;
    Ok(result)
}
