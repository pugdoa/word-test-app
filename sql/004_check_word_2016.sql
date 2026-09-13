-- システム英単語（5訂版）の末尾付近を確認する（読み取りのみ）
--
-- 2000語超が表示されない問題(a0f2ccf)を調べていた際、sort_order=2016 の単語が
-- "be" になっているのに気づいた。周囲は paralyzed / indigenous / susceptible と
-- いった上級語のため、CSV取り込み時の行ずれで熟語の一部だけが残った可能性がある。
-- 意味まで見れば正しい登録かどうか判断できる。


-- ===============================================================
-- 1. sort_order 2010〜2027 を意味つきで表示
-- ===============================================================
select
  w.sort_order   as 番号,
  w.word         as 単語,
  w.main_meaning as 重要な意味,
  w.other_meanings as その他の意味,
  w.meaning_count  as 意味の数
from words w
join wordbooks b on b.id = w.wordbook_id
where b.name like '%システム英単語%'
  and w.sort_order between 2010 and 2027
order by w.sort_order;


-- ===============================================================
-- 2. ついでに、他にも短すぎる単語が無いか探す
--    （行ずれが1か所だけとは限らないため）
-- ===============================================================
select
  w.sort_order   as 番号,
  w.word         as 単語,
  w.main_meaning as 重要な意味
from words w
join wordbooks b on b.id = w.wordbook_id
where b.name like '%システム英単語%'
  and length(trim(w.word)) <= 3
order by w.sort_order;
