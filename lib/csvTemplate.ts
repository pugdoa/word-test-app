import { buildCsv, downloadCsv } from '@/lib/csv'

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

export function buildTemplateCsv(): string {
  return buildCsv([TEMPLATE_HEADER, ...TEMPLATE_ROWS])
}

export function downloadTemplateCsv(fileName = '単語帳フォーマット.csv') {
  downloadCsv(fileName, buildTemplateCsv())
}
