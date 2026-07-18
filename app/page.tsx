'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAuth = async () => {
    setLoading(true)
    setMessage('')
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(`エラー: ${error.message}`)
      else setMessage('確認メールを送りました。')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(`エラー: ${error.message}`)
      else router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
          英単語テスト作成
        </h1>
        <h2 className="text-lg font-semibold text-center mb-6 text-gray-700">
          {isSignUp ? '新規登録' : 'ログイン'}
        </h2>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder-gray-500"
          />
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder-gray-500"
          />
          {message && (
            <p className="text-sm text-center text-red-500">{message}</p>
          )}
          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-semibold"
          >
            {loading ? '処理中...' : isSignUp ? '登録する' : 'ログイン'}
          </button>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-sm text-gray-600 hover:text-gray-800"
          >
            {isSignUp ? 'すでにアカウントをお持ちの方はこちら' : '新規登録はこちら'}
          </button>
        </div>
      </div>
    </div>
  )
}