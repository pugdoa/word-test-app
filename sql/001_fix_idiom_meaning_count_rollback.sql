-- 001 を元に戻す
-- meaning_count の値を other_meanings に書き戻し、meaning_count を空にする。
-- main_meaning は 001 で触れていないため、これで完全に元の状態へ戻る。

begin;

update words
set
  other_meanings = meaning_count::text,
  meaning_count  = null
where wordbook_id = 'fe06db1f-a875-4a96-9006-9491da11656f'
  and meaning_count is not null
  and other_meanings is null;

-- 期待値: 1000 / 0
select
  count(*) filter (where other_meanings ~ '^[0-9]{1,2}$') as 数字だけに戻った件数,
  count(*) filter (where meaning_count is not null)        as 意味の数が残存
from words
where wordbook_id = 'fe06db1f-a875-4a96-9006-9491da11656f';

commit;
