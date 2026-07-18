'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Wordbook = {
  id: string
  name: string
  created_at: string
  word_count?: number
}

export default function Dashboard() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [wordbooks, setWordbooks] = useState<Wordbook[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [csvText, setCsvText] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/')
      } else {
        setEmail(user.email ?? '')
        fetchWordbooks()
        setLoading(false)
      }
    })
  }, [router])

  const fetchWordbooks = async () => {
    const { data } = await supabase
      .from('wordbooks')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
    if (data) setWordbooks(data)
  }

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
    const items: { word: string; meaning: string }[] = []
    for (const line of lines) {
      const sep = line.includes('\t') ? '\t' : ','
      const parts = line.split(sep)
      if (parts.length < 2) continue
      const word = parts[0].trim()
      const meaning = parts.slice(1).join(sep).trim()
      if (word && meaning) items.push({ word, meaning })
    }
    return items
  }

  const handleSave = async () => {
    if (!newName.trim()) { setMessage('単語帳の名前を入力してください。'); return }
    if (!csvText.trim()) { setMessage('単語データを入力してください。'); return }
    const words = parseCSV(csvText)
    if (words.length === 0) { setMessage('単語を読み取れませんでした。「単語,意味」の形式か確認してください。'); return }

    setSaving(true)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: wordbook, error } = await supabase
      .from('wordbooks')
      .insert({ name: newName.trim(), user_id: user.id })
      .select()
      .single()

    if (error || !wordbook) {
      setMessage('保存に失敗しました。')
      setSaving(false)
      return
    }

    const wordsToInsert = words.map((w, i) => ({
      wordbook_id: wordbook.id,
      sort_order: i + 1,
      word: w.word,
      meaning: w.meaning,
    }))

    const { error: wordsError } = await supabase.from('words').insert(wordsToInsert)
    if (wordsError) {
      setMessage('単語の保存に失敗しました。')
      setSaving(false)
      return
    }

    setMessage(`「${newName}」を保存しました(${words.length}語)`)
    setNewName('')
    setCsvText('')
    setShowForm(false)
    fetchWordbooks()
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return
    await supabase.from('wordbooks').delete().eq('id', id)
    fetchWordbooks()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">英単語テスト作成</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{email}</span>
          <button
            onClick={handleLogout}
            className="text-sm bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-gray-700"
          >
            ログアウト
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">単語帳一覧</h2>
          <button
            onClick={() => { setShowForm(!showForm); setMessage('') }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            {showForm ? 'キャンセル' : '＋ 新しい単語帳を追加'}
          </button>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">{message}</div>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4">新しい単語帳を追加</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">単語帳の名前</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例: 英単語1900フル"
                  className="w-full border rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  単語データ(「単語,意味」を1行ずつ)
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="apple,りんご&#10;run,走る&#10;beautiful,美しい"
                  className="w-full border rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 h-48 font-mono text-sm"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存する'}
              </button>
            </div>
          </div>
        )}

        {wordbooks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            まだ単語帳がありません。「新しい単語帳を追加」から作成してください。
          </div>
        ) : (
          <div className="space-y-3">
            {wordbooks.map((wb) => (
              <div key={wb.id} className="bg-white rounded-lg shadow-sm px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900">{wb.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(wb.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/test?wordbookId=${wb.id}&wordbookName=${encodeURIComponent(wb.name)}`)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    テストを作成
                  </button>
                  <button
                    onClick={() => handleDelete(wb.id, wb.name)}
                    className="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg text-sm"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}