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

// ---- Prompt Templates ----

export interface PromptTemplate {
  id: number
  description: string
  content: string
  is_default: boolean
  created_at: string
}

export function getPromptTemplates(): Promise<PromptTemplate[]> {
  return invoke('get_prompt_templates')
}

export function savePromptTemplate(description: string, content: string): Promise<void> {
  return invoke('save_prompt_template', { description, content })
}

export function deletePromptTemplate(id: number): Promise<void> {
  return invoke('delete_prompt_template', { id })
}

export function setDefaultPromptTemplate(id: number): Promise<void> {
  return invoke('set_default_prompt_template', { id })
}

// ---- Domain Checker ----

export interface DnsResult { addresses: string[]; error: string | null }
export interface PingStats { sent: number; received: number; lost: number; min_ms: number; max_ms: number; avg_ms: number }
export interface PingResult { success: boolean; output: string; stats: PingStats | null }
export interface SslResult {
  valid: boolean; subject: string | null; issuer: string | null
  not_before: string | null; not_after: string | null
  days_remaining: number | null; error: string | null
}

export function resolveDns(domain: string): Promise<DnsResult> {
  return invoke('resolve_dns', { domain })
}

export function pingDomain(domain: string): Promise<PingResult> {
  return invoke('ping_domain', { domain })
}

export function checkSsl(domain: string): Promise<SslResult> {
  return invoke('check_ssl', { domain })
}
