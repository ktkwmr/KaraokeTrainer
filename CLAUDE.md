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
- 手で編集するのはアプリ本体 `public/karaoketrainer/index.html`・`separator.js`・`dsp.js`・`pitch.js`・`beats.js`・`mixer.js`・`keyshift.js`・`sw.js` と `scripts/`。生成ファイル（`ja/index.html`、情報ページ `<slug>/` とその `ja/`、`sitemap.xml`）は編集せず、`node scripts/build-ja.mjs` と `node scripts/build-pages.mjs` で作り直す（`--check` で確認）。
- 画面の文言は `index.html` の `I18N`（en / ja）に書き、要素には `data-i18n` / `data-i18n-html` / `data-i18n-attr` を付ける。JS で作る文言は `t()`。子要素を持つ要素に `data-i18n` は付けない（`build-ja.mjs` が止まる）。`intro.body`・`help.body` のモデルの大きさ（about 75 MB／約75MB）は `MODEL_MB` と同じ数にする（`scripts/pages/app.mjs` が確かめる）。
- **商用利用できるライセンスだけを使う**（仕様書 §3）。Spleeter（コードと学習済みモデルが MIT）、sherpa-onnx（Apache-2.0）、ONNX Runtime Web（MIT）、pitchy・fft.js（MIT）。HTDemucs（重みの条件が不明）、Open-Unmix UMX-L（非商用）、UMX-HQ（MUSDB18 で学習）、RoFormer 系（CC-BY-NC-SA）、pitchfinder（GPL）、Rubber Band（GPL）は使わない。新しいライブラリ・モデルを足すときは、重みのライセンスもコードと別に確かめる（ベースライン §7-8）。
- **モデルは自サイトで配信する**（外部 CDN 直リンクにしない）。`scripts/fetch-model.mjs` がビルドのとき sherpa-onnx のリリース（`sherpa-onnx-spleeter-2stems.tar.bz2`、fp32）から `vocals.onnx`・`accompaniment.onnx` を取り出し、25 MiB 以下（20 MiB ごと）に分けて `public/karaoketrainer/models/spleeter-2stems-v2/` に置く（v2：ONNX の入出力の周波数の軸の宣言 1024 を自由な次元 `F` にしたもの。重みは同じ）（`manifest.json` に部品・大きさ・SHA-256）。Git には入れない（`.gitignore`）。`separator.js` が部品をつないで Cache Storage `karaoketrainer-model-v2` に保存し、`sw.js` はモデルをキャッシュしない（`KEEP` で残す）。モデルを変えたら（fp16・int8 など）フォルダを `-v3` にし、`MODEL_DIR`・`MODEL_CACHE`（`index.html`・`separator.js`）、`sw.js` の `KEEP`、`fetch-model.mjs` を同じ PR で直す。
- 分離の前後の処理は `dsp.js`。sherpa-onnx の `offline-source-separation-spleeter-impl.h` と同じ値（44.1 kHz、FFT 4096、hop 1024、周期的 Hann、center なし、マスク est²/(v²+a²+1e-10)）。意図的な違い（入力は `[2, 分割数, 512, 1536]` の振幅＝16 kHz まで（Spleeter 本家の `2stems-16kHz` と同じ。1024＝11 kHz までだと、11 kHz より上のボーカルのサ行・息が伴奏に擦れた雑音として残った。2026-11-23）、512 フレームずつ処理、先頭に 3072 サンプルの 0、16 kHz 以上は伴奏へ、左右を 1 回の複素 FFT）は `dsp.js` 冒頭に書いてある。分離の結果が変わる変更（`dsp.js`・モデル）では `index.html` の `SEP_V` を上げる（保存済みの曲は一覧からはそのまま開き、同じファイルを開き直すと分離し直す。録音を残した曲はそのまま）。`dsp.js` を変えたら、マスク 1（ボーカル＝入力・伴奏＝0）でボーカル＋伴奏が元の音に 16 ビットの丸め以内で戻ることを確かめる。
- ONNX Runtime のバージョンは `separator.js` の `ORT_BASE` と `sw.js` の `ORT`。変えるときは両方を同じ PR で。
- 音程検出は pitchy（`vendor/` にコピー。改変は import のパスと ES モジュール化だけ）。メロディは `pitch.js`。`findPitch()` で線（22.05 kHz、窓 1024、10 ms ごと、clarity 0.8。0.5〜0.8 は 100 ms 以上同じ音程が続くか、隣の採用フレームから 0.7 半音以内に続くときだけ採る、65〜1100 Hz、歌の 95 パーセンタイルより 35 dB 小さい所は無声、オクターブ誤検出の補正（`fixOctaves()`：前後 0.5 秒の中央値から 9 半音以上離れたフレームを ±12・+19・+24 半音で戻す）、5 フレームのメディアン、70 ms 未満は捨てる）、`toBars()` でカラオケのような音のバー（曲全体のチューニング（小数部の円周平均、±0.45 半音まで）を引き、0.75 半音のヒステリシスで音を区切り、100 ms 未満の区切りは前の音へ、音ごとに中央値を丸める。250 ms 未満で前後の音から 7 半音以上離れた音はオクターブで戻すか、接する音に含めるか、捨てる。60 ms 以下のすき間は詰める）。保存する `line` はこのバー（値は整数＋チューニング）。`pitch.js` を変えたら `index.html` の `LINE_V` を上げる（保存済みの曲はボーカルから作り直す）。
- 歌っている間はマイクの音程をリアルタイムに線で描く（`index.html` の `detect()`、窓 2048、clarity 0.88、3 つのメディアン。録音後にバーにする案は 2026-11-23 にやめた：判定の理由が見えないため）。「遅延の補正」のスライダー（`latency`）と「遅延を測る」（`calibBtn`）は答え合わせだけに置く（2026-11-23。設定からは外した）。線と録音は録音したときの補正値（`take.lat`）を引いて `rawLine`・`rawCovered`・`audio` に置いてあり、補正を変えるとその差（`take.shift` = `take.lat` − 今の値）だけ動かす。`applyShift()` が線・判定・オクターブを、`mixer.js` の `offsets` が再生を、`mineAt()` が WAV・MP3 を合わせる。保存する録音は `v: TAKE_V`（3）・録音時のままの線・`covered`・`singOct`・`lat`（`lat` の無い録音は今の値で録音したものとして扱う）。
- 歌詞はアプリで出さない（2026-11-23 にユーザーが判断）。歌いながらほかのアプリ・タブで歌詞を見る想定なので、ページが裏に回っただけでは歌を止めない（パソコン・Android は続く）。マイクのトラックの `ended`／`mute` か AudioContext が `running` でなくなったとき（iPhone・iPad で画面から外れた、着信など）だけ `micLost()` で歌い終わりにし、そこまでの録音を残して `sing.lost` を出す。歌っている間の Wake Lock は取らない。
- 再生とマイクは同じ AudioWorklet（`mixer.js`）。マイクの 1024 サンプルごとに、その時の曲の位置を付けてページに送る。残るずれは端末の遅延だけで、`store.latency`（答え合わせの「遅延を測る」か手動。未設定なら `outputLatency + baseLatency + 30 ms`）を引く。
- ロール（音程の線）の操作: ピンチ（タッチ・トラックパッド・Ctrl＋ホイール）で時間方向だけ拡大・縮小（`SPAN_MIN`〜`SPAN_MAX` 秒）。PC は2本指スクロールで横＝時間・縦＝音の高さ（Shift＋ホイールで時間）、タッチは 1 本指のドラッグで横＝時間・縦＝音の高さ（ロールは `touch-action: none`。iPhone で縦のスワイプをページのスクロールに取られないように）、2本指で上下と拡大縮小。スクロールすると追従をやめ、再生位置が追従の位置（幅の 45%）まで来るか ▶・シークで追従に戻る（ベースライン §9-16）。音の高さの端まで来たらホイール・タッチのドラッグはページのスクロールに渡す（タッチは `window.scrollBy`）。拍（4分音符）ごとの縦線（8 px より詰まると 2・4… 拍おき）と、歌い出しまでの秒数（3 秒以上あるとき）を出す。拍が見つからない曲だけ、時間の縦線と時刻を出す。
- 拍は `beats.js`。`detectBeats()` は Loop Trainer（ktkwmr/LoopTrainer、同じ作者）の `// BEGIN analysis` 内のコピーで、変えたのは 16 ビットの曲を読む `scale` だけ。片方で直した不具合はもう片方にも移す案を出す。`separator.js` が伴奏から求め、`beatGrid()` で最初と最後の拍の外へ（端の 8 拍の中央値の間隔で）曲の頭と終わりまで延ばして、曲と一緒に保存する（`beats`・`beatsV`）。`beats.js` を変えたら `index.html` の `BEATS_V` を上げる（保存済みの曲は開いたあとに後ろで求め直す）。
- 判定: 相手はバーの音。ズレはオクターブを畳んで −600〜+600 セント（`fold()`）。**正解・不正解はバーごと**（`judgeBar()`、2026-11-23。ビブラートで揺れても外れにしないため）：そのバーの間の自分の音程のズレの中央値で決め、自分の線を `TIME_TOL`（0.1 秒）まで前後にずらして中央値が一番 0 に近いものを使う。録音が覆うフレームのうち `BAR_HEARD`（50%）以上で声が取れたバーだけ数える（歌っている最中のバーはそこまでの分で仮に判定）。自分の線の色はフレームごと（`refNear()`：その時のバーか、前後 `TIME_TOL` 以内のバーのうち近いほう）のまま。オクターブ違いは正解。自分のオクターブは歌っている間は歌いはじめの 30 フレーム以上の差の中央値、止めたあとは両方が歌っているフレーム全体の差の中央値（手動でも選べる）。緑・黄の幅は `STRICT`（やさしい 100/200、ふつう 70/140、きびしい 40/80）。緑と判定したバーを（録音が届いたところまで）緑に塗る。答え合わせは判定したバーだけで数え、「音程が合っていた」は緑のバーの長さ（録音が覆うフレーム数）÷判定したバーの長さ、平均のズレはバーの中央値の長さ重みの平均（±300 セント以上のバーは除く）。設定の「判定の厳しさ」の文言の数は `STRICT` と同じにする（`scripts/pages/app.mjs` が確かめる）。出す数字は「音程が合っていた」の割合と平均のズレだけ（「メロディのうち歌えた部分」は 2026-11-23 にユーザーが不要と判断して外した）。ズレた区間は休み（0.4 秒以上）で区切り、休みのない 2 秒以上の区間は音の始まりで区切り、緑のバーが `OFF_SHARE`（70%）未満の区間を出す。
- 曲は IndexedDB（`karaoketrainer` バージョン 2、`index`・`songs`・`takes`、キーはファイルの SHA-256 の先頭 128 ビット）に最近の `KEEP_SONGS`（8）曲まで。録音は歌い終わるたびに各曲の直前の 1 回分だけを `takes` に自動で保存（`keepTake()`。デモ曲と何も録れていない録音は除く。曲の `stems` は書き直さない）。曲を開いても答え合わせは自動で出さず、「前の録音を見る」（`prevBtn`）で開く。答え合わせの「自分の声を削除」（確認のダイアログつき）で消す。バージョン 1 で `songs` の `take` に入っていた録音は、曲を開いたときに `takes` へ移す。SharedArrayBuffer は IndexedDB に入らないので普通の配列にコピーして保存する。
- 設定は `localStorage` の `karaoketrainer-state`（`v: 1`。ボーカル・伴奏の音量とミュートも）、マイ音域は `karaoketrainer-range`。音域は任意で、登録しなくても全機能が使える（おすすめキーの欄は控えめな案内だけ）。
- 答え合わせには「閉じる」を付けない（閉じると録音を聴き直す方法が無くなるため。次に歌うか曲を替えるまで出したまま）。答え合わせを開いている間（`reviewing`）は、ミキサーに「自分の声」（`store.mine`、0〜200%、`take.gain` に掛ける）が出て、録音を鳴らす。原曲のボーカルのミュートはこの間だけ別（`reviewVocalMute`、歌い終わるたびにオン。保存しない）。音量は普段のスライダーと共通。
- キー変更は `keyshift.js`（Band Stem Mixer（ktkwmr/BandStemMixer、MIT、同じ作者）からのコピー。`makeFft` は `dsp.js` から）。片方で直した不具合はもう片方にも移す案を出す。
- ページはクロスオリジン分離（`public/_headers` の COOP same-origin、COEP **credentialless**。ベースライン §6-6）。外部から読むファイルは CORS で。外部ホストを足したら `_headers` の CSP と、プライバシーの説明（`scripts/pages/privacy.mjs`、アプリ内の `privacy.body`、README）を同じ PR で直す。マイクは `Permissions-Policy: microphone=(self)`。
- 大きなダウンロードの前の確認は `connectionRisk()`・`askNetwork()`（ベースライン §9-13）。分離の設定は `MODES`・`LADDER`（Band Stem Mixer と同じ考え方）。
- URL・YouTube からの取り込みは作らない（著作権への配慮。仕様書 §4-1）。
- **歌を曲と一緒に保存（MP3）は個人使用に限る**。保存のたびに確認のダイアログ（`useDlg`）を出し、ボタンの下にも注意書き（`res.mp3.note`）、ファイルの ID3 タグのコメント（`res.mp3.comment`）とファイル名（`-personal-use` / `-個人使用`）にも書く。共有・投稿を手伝う機能（共有ボタン・アップロード）は付けない。中身は答え合わせで聞こえているミックス（ボーカル・伴奏・自分の声のスライダーとミュートのとおり）で、歌った範囲だけ。歌ったときのキーと今のキーが違うときは保存しない。MP3 は `encoder.js`（Band Stem Mixer と同じ。lamejs（`@breezystack/lamejs`、LGPL-3.0）を改変せず CDN から別ファイルとして読む。バージョンは `encoder.js` の `LAME_URL` と `sw.js` の `CDN`）。
- 区間ループ（A–B）とテンポ変更は入れない（2026-11-22 にユーザーが不要と判断。仕様書の未決事項）。答え合わせのズレた区間はタップでその 1 秒前から再生するだけ。
- 記事は `scripts/pages/<slug>.mjs`（`guide`・`faq`）。アプリと共通の値は `scripts/pages/app.mjs` がアプリのファイルから読む。画面写真は `node scripts/render-guide-images.mjs`（デモ曲と、偽のマイクに流す歌声で撮る。モデル不要）。見た目を変えたら撮り直す。記事を足したら `build-pages.mjs` の `PAGES` と `index.html` の `intro.body`（英日）にも足す。
- 動作確認は `scripts/test/`（偽のモデル・テスト用の曲と歌声・ローカルサーバー・E2E。README の「開発」）。本物のモデル・CDN・実機には Claude の環境から届かないので、確かめられなかったことは「未確認」と書き、ユーザーに確認手順を伝える（ベースライン §12-13・§12-14）。
- トップページ（https://ktkwmr.com/）のアプリ一覧に載せたら、アプリ名・説明・アイコン・記事を変えたときに `ktkwmr/ktkwmr.com` の `scripts/pages/home.mjs` を直す PR を別に出す（ベースライン §2-16）。
- 記事を追加・変更したら、PR のプレビューで人間が内容を確認してからマージする（ベースライン §10-7、`docs/article-review.md`）。
- 作業はブランチ → PR → Cloudflare のプレビュービルド確認 → squash マージ。
