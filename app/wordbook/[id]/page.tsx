'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Word = {
  id: string
  sort_order: number
  word: string
  meaning: string
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
  const [editMeaning, setEditMeaning] = useState('')
  const [newWord, setNewWord] = useState('')
  const [newMeaning, setNewMeaning] = useState('')
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
      .select('id, sort_order, word, meaning')
      .eq('wordbook_id', wordbookId)
      .order('sort_order', { ascending: true })
    if (data) setWords(data)
    setLoading(false)
  }

  const handleEdit = (word: Word) => {
    setEditingId(word.id)
    setEditWord(word.word)
    setEditMeaning(word.meaning)
  }

  const handleSaveEdit = async (id: string) => {
    const { error } = await supabase
      .from('words')
      .update({ word: editWord.trim(), meaning: editMeaning.trim() })
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
    if (!newWord.trim() || !newMeaning.trim()) {
      setMessage('単語と意味を入力してください。')
      return
    }
    const maxOrder = words.length > 0 ? Math.max(...words.map(w => w.sort_order)) : 0
    const { error } = await supabase.from('words').insert({
      wordbook_id: wordbookId,
      sort_order: maxOrder + 1,
      word: newWord.trim(),
      meaning: newMeaning.trim(),
    })
    if (error) {
      setMessage('追加に失敗しました。')
    } else {
      setNewWord('')
      setNewMeaning('')
      setMessage('追加しました。')
      fetchWords()
    }
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

        {/* 単語追加フォーム */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">単語を追加</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="単語"
              className="flex-1 border rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            />
            <input
              type="text"
              value={newMeaning}
              onChange={(e) => setNewMeaning(e.target.value)}
              placeholder="意味"
              className="flex-1 border rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            />
            <button
              onClick={handleAddWord}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              追加
            </button>
          </div>
        </div>

        {/* 単語一覧 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600 w-16">No.</th>
                <th className="px-4 py-3 text-left text-gray-600">単語</th>
                <th className="px-4 py-3 text-left text-gray-600">意味</th>
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
                          value={editMeaning}
                          onChange={(e) => setEditMeaning(e.target.value)}
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
                      <td className="px-4 py-3 text-gray-700">{w.meaning}</td>
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