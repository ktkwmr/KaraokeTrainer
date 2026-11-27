# ベースラインの実施状況（Karaoke Trainer）

基準: WEBAPP_BASELINE.md（最終更新 2026-11-22 版、§17 まで。9-17 を含む）
状態: ✅ 実装済み / ⚠️ 一部 / ❌ 未実装 / 👤 待ち（人間の作業） / — 対象外
最終更新: 2026-11-22（公開。2026-11-21 初版）

## 0. 変数

| 変数 | 値 |
|---|---|
| アプリ名 | Karaoke Trainer（日本語の検索用タイトルは `scripts/build-ja.mjs` の `TITLE`） |
| スラッグ | `karaoketrainer` |
| ドメイン | `ktkwmr.com`（§0 の A: 別 Worker + Route `ktkwmr.com/karaoketrainer*`） |
| リポジトリ | `ktkwmr/KaraokeTrainer` |
| 運営者・問い合わせ | ktkwmr / GitHub Issues |
| 言語 | en（既定）+ ja（`/ja/`） |
| Web Analytics token | ほかのアプリと同じ |
| 初回の Artifact（§12-12） | https://claude.ai/artifact/5AyQktwWGCgA5NRsg36TJx （デモ曲で画面を確認する用。Artifact の中ではマイクと AI の分離は動かない） |

## 項目

| # | 項目 | 状態 | メモ |
|---|---|---|---|
| 1-4 | Claude の GitHub App | ✅ | このセッションで push できた |
| 1-8 | Cloudflare の GitHub App | ✅ | 「All repositories」で許可済み |
| 2-1 | wrangler.jsonc | ✅ | `routes`・`workers_dev: false`・`preview_urls: true`・`previews: {}`。`build.command` でモデルの取得と生成 |
| 2-2 | `/` の転送 | — | ドメイン直下は `ktkwmr/ktkwmr.com` |
| 2-3 | 404.html | ✅ | |
| 2-4〜2-10 | .gitignore・LF・`--check`・README・LICENSE・CLAUDE.md・バージョンなし | ✅ | `.gitignore` に `public/karaoketrainer/models/` |
| 2-11 | Cloudflare に接続 | ✅ | 接続済み（2026-11-22、Project name `karaoketrainer`、Production branch `main`）。Import の画面に Production branch の欄はなく、最初のデプロイのあとに Settings → Build で設定。本番以外のブランチのビルドは既定で有効。プレビュー URL は Domains →「Worker URL」の Preview をオン（`preview_urls: true` は本番デプロイで反映されるため最初はオフ）。Production（workers.dev）はオフ |
| 2-13 | 自動デプロイの確認 | ✅ | PR #1 のマージ（`a0f0112`）で本番にデプロイ、https://ktkwmr.com/karaoketrainer/ で開けることを確認（2026-11-22） |
| 2-14 | 2 つ目以降のアプリの設定 | ✅ | sitemap は `public/karaoketrainer/sitemap.xml` |
| 2-15・2-16 | トップページへの追加 | ✅ | ktkwmr/ktkwmr.com#14（`APPS`・`ICON`・`PREVIEW`・`robots.txt` の `Sitemap:`）、2026-11-22 マージ |
| 2-18 | 最初の push は `main` | ✅ | 初期コミット（LICENSE など）を `main` に push、既定ブランチ `main` を確認 |
| 2-19 | 既存アプリのコピー | — | BandStemMixer はコピーせず、部品（`keyshift.js`、画面の共通部分、生成スクリプト）だけ流用 |
| 2-20 | 大きなファイルの配信 | ✅ | モデルは 20 MiB ごとに分割（`fetch-model.mjs`、`--check` で 25 MiB 超を検出）、バージョン付きのフォルダ `spleeter-2stems-v2`、専用のキャッシュ `karaoketrainer-model-v2`（v1 のキャッシュは `sw.js` の activate で消える）。Git には入れずビルドで取得（Windows 11 の PC でも、Cloudflare Workers Builds（PR #1 のプレビュービルド、2026-11-22）でも成功。ビルドコマンドは `&&` でつないでいるので、取得に失敗するとビルドが失敗する） |
| 3-1〜3-5 | PWA | ✅ | |
| 3-8 | アイコン生成 | ✅ | `scripts/render-icons.mjs` |
| 3-9 | SW が返すワーカーの COEP | ✅ | `sw.js` の `withWorkerHeaders` |
| 3-10 | CDN のオフライン対応 | ✅ | ONNX Runtime Web の 6 ファイル |
| 4-1〜4-3 | 多言語・日本語ページの生成 | ✅ | |
| 4-4 | 日本語の検索用タイトル | ✅ | 「歌って音程をチェック｜原曲のメロディと重ねて見られる無料カラオケ練習・キー診断 – Karaoke Trainer」（`scripts/build-ja.mjs` の `TITLE`） |
| 4-7 | `document.baseURI` | ✅ | pitchy の動的 import、モデルの URL |
| 5-1〜5-8 | SEO・OGP・JSON-LD・h1・アプリの下の説明 | ✅ | |
| 5-10 | アプリごとの sitemap | ✅ | |
| 5-11 | ページのスクロールを止めない | ✅ | |
| 6-1〜6-4 | セキュリティヘッダー | ✅ | `microphone=(self)` |
| 6-6 | COOP / COEP credentialless | ✅ | |
| 7-1〜7-3 | プライバシー・運営者情報 | ✅ | マイクの使い方と IndexedDB の保存を記載 |
| 7-8 | AI モデルの重みのライセンス | ✅ | Spleeter の学習済みモデルは MIT（論文 JOSS 5(50) 2154 に「source code and pre-trained models … distributed under a MIT license」。README は「The code … is MIT-licensed」のみ）。sherpa-onnx の ONNX 版のリリースには別の条件なし（2026-11-22 確認）。学習データは Deezer の社内データ（論文）で、公開されていない |
| 8-1〜8-3 | サードパーティライセンス | ✅ | Spleeter・sherpa-onnx・pitchy・fft.js は手書き、ONNX Runtime Web はスクリプト |
| 9-1〜9-5 | 共通 UI | ✅ | ⚙ に「設定」「マイ音域」「保存した曲を削除」「AIモデルを削除」も |
| 9-10・9-11 | ボタンの反応・ダイアログのフォーカス | ✅ | |
| 9-12 | iOS 26 のステータスバー | ✅ | sticky の不透明なヘッダー |
| 9-13 | 大きなダウンロードの前の確認 | ✅ | |
| 9-14 | アプリ本体の下のフッター | ✅ | |
| 9-15 | 再生コントロール | ✅ | ▶／❚❚ と ■、Space・Home |
| 9-16 | スマホで再生できるようになったら上へ | ✅ | 曲の準備ができたら練習の欄を上端へ。再生中のロールは常に現在位置が中央（ページのスクロールは奪わない） |
| 9-17 | タイムラインの操作 | ✅ | ピンチで時間軸の拡大・縮小、2 本指スクロールで縦横、時間の目盛りと「歌い出しまで ◯秒」（ベースライン: ktkwmr/webapp-baseline#23） |
| 9-18 | 関連アプリへのリンク | ✅ | メイン機能の下の `<nav class="related">` に 2 つ（定義は webapp-baseline の `related-apps.json`、文言は `I18N` の `rel.*`） |
| 10-1〜10-5 | 記事 | ✅ | 使い方ガイドと FAQ（仕様書の要件）。ほかの記事は人間と相談して追加 |
| 10-7 | 記事の人間確認 | ✅ | プレビューで確認済み、PR #1 でマージ（2026-11-22）。観点は `docs/article-review.md` |
| 10-9 | 専門家視点の校閲 | ✅ | `docs/article-review.md` |
| 11-1〜11-3 | Web Analytics | ✅ | |
| 11-4 | beacon の確認 | ✅ | 本番で確認済み（2026-11-22） |
| 12-1・12-2 | Actions | ✅ | |
| 12-11・12-14 | Playwright・偽モデルでの確認 | ✅ | `scripts/test/`（偽のモデル、偽のマイク、オフラインでの再オープン、日本語ページ） |
| 12-12 | Artifact | ✅ | 上の URL |
| 12-13 | 人間の動作確認の方法 | ✅ | 初回の作業報告 |
| 13・14 | 公開・公開後 | ✅ | 本番の動作確認、GitHub の About、Search Console（sitemap 送信・インデックス登録のリクエスト）済み（2026-11-22） |
| 15 | 広告 | — | 予定なし |
| 17 | GA4 | — | 初回は入れない |

## 未完了の人間の作業

なし（2026-11-22 公開）。記事を足したら §10-7、アプリ名・説明・アイコン・記事を変えたら ktkwmr/ktkwmr.com の `home.mjs`（§2-16）。
