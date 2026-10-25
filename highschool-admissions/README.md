# 長野県 高校受験データ

下諏訪Labに追加するビルド不要の静的ページです。外部JavaScript・グラフCDN・フォントへの依存はありません。

## 使い方

操作は一つです。**学区 → 学校 → 学科・募集単位**を選び、同じ対象の年度推移をグラフと表で確認します。

- 第1通学区（北信）、第2（東信）、第3（南信）、第4（中信）を複数選択。
- 学区を追加すると新しく対象になる学校・学科を全選択。そこからチェックを外して絞り込む。既に選んだ学区内の手動除外は維持。
- 学区・学校・学科には全選択／全解除。学校数の上限なし。学校の検索は候補だけを絞り、「学校を全選択」は検索で隠れた候補を含む選択学区内の全校を選ぶ。
- 学校を外すとその学科を対象から外す。学校を選び直すと、その学校の全募集単位を選ぶ。学科だけを全解除した場合は「対象なし」として扱い、全件に戻さない。
- 「選んだ対象を合計」と「学校ごとに比較」を一つのグラフで切替。学校ごとは色、指標ごとは線種で区別。
- 前期／後期／両方と、最大3指標を選択。初期値は両方・年間募集定員＋延べ志願者数。
- 表はグラフと同じ対象・年度・指標・集計値を表示。その表をCSV保存できる。
- 学校・学科は6年度に登場するものを含む。名称・募集単位が変わった学科は別選択肢で、初期状態では全て含む。掲載のない年度は0で埋めず「—」。

初期状態は第3通学区の全校・全募集単位。学校・学科を絞ったときは、その対象のみで各年を集計します。課程は公立全日制のみです。学区は資料を探すための分類であり、受検できる学校を判定する機能ではありません。

## 公開・設置

公開先：<https://sususunosusumu.github.io/SHIMOSUWA-LAB/highschool-admissions/>

`highschool-admissions/`をGitHub Pages公開ブランチへ配置します。既存サイトのトップ・サイトメニューからリンク済みです。

ローカルではリポジトリ直下で `python3 -m http.server 8765` を実行し、`http://localhost:8765/highschool-admissions/` を開きます。fetchを使うためHTTPサーバーで表示してください。

```
highschool-admissions/
  index.html
  styles.css
  app.js
  data/admissions.json
  data/admissions.csv
  data/coverage.json
  scripts/import_data.py
  scripts/validate.py
  scripts/test.cjs
  README.md
```

## データと集計

2021〜2026年度・775レコード。主資料は長野県教育委員会『高等学校要覧』各年度「15 学校別入学状況（公立）」。原データの人数をJSON/CSVで分離し、表示時に集計します。

- [令和8年度高校要覧](https://www.pref.nagano.lg.jp/kyoiku/koko/gyose/zenpan/tokei/ko/r08.html)
- [令和8年度入試情報](https://www.pref.nagano.lg.jp/kyoiku/koko/saiyo-nyuushi/shiken/ko/r8/r8konyushi.html)
- [過年度要覧一覧](https://www.pref.nagano.lg.jp/kyoiku/koko/gyose/zenpan/tokei/ko/koukouyouran.html)
- [県公式・高校の通学区](https://www.pref.nagano.lg.jp/kyoiku/koko/jukense/nintei/ko-tsugakuku.html)

年度は4月に入学する年です。2026年度は2026年4月入学者の実績で、実入学者は5月1日現在。2027年度速報は未収録。入試速報の「入学予定者」は要覧の合格者・実入学者と同じ数値として扱わず、初期データには混ぜていません。

| 指標 | 前期／後期 | 両方 |
| --- | --- | --- |
| 募集人数 | 選抜の募集枠 | 年間募集定員 |
| 志願者・受検者 | 各選抜の人数 | 前期＋後期の延べ人数 |
| 合格者 | 各選抜の合格者 | 前期＋後期＋再募集の最終合格者計 |
| 倍率 | 志願者÷選抜の募集枠 | 延べ志願者÷年間募集定員という参考比率 |
| 実入学者・充足率 | 年間値 | 年間値 |

前期未充足分が後期枠へ回るため、両方の募集人数に前後期枠の単純合計を使いません。延べ人数は同じ人を重複して含むため実人数や合格可能性ではありません。最終合格者計は派生値で、内進等を含む実入学者とは異なります。

充足率＝年間実入学者÷年間定員×100。集計倍率・充足率は人数の合計から再計算し、学校別比率を平均しません。分母0・未収録・未実施は `null`。部分的に未実施の選抜がある合計では、公表された値を集計します。学科の共同募集は分割・按分しません。岡谷工業等で定員が結合セルになっている場合、各行の人数を資料の募集単位へ合計しています。

資料掲載倍率は直接利用せず、人数から一貫して計算しています。合格者数が募集枠を超える行も原資料のまま保持しています。

## データモデルと選択状態

`admissions.json`は `schema_version`, `updated`, `years`, `requested_start_year`, `records`, `sources`, `checks`, `notes` を保持。

レコードは `year`, `school_id`, `school`, `program_id`, `department`, `source_department`, `course`, `region`, `annual_capacity`, `enrolled`, `additional_accepted`, `early`, `late`, `source_id`, `source_page`。前期・後期は `capacity`, `applicants`, `examinees`, `accepted` を保持。元CSVでは `early_`／`late_` 接頭辞で平坦化します。資料URL・取得日・SHA-256は `sources`、地域合計の照合結果は `checks` に記録。

画面では「伊那弥生ヶ丘／伊那弥生ケ丘」の小書き表記違いだけを同じ学校にまとめます。読み込み時のメモリ内で元のラベルを `source_school`／`source_program_id` に残し、元JSON/CSVは変更しません。実際の改称・統廃合や学科再編は自動接続しません。

状態は学区・学校・募集単位・指標の集合を一つずつ保持。`buildResults()`で計算した同じ結果をグラフ・表・CSVが参照します。集計対象がゼロの場合の空集合を明確に扱います。

URLは `view=explorer`。選択が多い場合は `schoolMode=all`／`programMode=all` と除外リスト、少ない場合は `selected` と包含リストで保存してURLを短くします。旧URLのトレンド条件は新しい一つの対象選択へ移行します。旧比較表の独立条件は使用しません。

## 更新・検証

Python 3.10以降推奨。`pip install requests beautifulsoup4 pdfplumber` の後、当ディレクトリで `python scripts/import_data.py` を実行。公式PDFを `scripts/cache/` に取得し、JSON/CSVを再生成します。引数で取得済PDFのディレクトリも指定できます。

6年度×4通学区について、年間定員・実入学者・再募集合格者・前後期の募集／志願／受検／合格の計11項目が原資料の地域合計に一致することを確認し、不一致なら生成を中断します。PDFの結合セルと複数行の0を単純連結しない処理が必要です。合計検証は全セルの目視照合を代替するものではないため、表示表に出典リンクを残しています。

- `python scripts/validate.py`：レコード一意性・出典・年度・非負整数・JSON/CSV一致を確認。
- `node scripts/test.cjs`：3段階の絞り込み、上限なしの全選択／全解除、手動除外、空集合、URL復元、全体と学校別の合計一致、前後期の枠、グラフと表、異単位軸を確認。
- `node --check app.js`：構文確認。

## 1990年度以降への拡張

目標は1990〜2026年度。1990〜2020年度の学校・学科別データは未収録で、調査状況は `data/coverage.json` に記載。未収録年を0で埋めません。

公式要覧一覧には平成13年度以降のリンクがあります。1990年代は[県立長野図書館の調査記録](https://crd.ndl.go.jp/reference/entry/index.php?id=1000324101&page=ref_view)で『長野県学事要覧』の募集定員の存在を確認できます。[平成2年度学校基本調査](https://tokei.pref.nagano.lg.jp/statistics/3989.html)の在籍統計を、学校別入試結果の代わりには使いません。

追加時は推薦・一般・前期・後期等の制度、公表時点、学校の継承関係、学科・共同募集単位を確認し、違う定義の値を同じ系列へ自動接続しないでください。
