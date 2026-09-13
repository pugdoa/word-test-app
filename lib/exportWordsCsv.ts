import { buildCsv, downloadCsv, toSafeFileName } from '@/lib/csv'
import { fetchAllWords, type Word } from '@/lib/fetchAllWords'
import { TEMPLATE_HEADER } from '@/lib/csvTemplate'
import { supabase } from '@/lib/supabase'

/** 単語帳1冊分のCSV。取り込み形式と同じ4列なので、そのまま再取り込みできる。 */
export function buildWordbookCsv(words: readonly Word[]): string {
  return buildCsv([
    TEMPLATE_HEADER,
    ...words.map(w => [w.word, w.main_meaning, w.other_meanings, w.meaning_count]),
  ])
}

export function downloadWordbookCsv(wordbookName: string, words: readonly Word[]) {
  downloadCsv(`${toSafeFileName(wordbookName)}.csv`, buildWordbookCsv(words))
}

/**
 * 全単語帳をまとめたCSV。単語帳名の列が1列目に増えるため、
 * このファイルはそのままでは取り込めない(バックアップ用)。
 */
export const ALL_HEADER = ['単語帳', ...TEMPLATE_HEADER] as const

export async function downloadAllWordbooksCsv(
  onProgress?: (done: number, total: number) => void
): Promise<{ wordbooks: number; words: number }> {
  const { data: books, error } = await supabase
    .from('wordbooks')
    .select('id, name')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)

  const list = books ?? []
  const rows: (string | number | null)[][] = [[...ALL_HEADER]]
  let total = 0

  for (let i = 0; i < list.length; i++) {
    const b = list[i]
    const { words, error: wErr } = await fetchAllWords(b.id)
    if (wErr) throw new Error(wErr)
    for (const w of words) {
      rows.push([b.name, w.word, w.main_meaning, w.other_meanings, w.meaning_count])
    }
    total += words.length
    onProgress?.(i + 1, list.length)
  }

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  downloadCsv(`英単語テスト_全単語帳_${stamp}.csv`, buildCsv(rows))
  return { wordbooks: list.length, words: total }
}
