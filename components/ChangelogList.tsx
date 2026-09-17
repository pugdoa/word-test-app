'use client'
import { useState } from 'react'
import { CHANGELOG } from '@/lib/changelog'

/** 既定で開いておく件数。残りは「もっと見る」で展開する */
const INITIAL_COUNT = 3

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${y}年${Number(m)}月${Number(d)}日`
}

export default function ChangelogList() {
  const [expanded, setExpanded] = useState(false)
  if (CHANGELOG.length === 0) return null

  const shown = expanded ? CHANGELOG : CHANGELOG.slice(0, INITIAL_COUNT)
  const rest = CHANGELOG.length - INITIAL_COUNT

  return (
    <section className="mt-12 border-t pt-6 print:hidden">
      <h2 className="text-sm font-bold text-gray-700 mb-4">更新履歴</h2>

      <ol className="space-y-4">
        {shown.map((entry) => (
          <li key={entry.date} className="flex flex-col sm:flex-row sm:gap-4">
            <time
              dateTime={entry.date}
              className="text-xs text-gray-500 sm:w-32 sm:shrink-0 sm:pt-0.5"
            >
              {formatDate(entry.date)}
            </time>
            <ul className="mt-1 sm:mt-0 space-y-1">
              {entry.items.map((text, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-gray-300 select-none">・</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      {rest > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-xs text-gray-500 hover:text-gray-800 underline"
        >
          {expanded ? '閉じる' : `過去の更新を見る（ほか${rest}件）`}
        </button>
      )}
    </section>
  )
}
