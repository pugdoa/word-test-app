'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Suspense } from 'react'

type Word = {
  id: string
  sort_order: number
  word: string
  meaning: string
}

function TestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const wordbookId = searchParams.get('wordbookId')
  const wordbookName = searchParams.get('wordbookName') ?? '単語テスト'

  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [rangeInput, setRangeInput] = useState('')
  const [countInput, setCountInput] = useState('50')
  const [shuffle, setShuffle] = useState(true)
  const [testTitle, setTestTitle] = useState(wordbookName)
  const [dateInput, setDateInput] = useState('')
  const [currentSet, setCurrentSet] = useState<Word[]>([])
  const [activeTab, setActiveTab] = useState<'test' | 'answer'>('test')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!wordbookId) { router.push('/dashboard'); return }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      supabase
        .from('words')
        .select('id, sort_order, word, meaning')
        .eq('wordbook_id', wordbookId)
        .order('sort_order', { ascending: true })
        .then(({ data }) => {
          if (data) setWords(data)
          setLoading(false)
        })
    })
  }, [wordbookId, router])

  const parseRanges = (str: string, maxId: number): Set<number> => {
    const idSet = new Set<number>()
    const tokens = str.split(/[,、\s]+/).map(t => t.trim()).filter(t => t.length > 0)
    for (const tok of tokens) {
      const m = tok.match(/^(\d+)\s*-\s*(\d+)$/)
      if (m) {
        let start = parseInt(m[1]), end = parseInt(m[2])
        if (start > end) [start, end] = [end, start]
        for (let n = start; n <= end; n++) {
          if (n >= 1 && n <= maxId) idSet.add(n)
        }
      } else if (/^\d+$/.test(tok)) {
        const n = parseInt(tok)
        if (n >= 1 && n <= maxId) idSet.add(n)
      }
    }
    return idSet
  }

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const handleGenerate = () => {
    setMessage('')
    let pool = words

    if (rangeInput.trim()) {
      const idSet = parseRanges(rangeInput, words.length)
      if (idSet.size === 0) { setMessage('指定した範囲に該当する単語がありません。'); return }
      pool = words.filter(w => idSet.has(w.sort_order))
    }

    const count = Math.min(parseInt(countInput) || 50, pool.length)
    const ordered = shuffle ? shuffleArray(pool) : [...pool]
    const selected = ordered.slice(0, count)
    setCurrentSet(selected)
    setActiveTab('test')

    let msg = `${selected.length}語のテストを作成しました。`
    if (rangeInput) msg += `(対象: ${pool.length}語)`
    setMessage(msg)
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー(印刷時非表示) */}
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center print:hidden">
        <h1 className="text-xl font-bold text-gray-900">英単語テスト作成</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-gray-700"
        >
          ← 単語帳一覧に戻る
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* 設定パネル(印刷時非表示) */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 print:hidden">
          <h2 className="font-bold text-gray-900 mb-4">
            {wordbookName}({words.length}語)
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                出題範囲(ID・任意)
              </label>
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder="例: 51-100 / 1-50,101-150"
                className="w-full border rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">出題数</label>
              <input
                type="number"
                value={countInput}
                onChange={(e) => setCountInput(e.target.value)}
                min="1"
                max={words.length}
                className="w-full border rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">テスト名</label>
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
              <input
                type="text"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                placeholder="例: 7/18"
                className="w-full border rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffle}
                onChange={(e) => setShuffle(e.target.checked)}
                className="w-4 h-4"
              />
              シャッフルする
            </label>
            <button
              onClick={handleGenerate}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold"
            >
              テストを作成する
            </button>
            {currentSet.length > 0 && (
              <button
                onClick={handleGenerate}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm"
              >
                再抽出
              </button>
            )}
          </div>
          {message && (
            <p className="mt-3 text-sm text-blue-600">{message}</p>
          )}
        </div>

        {/* テスト用紙 */}
        {currentSet.length > 0 && (
          <>
            {/* タブ(印刷時非表示) */}
            <div className="flex gap-2 mb-4 print:hidden">
              <button
                onClick={() => setActiveTab('test')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'test' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border'}`}
              >
                問題用紙
              </button>
              <button
                onClick={() => setActiveTab('answer')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'answer' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border'}`}
              >
                解答用紙
              </button>
<div className="ml-auto flex flex-col items-end gap-1">
  <button
    onClick={handlePrint}
    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-semibold"
  >
    問題用紙・解答用紙を印刷する
  </button>
  <p className="text-xs text-gray-400">
    ※印刷時は「ヘッダーとフッター」のチェックを外してください
  </p>
</div>            </div>

            {/* 問題用紙 */}
            <div className={`bg-white rounded-lg shadow-sm p-8 ${activeTab !== 'test' ? 'hidden print:block' : ''}`}>
              <div className="flex justify-between items-end border-b-2 border-gray-900 pb-3 mb-6">
                <h3 className="text-2xl font-bold text-gray-900">{testTitle}</h3>
                <div className="text-right text-sm text-gray-700">
                  <div>日付: {dateInput || '　　　　'}</div>
                  <div>名前: 　　　　　　　得点: 　　/{currentSet.length}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-8">
                {currentSet.map((item, i) => (
                  <div key={item.id} className="flex items-baseline gap-2 py-2 border-b border-dotted border-gray-300">
                    <span className="text-gray-400 w-8 text-sm">{i + 1}.</span>
                    <span className="font-semibold text-gray-900 w-28">{item.word}</span>
                    <span className="flex-1 border-b border-gray-400"></span>
                  </div>
                ))}
              </div>
            </div>

            {/* 解答用紙 */}
            <div className={`bg-white rounded-lg shadow-sm p-8 mt-4 print:mt-0 print:page-break-before-always ${activeTab !== 'answer' ? 'hidden print:block' : ''}`}>
              <div className="flex justify-between items-end border-b-2 border-gray-900 pb-3 mb-6">
                <h3 className="text-2xl font-bold text-gray-900">{testTitle}(解答)</h3>
                <div className="text-right text-sm text-gray-700">
                  <div>日付: {dateInput || '　　　　'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-8">
                {currentSet.map((item, i) => (
                  <div key={item.id} className="flex items-baseline gap-2 py-2 border-b border-dotted border-gray-300">
                    <span className="text-gray-400 w-8 text-sm">{i + 1}.</span>
                    <span className="font-semibold text-gray-900 w-28">{item.word}</span>
                    <span className="flex-1 text-red-600 font-semibold">{item.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default function TestPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
      <TestPage />
    </Suspense>
  )
}