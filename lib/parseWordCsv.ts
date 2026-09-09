export type ParsedWord = {
  word: string
  main_meaning: string
  other_meanings: string | null
  meaning_count: number | null
}

export type SkippedRow = {
  /** 1始まりの行番号(引用符で囲まれた改行がある場合はファイル上の物理行とはずれる) */
  line: number
  text: string
}

export type ParseResult = {
  items: ParsedWord[]
  skipped: SkippedRow[]
  /** ヘッダー行を読み飛ばしたか */
  headerSkipped: boolean
}

const HEADER_FIRST_CELL = /^(単語|英単語|英語|word|words|term)$/i

/**
 * 区切り文字を推定する。1行目にタブがあればタブ区切り(Excelからの貼り付け)、
 * 無ければカンマ区切りとみなす。
 */
function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r\n|\r|\n/, 1)[0] ?? ''
  return firstLine.includes('\t') ? '\t' : ','
}

/**
 * RFC 4180 に沿って行・列に分解する。
 * 引用符で囲まれたフィールド内の区切り文字・改行・"" によるエスケープを正しく扱う。
 */
function splitRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let inQuotes = false
  let i = 0

  const endField = () => {
    row.push(quoted ? field : field.trim())
    field = ''
    quoted = false
  }
  const endRow = () => {
    endField()
    rows.push(row)
    row = []
  }

  while (i < text.length) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += ch
      i++
      continue
    }

    // フィールドの先頭にある引用符だけを引用開始として扱う
    if (ch === '"' && field.trim() === '') {
      inQuotes = true
      quoted = true
      field = ''
      i++
      continue
    }
    if (ch === delimiter) {
      endField()
      i++
      continue
    }
    if (ch === '\r') {
      endRow()
      i += text[i + 1] === '\n' ? 2 : 1
      continue
    }
    if (ch === '\n') {
      endRow()
      i++
      continue
    }
    field += ch
    i++
  }
  endRow()
  return rows
}

/**
 * 「単語,重要な意味,その他の意味,意味の数」形式のテキストを解析する。
 * その他の意味・意味の数は省略可能。ヘッダー行があれば読み飛ばす。
 */
export function parseWordCsv(text: string): ParseResult {
  const normalized = text.replace(/^﻿/, '')
  if (!normalized.trim()) return { items: [], skipped: [], headerSkipped: false }

  const rows = splitRows(normalized, detectDelimiter(normalized))

  let headerSkipped = false
  let startIndex = 0
  if (rows.length > 0 && HEADER_FIRST_CELL.test((rows[0][0] ?? '').trim())) {
    headerSkipped = true
    startIndex = 1
  }

  const items: ParsedWord[] = []
  const skipped: SkippedRow[] = []

  for (let r = startIndex; r < rows.length; r++) {
    const cells = rows[r]
    const raw = cells.join(' , ').trim()
    if (raw === '') continue // 空行は読み飛ばし扱いにしない

    const word = (cells[0] ?? '').trim()
    const main_meaning = (cells[1] ?? '').trim()
    if (!word || !main_meaning) {
      skipped.push({ line: r + 1, text: raw })
      continue
    }

    const other_meanings = (cells[2] ?? '').trim() || null
    const rawCount = (cells[3] ?? '').trim()
    const parsedCount = rawCount ? parseInt(rawCount, 10) : NaN
    const meaning_count = Number.isNaN(parsedCount) ? null : parsedCount

    items.push({ word, main_meaning, other_meanings, meaning_count })
  }

  return { items, skipped, headerSkipped }
}
