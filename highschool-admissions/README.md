# 長野県高校受験ダッシュボード

下諏訪Labへ追加する、ビルド不要の静的ページです。外部JavaScript・フォント・グラフCDNへの依存はありません。

## 設置と公開

`highschool-admissions/`をそのままGitHub Pagesの公開対象ブランチへ追加してください。公開先は `https://sususunosusumu.github.io/SHIMOSUWA-LAB/highschool-admissions/` です。既存ページから `<a href="highschool-admissions/">長野県高校受験ダッシュボード</a>` を追加できます。トップページとサイトメニューに、このページへのリンクを追加しています。

ローカル確認はリポジトリ直下で `python3 -m http.server 8765` を実行し、`http://localhost:8765/highschool-admissions/` を開きます。ファイルの直接表示ではfetch制限があるためHTTPで開いてください。

## 内容

- 2021〜2026年度、775件の年度別・学校別・募集単位別レコード。公立全日制のみ。
- 年度・4地域・学校名・学科・前期／後期の絞り込み。
- 募集、志願、受検、合格、年間実入学者数、志願倍率、年間充足率の推移。
- 志願者・倍率・年間定員増減・志願者増減・年間定員不足のランキング。
- 最大6募集単位の比較。比較対象はフィルター変更後も保持し、全年度の同じ募集単位を表示。
- 比較未選択時は年度ごとにフィルターを適用して集計。定員割れのみのチェックは各年度の該当単位を抽出するため、構成は年度ごとに変わる。
- 選択条件はURLフラグメントに保存。絞り込みCSV保存、全データJSON/CSV、グラフの数値表、スマートフォン対応。

## ディレクトリ

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
  README.md
```

## 主資料とデータモデル

主資料は長野県教育委員会『高等学校要覧』各年度「15 学校別入学状況（公立）」。令和8年度入試情報も調査し、速報の募集／志願／受検／入学予定者PDFが別に公開されていることを確認しました。初期データは5月1日現在の要覧を優先しています。

- [令和8年度高校要覧](https://www.pref.nagano.lg.jp/kyoiku/koko/gyose/zenpan/tokei/ko/r08.html)
- [令和8年度入試情報](https://www.pref.nagano.lg.jp/kyoiku/koko/saiyo-nyuushi/shiken/ko/r8/r8konyushi.html)
- [過年度要覧一覧](https://www.pref.nagano.lg.jp/kyoiku/koko/gyose/zenpan/tokei/ko/koukouyouran.html)

`admissions.json`は `schema_version`, `updated`, `years`, `requested_start_year`, `records`, `sources`, `checks`, `notes` を持ちます。

各レコードは入学年度 `year`、`school_id`（空白除去した掲載校名）、`school`、`program_id`（校名＋学科・共同募集名。半角全角・中点差を正規化）、`department`、`course`、`region`、`annual_capacity`、`enrolled`、`additional_accepted`、`early`、`late`、`source_id`、`source_page` を保持します。`early`と`late`はそれぞれ `capacity`, `applicants`, `examinees`, `accepted`。`source_department`は取り込み時の学科ラベルを保持します。表示ラベルは同じ系列の最新年度表記にそろえています。原資料にない・未実施のセルは `null`、明示された0は `0`。

CSVでは前期／後期を `early_`／`late_` 接頭辞で平坦化。JSON・CSVとも元の人数を保持し、表示時に倍率等を計算。`sources`には公式PDFのURL、取得日、SHA-256、`checks`には4通学区ごとの合計検証を記録します。

前期後期は同じ人が出願できるため志願者数を合算しません。実入学者は年間の数値であり、前期後期へ配分しません。合格者計は前期・後期・再募集の合格者数を加えた派生指標で、実入学者とは異なります。合格者と入学予定者は異なる項目です。速報の `planned_admitted` を取り込む場合は別フィールドに追加し、`accepted`を上書きしないでください。

倍率＝志願者÷当該選抜募集人員（分母が0・欠測ならnull）。充足率＝年間実入学者÷年間定員×100。定員割れ＝年間実入学者＜年間定員。増減は前年の同じ `program_id` との比較で、前年なしは欠測です。ランキングの定員増減は前期後期枠でなく年間募集定員の増減です。

**資料掲載倍率はそのまま利用していません。** 特に令和8年度の一部行には人数から再計算した値と異なる倍率が載るため、本ページは一貫して上記式を使います。結果の合格人数が枠を超える場合も原資料を保持します。内進生を含む学校では年間定員と前期・後期枠の合計は一致しません。

共同募集は結合セルを一単位として扱い、学科に人数を按分しません。岡谷工業等で学科別の人数が複数行に分かれ、定員が共通の場合は募集単位へ合計。学科名称は資料の改行を連結しているため、学科再編や掲載単位の変更で系列が切れる場合があります。統廃合・改称を自動接続していません。北信／東信／南信／中信は資料の第1〜4通学区に対応する地域ラベルです。

## 更新・検証

Python 3.10以降を推奨。`pip install requests beautifulsoup4 pdfplumber` の後、このディレクトリで `python scripts/import_data.py`。公式PDFを `scripts/cache/` に取得し、JSON・CSVを再生成します。既に取得したPDFのディレクトリを引数で指定できます。6年度×4通学区について、年間定員・実入学者・再募集合格者・前期後期の募集／志願／受検／合格の計11列の地域合計を照合し、不一致なら生成を中断します。PDFの結合セル・複数行の0を単純連結しないことが必要です。

`python scripts/validate.py` は出典参照・一意性・非負整数・年度カバレッジ・CSVとの一致を検証します。構文確認は `node --check app.js`。

取得済PDFのバイトハッシュで同じ原資料か確認できます。再取得・訂正版によって変わる可能性があります。OCRでの推測値・サンプル値は含みません。ただし合計照合は全セルの目視照合の代わりではなく、今後の訂正に備え原資料へのリンクを各行に用意しています。

## 1990年度以降への拡張

目標は1990〜2026年度。現時点で1990〜2020年度の学校・学科別データは未収録です。欠測を0補完しません。調査状況は `data/coverage.json`。

公式要覧一覧には平成13年度（2001）以降のリンクがあり、順次同種資料を取り込めます。近年の「最近6か年間学校別入学志願者数」は調査済みですが、年度ごとの詳細表と粒度が違うため初期データには混在させていません。

1990年代については[県立長野図書館の調査記録](https://crd.ndl.go.jp/reference/entry/index.php?id=1000324101&page=ref_view)が『長野県学事要覧』に高校募集定員の記載があることを示します。[別の調査記録](https://crd.ndl.go.jp/reference/entry/reference/show?id=1000320075&page=ref_view)は『教育要覧 平成2年度』を紹介しています。[平成2年度学校基本調査](https://tokei.pref.nagano.lg.jp/statistics/3989.html)も存在しますが、在籍等の統計を学校別入試結果の代わりには使えません。

古い資料は冊子・画像を確認する必要があります。取込時は `selection_system`（推薦・一般・前期・後期等）、公表時点 `as_of`、学校の継承関係、分校・課程・学科・共同募集を別に記録し、制度の異なる値を同じ「前期」として接続しない設計に拡張してください。1990年代の全校入試結果を取得済みとはしていません。
