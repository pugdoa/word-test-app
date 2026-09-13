-- 003 を元に戻す
-- 参照を全員（未ログイン含む）に開放し、UPDATE の WITH CHECK を外す。
-- アプリにログインできなくなった場合など、緊急時のみ使用してください。

begin;

drop policy if exists "ログイン済みユーザーが単語帳を参照可能" on public.wordbooks;
create policy "全ユーザーが単語帳を参照可能"
  on public.wordbooks for select
  using (true);

drop policy if exists "ログイン済みユーザーが単語を参照可能" on public.words;
create policy "全ユーザーが単語を参照可能"
  on public.words for select
  using (true);

drop policy if exists "オーナーのみ単語帳を編集" on public.wordbooks;
create policy "オーナーのみ単語帳を編集"
  on public.wordbooks for update
  using (auth.uid() = user_id);

drop policy if exists "オーナーのみ単語を編集" on public.words;
create policy "オーナーのみ単語を編集"
  on public.words for update
  using (
    wordbook_id in (select id from public.wordbooks where user_id = auth.uid())
  );

commit;
