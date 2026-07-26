'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Word = {
  id: string
  sort_order: number
  word: string
  main_meaning: string
  other_meanings: string | null
  meaning_count: number | null
}

export default function WordbookEdit() {
  const router = useRouter()
  const params = useParams()
  const wordbookId = params.id as string

  const [wordbookName, setWordbookName] = useState('')
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editWord, setEditWord] = useState('')
  const [editMainMeaning, setEditMainMeaning] = useState('')
  const [editOtherMeanings, setEditOtherMeanings] = useState('')
  const [editMeaningCount, setEditMeaningCount] = useState('')
  const [newWord, setNewWord] = useState('')
  const [newMainMeaning, setNewMainMeaning] = useState('')
  const [newOtherMeanings, setNewOtherMeanings] = useState('')
  const [newMeaningCount, setNewMeaningCount] = useState('')
  const [bulkCsv, setBulkCsv] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      fetchWords()
    })
  }, [wordbookId])

  const fetchWords = async () => {
    const { data: wb } = await supabase
      .from('wordbooks')
      .select('name')
      .eq('id', wordbookId)
      .single()
    if (wb) setWordbookName(wb.name)

    const { data } = await supabase
      .from('words')
      .select('id, sort_order, word, main_meaning, other_meanings, meaning_count')
      .eq('wordbook_id', wordbookId)
      .order('sort_order', { ascending: true })
      .range(0, 1999)
    if (data) setWords(data)
    setLoading(false)
  }

  const handleEdit = (word: Word) => {
    setEditingId(word.id)
    setEditWord(word.word)
    setEditMainMeaning(word.main_meaning)
    setEditOtherMeanings(word.other_meanings ?? '')
    setEditMeaningCount(word.meaning_count?.toString() ?? '')
  }

  const handleSaveEdit = async (id: string) => {
    const { error } = await supabase
      .from('words')
      .update({
        word: editWord.trim(),
        main_meaning: editMainMeaning.trim(),
        other_meanings: editOtherMeanings.trim() || null,
        meaning_count: editMeaningCount ? parseInt(editMeaningCount) : null,
      })
      .eq('id', id)
    if (error) {
      setMessage('更新に失敗しました。')
    } else {
      setEditingId(null)
      setMessage('更新しました。')
      fetchWords()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この単語を削除しますか？')) return
    await supabase.from('words').delete().eq('id', id)
    setMessage('削除しました。')
    fetchWords()
  }

  const handleAddWord = async () => {
    if (!newWord.trim() || !newMainMeaning.trim()) {
      setMessage('単語と重要な意味を入力してください。')
      return
    }
    const maxOrder = words.length > 0 ? Math.max(...words.map(w => w.sort_order)) : 0
    const { error } = await supabase.from('words').insert({
      wordbook_id: wordbookId,
      sort_order: maxOrder + 1,
      word: newWord.trim(),
      main_meaning: newMainMeaning.trim(),
      other_meanings: newOtherMeanings.trim() || null,
      meaning_count: newMeaningCount ? parseInt(newMeaningCount) : null,
    })
    if (error) {
      setMessage('追加に失敗しました。')
    } else {
      setNewWord('')
      setNewMainMeaning('')
      setNewOtherMeanings('')
      setNewMeaningCount('')
      setMessage('追加しました。')
      fetchWords()
    }
  }

  const handleBulkAdd = async () => {
    if (!bulkCsv.trim()) { setMessage('単語データを入力してください。'); return }
    const lines = bulkCsv.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
    const items: { word: string; main_meaning: string; other_meanings: string | null; meaning_count: number | null }[] = []
    for (const line of lines) {
      const sep = line.includes('\t') ? '\t' : ','
      const parts = line.split(sep)
      if (parts.length < 2) continue
      const word = parts[0].trim()
      const main_meaning = parts[1].trim()
      const other_meanings = parts[2]?.trim() || null
      const meaning_count = parts[3]?.trim() ? parseInt(parts[3].trim()) : null
      if (word && main_meaning) items.push({ word, main_meaning, other_meanings, meaning_count })
    }
    if (items.length === 0) { setMessage('単語を読み取れませんでした。'); return }

    setBulkSaving(true)
    const maxOrder = words.length > 0 ? Math.max(...words.map(w => w.sort_order)) : 0
    const wordsToInsert = items.map((w, i) => ({
      wordbook_id: wordbookId,
      sort_order: maxOrder + i + 1,
      word: w.word,
      main_meaning: w.main_meaning,
      other_meanings: w.other_meanings,
      meaning_count: w.meaning_count,
    }))

    const { error } = await supabase.from('words').insert(wordsToInsert)
    if (error) {
      setMessage('一括追加に失敗しました。')
    } else {
      setBulkCsv('')
      setMessage(`${items.length}語を一括追加しました！`)
      fetchWords()
    }
    setBulkSaving(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">単語帳の編集</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-gray-700"
        >
          ← 単語帳一覧に戻る
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6">
          {wordbookName}({words.length}語)
        </h2>

        {message && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">{message}</div>
        )}

        {/* 1件追加フォーム */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">単語を追加</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="単語"
              className="border rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            />
            <input
              type="text"
              value={newMainMeaning}
              onChange={(e) => setNewMainMeaning(e.target.value)}
              placeholder="重要な意味"
              className="border rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            />
            <input
              type="text"
              value={newOtherMeanings}
              onChange={(e) => setNewOtherMeanings(e.target.value)}
              placeholder="その他の意味(任意)"
              className="border rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            />
            <input
              type="number"
              value={newMeaningCount}
              onChange={(e) => setNewMeaningCount(e.target.value)}
              placeholder="意味の数(任意)"
              className="border rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            />
          </div>
          <button
            onClick={handleAddWord}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            追加
          </button>
        </div>

        {/* 一括追加フォーム */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-2">CSVで一括追加</h3>
          <p className="text-xs text-gray-500 mb-3">
            「単語,重要な意味,その他の意味,意味の数」を1行ずつ貼り付けてください。その他の意味・意味の数は省略可能です。
          </p>
          <textarea
            value={bulkCsv}
            onChange={(e) => setBulkCsv(e.target.value)}
            placeholder={`abandon,捨てる,見捨てる・断念する,3\nbrilliant,輝かしい,,1`}
            className="w-full border rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 h-48 font-mono text-sm mb-3"
          />
          <button
            onClick={handleBulkAdd}
            disabled={bulkSaving}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {bulkSaving ? '追加中...' : '一括追加する'}
          </button>
        </div>

        {/* 単語一覧 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600 w-12">No.</th>
                <th className="px-4 py-3 text-left text-gray-600">単語</th>
                <th className="px-4 py-3 text-left text-gray-600">重要な意味</th>
                <th className="px-4 py-3 text-left text-gray-600">その他の意味</th>
                <th className="px-4 py-3 text-left text-gray-600 w-16">意味数</th>
                <th className="px-4 py-3 text-right text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {words.map((w) => (
                <tr key={w.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{w.sort_order}</td>
                  {editingId === w.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editWord}
                          onChange={(e) => setEditWord(e.target.value)}
                          className="w-full border rounded px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editMainMeaning}
                          onChange={(e) => setEditMainMeaning(e.target.value)}
                          className="w-full border rounded px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editOtherMeanings}
                          onChange={(e) => setEditOtherMeanings(e.target.value)}
                          className="w-full border rounded px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={editMeaningCount}
                          onChange={(e) => setEditMeaningCount(e.target.value)}
                          className="w-full border rounded px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleSaveEdit(w.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs"
                          >
                            キャンセル
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-gray-900 font-medium">{w.word}</td>
                      <td className="px-4 py-3 text-gray-700">{w.main_meaning}</td>
                      <td className="px-4 py-3 text-gray-500">{w.other_meanings ?? '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{w.meaning_count ?? '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(w)}
                            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1 rounded text-xs"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(w.id)}
                            className="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 rounded text-xs"
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}