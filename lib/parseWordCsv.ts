export type ParsedWord = {
  word: string
  main_meaning: string
  other_meanings: string | null
  meaning_count: number | null
}

/**
 * 「単語,重要な意味,その他の意味,意味の数」形式のテキストを解析する。
 * 区切りは行ごとにタブ優先で判定する(Excelからの貼り付けに対応)。
 * その他の意味・意味の数は省略可能。
 */
export function parseWordCsv(text: string): ParsedWord[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
  const items: ParsedWord[] = []
  for (const line of lines) {
    const sep = line.includes('\t') ? '\t' : ','
    const parts = line.split(sep)
    if (parts.length < 2) continue
    const word = parts[0].trim()
    const main_meaning = parts[1].trim()
    const other_meanings = parts[2]?.trim() || null
    const rawCount = parts[3]?.trim()
    const parsedCount = rawCount ? parseInt(rawCount, 10) : NaN
    const meaning_count = Number.isNaN(parsedCount) ? null : parsedCount
    if (word && main_meaning) items.push({ word, main_meaning, other_meanings, meaning_count })
  }
  return items
}
