-- ターゲット熟語1000（5訂版）の「意味の数」を正しい列へ移す
--
-- 取り込み時に3列形式（熟語・意味・意味の数）で入ったため、意味の数が
-- other_meanings に落ち、meaning_count が空のままになっていた。
-- その結果、問題用紙に (2)〜(5) が出ず、解答用紙には末尾に「/ 1」と
-- 個数が意味であるかのように印字されていた。
--
-- main_meaning は変更しない。other_meanings の数字を meaning_count へ移し、
-- other_meanings を空にするだけ。
--
-- 対象を三重に限定しているため、2回目以降は0件になり、
-- 他の単語帳には影響しない。
--
-- 【手順】STEP 1 → 2 → 3 を、1ブロックずつ選択して実行してください。


-- ===============================================================
-- STEP 1  実行前の確認
--   期待値: 数字だけ=1000  意味の数が空=1000  設定済=0  条件に合致=1000
-- ===============================================================
select
  count(*) filter (where other_meanings ~ '^[0-9]{1,2}$')  as 数字だけ,
  count(*) filter (where meaning_count is null)             as 意味の数が空,
  count(*) filter (where meaning_count is not null)         as 設定済,
  count(*) filter (
    where other_meanings ~ '^[0-9]{1,2}$'
      and meaning_count is null
      and other_meanings::int = array_length(string_to_array(main_meaning, '/'), 1)
  )                                                          as 条件に合致
from words
where wordbook_id = 'fe06db1f-a875-4a96-9006-9491da11656f';


-- ===============================================================
-- STEP 2  移し替え（1000件）
--   条件が1つでも外れる行は対象にしない
-- ===============================================================
update words
set
  meaning_count  = other_meanings::int,
  other_meanings = null
where wordbook_id = 'fe06db1f-a875-4a96-9006-9491da11656f'
  and other_meanings ~ '^[0-9]{1,2}$'
  and meaning_count is null
  -- 数字が main_meaning の「/」区切りの個数と一致する行だけを対象にする
  and other_meanings::int = array_length(string_to_array(main_meaning, '/'), 1);


-- ===============================================================
-- STEP 3  実行後の確認
--   期待値: 設定済=1000  その他の意味が残存=0
--           意味1=702  意味2=213  意味3=57  意味4=20  意味5=8
--
--   違っていたら 001_fix_idiom_meaning_count_rollback.sql で戻せます。
-- ===============================================================
select
  count(*) filter (where meaning_count is not null)   as 設定済,
  count(*) filter (where other_meanings is not null)  as その他の意味が残存,
  count(*) filter (where meaning_count = 1)           as 意味1,
  count(*) filter (where meaning_count = 2)           as 意味2,
  count(*) filter (where meaning_count = 3)           as 意味3,
  count(*) filter (where meaning_count = 4)           as 意味4,
  count(*) filter (where meaning_count = 5)           as 意味5
from words
where wordbook_id = 'fe06db1f-a875-4a96-9006-9491da11656f';
