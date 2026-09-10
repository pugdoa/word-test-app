'use client'
import { useMemo, useRef, useState } from 'react'
import { parseWordCsv } from '@/lib/parseWordCsv'
import { readTextFile, type DetectedEncoding } from '@/lib/readTextFile'
import { downloadTemplateCsv } from '@/lib/csvTemplate'

type Props = {
  /** 取り込み対象のテキスト(貼り付け・ファイル読み込みの両方でここに入る) */
  value: string
  onChange: (text: string) => void
  /** テキストエリアの高さクラス */
  heightClass?: string
}

const ACCEPT = '.csv,.tsv,.txt,text/csv,text/plain'
const PREVIEW_COUNT = 5

export default function CsvImportField({ value, onChange, heightClass = 'h-48' }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [encoding, setEncoding] = useState<DetectedEncoding | null>(null)
  const [fileError, setFileError] = useState('')
  const [dragging, setDragging] = useState(false)

  const result = useMemo(() => parseWordCsv(value), [value])

  const loadFile = async (file: File) => {
    setFileError('')
    try {
      const { text, encoding } = await readTextFile(file)
      onChange(text)
      setFileName(file.name)
      setEncoding(encoding)
    } catch {
      setFileError('ファイルを読み込めませんでした。')
      setFileName('')
      setEncoding(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) loadFile(file)
  }

  return (
    <div>
      {/* ファイル選択 / ドラッグ&ドロップ */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg px-4 py-5 text-center mb-3 transition-colors ${
          dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) loadFile(file)
            // 同じファイルを続けて選べるようにリセットする
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold"
        >
          CSVファイルを選択
        </button>
        <p className="text-xs text-gray-500 mt-2">
          ここにファイルをドラッグ＆ドロップしてもかまいません(.csv / .tsv / .txt)
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Excelの「CSV UTF-8」「CSV(コンマ区切り)」どちらでも読み込めます
        </p>
      </div>

      {/* 書き方の案内 */}
      <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-xs font-semibold text-gray-700">
            列は4列です。意味が増えても列は増えません。
          </p>
          <button
            type="button"
            onClick={() => downloadTemplateCsv()}
            className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold"
          >
            ⬇ フォーマットをダウンロード
          </button>
        </div>
        <ol className="text-xs text-gray-600 space-y-0.5 list-decimal list-inside">
          <li>単語</li>
          <li>重要な意味（1つ目だけ）</li>
          <li>その他の意味（2つ目以降をまとめて書く・省略可）</li>
          <li>意味の数（省略可）</li>
        </ol>
        <p className="text-xs text-gray-500 mt-2 font-mono">abandon,を捨てる,を断念する / を見捨てる,3</p>
        <p className="text-xs text-gray-400 mt-1">
          意味にカンマを含むときは、その項目を &quot;
          &quot; で囲んでください。1行目の見出しは自動で読み飛ばします。
        </p>
      </div>

      {fileName && value !== '' && (
        <p className="text-xs text-gray-600 mb-2">
          読み込んだファイル: <span className="font-medium">{fileName}</span>
          {encoding && <span className="text-gray-400">（文字コード: {encoding}）</span>}
        </p>
      )}
      {fileError && <p className="text-xs text-red-600 mb-2">{fileError}</p>}

      {/* 直接貼り付け */}
      <textarea
        value={value}
        onChange={(e) => {
          // 手で編集された時点でファイル由来ではなくなる
          setFileName('')
          setEncoding(null)
          setFileError('')
          onChange(e.target.value)
        }}
        placeholder={`abandon,捨てる,見捨てる・断念する,3\nbrilliant,輝かしい,,1\nrun,走る`}
        className={`w-full border rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 ${heightClass} font-mono text-sm`}
      />

      {/* 取り込みプレビュー */}
      {value.trim() !== '' && (
        <div className="mt-3 border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-sm font-semibold text-gray-800">
              読み取り結果: {result.items.length}語
            </span>
            {result.headerSkipped && (
              <span className="text-xs text-gray-500">見出し行は読み飛ばしました</span>
            )}
            {result.skipped.length > 0 && (
              <span className="text-xs text-red-600">
                {result.skipped.length}行は形式が合わないため取り込まれません
              </span>
            )}
          </div>

          {result.items.length > 0 ? (
            <table className="w-full text-xs">
              <thead className="bg-white border-b text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">単語</th>
                  <th className="px-3 py-2 text-left font-medium">重要な意味</th>
                  <th className="px-3 py-2 text-left font-medium">その他の意味</th>
                  <th className="px-3 py-2 text-left font-medium w-16">意味の数</th>
                </tr>
              </thead>
              <tbody>
                {result.items.slice(0, PREVIEW_COUNT).map((w, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="px-3 py-1.5 text-gray-900 font-medium">{w.word}</td>
                    <td className="px-3 py-1.5 text-gray-700">{w.main_meaning}</td>
                    <td className="px-3 py-1.5 text-gray-500">{w.other_meanings ?? '-'}</td>
                    <td className="px-3 py-1.5 text-gray-500">{w.meaning_count ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-3 text-xs text-gray-500">
              単語を読み取れませんでした。「単語,重要な意味」の形式か確認してください。
            </p>
          )}

          {result.items.length > PREVIEW_COUNT && (
            <p className="px-3 py-2 text-xs text-gray-400 border-t">
              ほか{result.items.length - PREVIEW_COUNT}語（先頭{PREVIEW_COUNT}語のみ表示）
            </p>
          )}

          {result.skipped.length > 0 && (
            <div className="px-3 py-2 border-t bg-red-50">
              <p className="text-xs text-red-700 font-medium mb-1">取り込まれない行</p>
              <ul className="text-xs text-red-600 space-y-0.5">
                {result.skipped.slice(0, PREVIEW_COUNT).map((s) => (
                  <li key={s.line} className="font-mono truncate">
                    {s.line}行目: {s.text}
                  </li>
                ))}
                {result.skipped.length > PREVIEW_COUNT && (
                  <li className="text-red-400">
                    ほか{result.skipped.length - PREVIEW_COUNT}行
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
