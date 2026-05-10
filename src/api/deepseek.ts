import { invoke } from '@tauri-apps/api/core'

// ---- Settings ----

export function loadSettings(): Promise<Record<string, string>> {
  return invoke<string>('load_settings').then((json) => JSON.parse(json || '{}'))
}

export function saveSetting(key: string, value: string): Promise<void> {
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

export function translate(params: TranslateParams): Promise<string> {
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

export function getHistory(offset: number, limit: number, sortDesc = true): Promise<HistoryRecord[]> {
  return invoke('get_translation_history', { offset, limit, sortDesc })
}

export function getHistoryCount(): Promise<number> {
  return invoke('get_translation_history_count')
}

export function deleteHistory(ids: number[]): Promise<void> {
  return invoke('delete_translation_history', { ids })
}

// ---- Input History (JSON / SQL) ----

export interface InputRecord {
  id: number
  tool: string
  input_text: string
  created_at: string
}

export function saveInputHistory(tool: string, inputText: string): Promise<void> {
  return invoke('save_input_history', { tool, inputText })
}

export function getInputHistory(tool: string, offset: number, limit: number, sortDesc = true): Promise<InputRecord[]> {
  return invoke('get_input_history', { tool, offset, limit, sortDesc })
}

export function getInputHistoryCount(tool: string): Promise<number> {
  return invoke('get_input_history_count', { tool })
}

export function deleteInputHistory(tool: string, ids: number[]): Promise<void> {
  return invoke('delete_input_history', { tool, ids })
}
