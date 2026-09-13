-- 現状確認（読み取りのみ・データは変更しません）
--
-- RLS ポリシーを置き換える前に、今どうなっているかを確認する。
-- 結果をそのまま貼り付けてください。それを見てから移行SQLを書きます。
--
-- SQL Editor で全体を選択して実行すると最後の結果しか出ないため、
-- STEP 1 → 2 を1ブロックずつ実行してください。


-- ===============================================================
-- STEP 1  RLS が有効か
-- ===============================================================
select
  c.relname                        as テーブル,
  c.relrowsecurity                 as RLS有効,
  c.relforcerowsecurity            as 所有者にも強制
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('wordbooks', 'words')
order by c.relname;


-- ===============================================================
-- STEP 2  現在のポリシー一覧
-- ===============================================================
select
  tablename    as テーブル,
  policyname   as ポリシー名,
  cmd          as 対象操作,
  roles        as 対象ロール,
  qual         as 参照条件_USING,
  with_check   as 書込条件_WITH_CHECK
from pg_policies
where schemaname = 'public'
  and tablename in ('wordbooks', 'words')
order by tablename, cmd, policyname;
