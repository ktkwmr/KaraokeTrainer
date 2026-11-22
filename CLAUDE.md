# Karaoke Trainer

手持ちの曲のファイルのボーカルを AI（Spleeter 2stems、ONNX Runtime Web）でブラウザの中で分離し、ボーカルのメロディの線（pitchy）を表示して、歌うとマイクの音程を重ねて描くカラオケ練習アプリ。答え合わせ（一致率・ズレた区間の歌い直し・聴き比べ）、ボーカル音量・キー変更、任意のマイ音域とおすすめキー。公開 URL: https://ktkwmr.com/karaoketrainer/ （日本語: /karaoketrainer/ja/）
構成・開発・デプロイの詳細は README.md、元の仕様はユーザーの SPEC（カラオケ練習アプリ 仕様書）。

## 共通ベースライン
- 独自機能以外の共通項目は ktkwmr/webapp-baseline（非公開）の WEBAPP_BASELINE.md に従う。
  セッションに無ければ add_repo（read。更新するときは push）で追加して読む。
- 各項目の状態は docs/baseline-status.md に記録する。
- どのアプリにも当てはまる新しい作業・設定・落とし穴が出てきたら、作業の最後に
  ベースラインへの追記案を出す（ユーザーが了承したらベースラインのリポジトリに PR）。

## このアプリの値
- スラッグ: `karaoketrainer` / ドメイン: `ktkwmr.com` / 言語: en（既定）+ ja（`/ja/`）
- 運営者: ktkwmr / 問い合わせ: GitHub Issues
- Cloudflare Web Analytics token: `5c53079cb9a64d819d1ca53e8533ca63`（ほかのアプリと同じサイト）
- ホスティング: Cloudflare Workers 静的アセット。Worker `karaoketrainer` に Route `ktkwmr.com/karaoketrainer*` だけ（ベースライン §0 の A）。
  ドメイン直下（トップページ、`robots.txt`、ルートの `sitemap.xml`、ルートの 404）は `ktkwmr/ktkwmr.com`（Worker `ktkwmr-home`）。このアプリの sitemap は `/karaoketrainer/sitemap.xml`。

## ルール
- 手で編集するのはアプリ本体 `public/karaoketrainer/index.html`・`separator.js`・`dsp.js`・`pitch.js`・`mixer.js`・`keyshift.js`・`sw.js` と `scripts/`。生成ファイル（`ja/index.html`、情報ページ `<slug>/` とその `ja/`、`sitemap.xml`）は編集せず、`node scripts/build-ja.mjs` と `node scripts/build-pages.mjs` で作り直す（`--check` で確認）。
- 画面の文言は `index.html` の `I18N`（en / ja）に書き、要素には `data-i18n` / `data-i18n-html` / `data-i18n-attr` を付ける。JS で作る文言は `t()`。子要素を持つ要素に `data-i18n` は付けない（`build-ja.mjs` が止まる）。`intro.body`・`help.body` のモデルの大きさ（about 75 MB／約75MB）は `MODEL_MB` と同じ数にする（`scripts/pages/app.mjs` が確かめる）。
- **商用利用できるライセンスだけを使う**（仕様書 §3）。Spleeter（コードと学習済みモデルが MIT）、sherpa-onnx（Apache-2.0）、ONNX Runtime Web（MIT）、pitchy・fft.js（MIT）。HTDemucs（重みの条件が不明）、Open-Unmix UMX-L（非商用）、UMX-HQ（MUSDB18 で学習）、RoFormer 系（CC-BY-NC-SA）、pitchfinder（GPL）、Rubber Band（GPL）は使わない。新しいライブラリ・モデルを足すときは、重みのライセンスもコードと別に確かめる（ベースライン §7-8）。
- **モデルは自サイトで配信する**（外部 CDN 直リンクにしない）。`scripts/fetch-model.mjs` がビルドのとき sherpa-onnx のリリース（`sherpa-onnx-spleeter-2stems.tar.bz2`、fp32）から `vocals.onnx`・`accompaniment.onnx` を取り出し、25 MiB 以下（20 MiB ごと）に分けて `public/karaoketrainer/models/spleeter-2stems-v1/` に置く（`manifest.json` に部品・大きさ・SHA-256）。Git には入れない（`.gitignore`）。`separator.js` が部品をつないで Cache Storage `karaoketrainer-model-v1` に保存し、`sw.js` はモデルをキャッシュしない（`KEEP` で残す）。モデルを変えたら（fp16・int8 など）フォルダを `-v2` にし、`MODEL_DIR`・`MODEL_CACHE`（`index.html`・`separator.js`）、`sw.js` の `KEEP`、`fetch-model.mjs` を同じ PR で直す。
- 分離の前後の処理は `dsp.js`。sherpa-onnx の `offline-source-separation-spleeter-impl.h` と同じ値（44.1 kHz、FFT 4096、hop 1024、周期的 Hann、center なし、入力 `[2, 分割数, 512, 1024]` の振幅、マスク est²/(v²+a²+1e-10)）。意図的な違い（512 フレームずつ処理、先頭に 3072 サンプルの 0、11 kHz 以上は伴奏へ、左右を 1 回の複素 FFT）は `dsp.js` 冒頭に書いてある。`dsp.js` を変えたら、マスク 1（ボーカル＝入力・伴奏＝0）でボーカル＋伴奏が元の音に 16 ビットの丸め以内で戻ることを確かめる。
- ONNX Runtime のバージョンは `separator.js` の `ORT_BASE` と `sw.js` の `ORT`。変えるときは両方を同じ PR で。
- 音程検出は pitchy（`vendor/` にコピー。改変は import のパスと ES モジュール化だけ）。メロディの線は `pitch.js`（22.05 kHz、窓 1024、10 ms ごと、clarity 0.8、65〜1100 Hz、歌の 95 パーセンタイルより 35 dB 小さい所は無声、5 フレームのメディアン、70 ms 未満は捨てる）。マイクはページ側（`index.html` の `detect()`、窓 2048、clarity 0.88、3 つのメディアン）。
- 再生とマイクは同じ AudioWorklet（`mixer.js`）。マイクの 1024 サンプルごとに、その時の曲の位置を付けてページに送る。残るずれは端末の遅延だけで、`store.latency`（設定の「遅延を測る」か手動。未設定なら `outputLatency + baseLatency + 30 ms`）を引く。
- ロール（音程の線）の操作: ピンチ（タッチ・トラックパッド・Ctrl＋ホイール）で時間方向だけ拡大・縮小（`SPAN_MIN`〜`SPAN_MAX` 秒）。PC は2本指スクロールで横＝時間・縦＝音の高さ（Shift＋ホイールで時間）、タッチは横ドラッグで時間・2本指で上下と拡大縮小。スクロールすると追従をやめ、再生位置が追従の位置（幅の 45%）まで来るか ▶・シークで追従に戻る（ベースライン §9-16）。音の高さの端まで来たらホイールはページのスクロールに渡す。時間の縦線と時刻、歌い出しまでの秒数（3 秒以上あるとき）を出す。
- 判定: ズレはオクターブを畳んで −600〜+600 セント（`fold()`）。オクターブ違いは正解。自分のオクターブは歌いはじめの 30 フレーム以上の差の中央値（手動でも選べる）。緑・黄の幅は `STRICT`（やさしい 75/150、ふつう 50/100、きびしい 25/50）。答え合わせは、原曲が歌っていて利用者も歌ったフレームだけで数える。ズレた区間は休み（0.4 秒以上）で区切り、休みのない 2 秒以上の区間は音の始まりで区切る。
- 曲は IndexedDB（`karaoketrainer`、`index` と `songs`、キーはファイルの SHA-256 の先頭 128 ビット）に最近の `KEEP_SONGS`（8）曲まで。録音は「この録音を残す」を押したときだけ保存。SharedArrayBuffer は IndexedDB に入らないので普通の配列にコピーして保存する。
- 設定は `localStorage` の `karaoketrainer-state`（`v: 1`。ボーカル・伴奏の音量とミュートも）、マイ音域は `karaoketrainer-range`。音域は任意で、登録しなくても全機能が使える（おすすめキーの欄は控えめな案内だけ）。
- キー変更は `keyshift.js`（Band Stem Mixer（ktkwmr/BandStemMixer、MIT、同じ作者）からのコピー。`makeFft` は `dsp.js` から）。片方で直した不具合はもう片方にも移す案を出す。
- ページはクロスオリジン分離（`public/_headers` の COOP same-origin、COEP **credentialless**。ベースライン §6-6）。外部から読むファイルは CORS で。外部ホストを足したら `_headers` の CSP と、プライバシーの説明（`scripts/pages/privacy.mjs`、アプリ内の `privacy.body`、README）を同じ PR で直す。マイクは `Permissions-Policy: microphone=(self)`。
- 大きなダウンロードの前の確認は `connectionRisk()`・`askNetwork()`（ベースライン §9-13）。分離の設定は `MODES`・`LADDER`（Band Stem Mixer と同じ考え方）。
- URL・YouTube からの取り込みは作らない（著作権への配慮。仕様書 §4-1）。
- 区間ループ（A–B）とテンポ変更は入れない（2026-11-22 にユーザーが不要と判断。仕様書の未決事項）。答え合わせのズレた区間はタップでその 1 秒前から再生するだけ。
- 記事は `scripts/pages/<slug>.mjs`（`guide`・`faq`）。アプリと共通の値は `scripts/pages/app.mjs` がアプリのファイルから読む。画面写真は `node scripts/render-guide-images.mjs`（デモ曲と、偽のマイクに流す歌声で撮る。モデル不要）。見た目を変えたら撮り直す。記事を足したら `build-pages.mjs` の `PAGES` と `index.html` の `intro.body`（英日）にも足す。
- 動作確認は `scripts/test/`（偽のモデル・テスト用の曲と歌声・ローカルサーバー・E2E。README の「開発」）。本物のモデル・CDN・実機には Claude の環境から届かないので、確かめられなかったことは「未確認」と書き、ユーザーに確認手順を伝える（ベースライン §12-13・§12-14）。
- トップページ（https://ktkwmr.com/）のアプリ一覧に載せたら、アプリ名・説明・アイコン・記事を変えたときに `ktkwmr/ktkwmr.com` の `scripts/pages/home.mjs` を直す PR を別に出す（ベースライン §2-16）。
- 記事を追加・変更したら、PR のプレビューで人間が内容を確認してからマージする（ベースライン §10-7、`docs/article-review.md`）。
- 作業はブランチ → PR → Cloudflare のプレビュービルド確認 → squash マージ。
