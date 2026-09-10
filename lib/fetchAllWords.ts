import { supabase } from '@/lib/supabase'

export type Word = {
  id: string
  sort_order: number
  word: string
  main_meaning: string
  other_meanings: string | null
  meaning_count: number | null
}

const COLUMNS = 'id, sort_order, word, main_meaning, other_meanings, meaning_count'

/** 1回のリクエストで取得する件数。Supabase 側の上限(2000)より小さくしておく。 */
const PAGE_SIZE = 1000

/** 想定外の無限ループを防ぐための上限(100万語) */
const MAX_PAGES = 1000

/**
 * 単語帳の単語を全件取得する。
 *
 * Supabase は1リクエストあたりの返却件数に上限があり(このプロジェクトでは2000)、
 * range を広げても超えられない。そのため空のページが返るまで分割して取得する。
 * 返却件数が PAGE_SIZE 未満でも打ち切らないのは、サーバー側の上限が
 * PAGE_SIZE より小さく設定し直された場合に取りこぼすため。
 */
export async function fetchAllWords(
  wordbookId: string
): Promise<{ words: Word[]; error: string | null }> {
  const all: Word[] = []

  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await supabase
      .from('words')
      .select(COLUMNS)
      .eq('wordbook_id', wordbookId)
      .order('sort_order', { ascending: true })
      .range(all.length, all.length + PAGE_SIZE - 1)

    if (error) return { words: all, error: error.message }
    if (!data || data.length === 0) break
    all.push(...data)
  }

  return { words: all, error: null }
}
