/** CSVの1項目をエスケープする(カンマ・改行・引用符を含む場合は " で囲む) */
export function toCsvField(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? '' : String(value)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** 行の配列をCSV本文にする。改行は Excel に合わせて CRLF。 */
export function buildCsv(rows: readonly (readonly (string | number | null | undefined)[])[]): string {
  return rows.map(row => row.map(toCsvField).join(',')).join('\r\n') + '\r\n'
}

/**
 * CSVをダウンロードさせる。
 * Excel で開いたときに文字化けしないよう UTF-8 の BOM を付ける。
 */
export function downloadCsv(fileName: string, csv: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** ファイル名に使えない文字を置き換える */
export function toSafeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'wordbook'
}
