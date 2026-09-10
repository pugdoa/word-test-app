/**
 * 取り込み用CSVの雛形。
 * 列は常に4列で、意味が増えても列は増えない。
 * 2つ目以降の意味は3列目にまとめて書き、4列目に総数を入れる。
 */
export const TEMPLATE_HEADER = ['単語', '重要な意味', 'その他の意味', '意味の数'] as const

export const TEMPLATE_ROWS: string[][] = [
  ['run', '走る', '', '1'],
  ['create', 'を創り出す', 'を引き起こす', '2'],
  ['abandon', 'を捨てる', 'を断念する / を見捨てる', '3'],
  // 意味にカンマを含む場合は自動で " で囲まれる(4列目は総数なので5)
  ['charge', 'を請求する', 'を告発する / 充電する / 突撃する / 料金, 手数料', '5'],
]

/** CSVの1項目をエスケープする(カンマ・改行・引用符を含む場合は " で囲む) */
function toCsvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function buildTemplateCsv(): string {
  const lines = [TEMPLATE_HEADER as readonly string[], ...TEMPLATE_ROWS]
  return lines.map(row => row.map(toCsvField).join(',')).join('\r\n') + '\r\n'
}

/**
 * 雛形CSVをダウンロードさせる。
 * Excel で開いたときに文字化けしないよう UTF-8 の BOM を付ける。
 */
export function downloadTemplateCsv(fileName = '単語帳フォーマット.csv') {
  const blob = new Blob(['﻿' + buildTemplateCsv()], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
