-- 匿名キーでの参照を禁止し、UPDATE の穴を塞ぐ
--
-- 【変更前の状態】
--   SELECT : USING (true) / ロール public
--            → 未ログインでも wordbooks 3件・words 4,927件が全部読めた。
--              匿名キーは公開されるJSに含まれるため、URLを知っていれば誰でも取得できた。
--   UPDATE : USING のみで WITH CHECK が無い
--            → 更新後の行が検査されず、words の wordbook_id を他人の単語帳に
--              書き換えたり、wordbooks の user_id を他人に付け替えたりできた。
--
-- 【変更しないもの】
--   INSERT / DELETE は既に所有者のみに正しく限定されているため触らない。
--   ログイン済みユーザー同士で全単語帳を共有する方針も維持する
--   （SELECT は authenticated に対して true のまま）。
--
-- 【手順】STEP 1 → 2 → 3 を1ブロックずつ実行してください。
--        問題があれば 003_..._rollback.sql で元に戻せます。


-- ===============================================================
-- STEP 1  変更前の確認
--   期待値: SELECT 2件が qual=true / UPDATE 2件が with_check=null
-- ===============================================================
select tablename as テーブル, policyname as ポリシー名, cmd as 操作,
       roles as ロール, qual as USING句, with_check as WITH_CHECK句
from pg_policies
where schemaname = 'public' and tablename in ('wordbooks','words')
order by tablename, cmd;


-- ===============================================================
-- STEP 2  ポリシーの入れ替え
-- ===============================================================
begin;

-- 参照はログイン済みのみに限定する。
-- ロールを authenticated にすることで、anon にはポリシーが1つも無い状態になり
-- 参照が拒否される。
drop policy if exists "全ユーザーが単語帳を参照可能" on public.wordbooks;
create policy "ログイン済みユーザーが単語帳を参照可能"
  on public.wordbooks for select
  to authenticated
  using (true);

drop policy if exists "全ユーザーが単語を参照可能" on public.words;
create policy "ログイン済みユーザーが単語を参照可能"
  on public.words for select
  to authenticated
  using (true);

-- 更新後の行も所有者のものであることを保証する（WITH CHECK を追加）
drop policy if exists "オーナーのみ単語帳を編集" on public.wordbooks;
create policy "オーナーのみ単語帳を編集"
  on public.wordbooks for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "オーナーのみ単語を編集" on public.words;
create policy "オーナーのみ単語を編集"
  on public.words for update
  to authenticated
  using (
    wordbook_id in (select id from public.wordbooks where user_id = auth.uid())
  )
  with check (
    wordbook_id in (select id from public.wordbooks where user_id = auth.uid())
  );

commit;


-- ===============================================================
-- STEP 3  変更後の確認
--   期待値:
--     SELECT 2件 … ロールが {authenticated}
--     UPDATE 2件 … WITH_CHECK句 が入っている / ロールが {authenticated}
--     INSERT・DELETE 4件 … 変更なし（ロールは {public} のまま）
-- ===============================================================
select tablename as テーブル, policyname as ポリシー名, cmd as 操作,
       roles as ロール, qual as USING句, with_check as WITH_CHECK句
from pg_policies
where schemaname = 'public' and tablename in ('wordbooks','words')
order by tablename, cmd;
