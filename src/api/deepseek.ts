import { invoke } from '@tauri-apps/api/core'

// ---- Settings ----

export async function loadSettings(): Promise<Record<string, string>> {
  const json: string = await invoke('load_settings')
  return JSON.parse(json || '{}')
}

export async function saveSetting(key: string, value: string): Promise<void> {
  return invoke('save_setting', { key, value })
}

// ---- Translation ----

export interface TranslateParams {
  apiKey: string
  model: string
  sourceLang: string
  targetLang: string
  text: string
  systemPrompt: string
}

export async function translate(params: TranslateParams): Promise<string> {
  return invoke('translate_text', {
    apiKey: params.apiKey,
    model: params.model,
    sourceLang: params.sourceLang,
    targetLang: params.targetLang,
    text: params.text,
    systemPrompt: params.systemPrompt,
  })
}

// ---- History ----

export interface HistoryRecord {
  id: number
  source_text: string
  source_lang: string
  target_lang: string
  result_text: string
  model: string
  created_at: string
}

export async function getHistory(offset: number, limit: number, sortDesc = true): Promise<HistoryRecord[]> {
  return invoke('get_translation_history', { offset, limit, sortDesc })
}

export async function getHistoryCount(): Promise<number> {
  return invoke('get_translation_history_count')
}

export async function deleteHistory(ids: number[]): Promise<void> {
  return invoke('delete_translation_history', { ids })
}

// ---- Input History (JSON / SQL) ----

export interface InputRecord { id: number; tool: string; input_text: string; created_at: string }

export async function saveInputHistory(tool: string, inputText: string): Promise<void> {
  return invoke('save_input_history', { tool, inputText })
}

export async function getInputHistory(tool: string, offset: number, limit: number, sortDesc = true): Promise<InputRecord[]> {
  return invoke('get_input_history', { tool, offset, limit, sortDesc })
}

export async function getInputHistoryCount(tool: string): Promise<number> {
  return invoke('get_input_history_count', { tool })
}

export async function deleteInputHistory(tool: string, ids: number[]): Promise<void> {
  return invoke('delete_input_history', { tool, ids })
}
