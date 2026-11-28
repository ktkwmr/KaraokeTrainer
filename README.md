# Karaoke Trainer

A free karaoke practice app in the browser: load a song file you have, AI separates the vocals, and while you sing, your pitch is drawn over the original melody so you can see where you went flat or sharp. It can also suggest a key for your vocal range.

ブラウザで使える無料のカラオケ練習アプリ。手持ちの曲のファイルを読み込むと AI がボーカルを分離し、歌うと原曲のメロディの線に自分の音程が重ねて描かれるので、どこで高すぎたか・低すぎたかが目でわかります。自分の音域に合うキーも提案します。

- App / アプリ: https://ktkwmr.com/karaoketrainer/ （日本語: https://ktkwmr.com/karaoketrainer/ja/ ）
- Guide / 使い方: https://ktkwmr.com/karaoketrainer/guide/ ・ FAQ: https://ktkwmr.com/karaoketrainer/faq/

## Features / 機能

- **Load a song file** (MP3, WAV, M4A, FLAC, Ogg…, up to 10 minutes), or a video file (MP4, MOV, WebM…: only its sound is used). No URLs or YouTube: only files on your device. / **曲のファイルを読み込む**（10分まで。動画のファイルも可で、音声だけを使う）。URL や YouTube からの取り込みはなし。
- **Vocal separation** with Spleeter 2stems (vocals / accompaniment) in the browser, then the melody of the vocals (pitchy, every 10 ms) as karaoke-style **note bars** (each note on the nearest semitone, with the song's tuning). / ブラウザの中で **ボーカルを分離**し、ボーカルのメロディを **音のバー**（カラオケのように一番近い半音に寄せる）にする。
- **Mixer**: vocal 0–100% (0% = karaoke, in between = a quiet guide), accompaniment, mute for each, key −6…+6 semitones (the bars move with it), tempo slider 50–150% (1% steps, − / + 5%; same key), double-tap a slider for 100%. / **ボーカル音量**（0%＝カラオケ）・伴奏・キー変更（バーも連動）・テンポ（50〜150%、キーはそのまま）・スライダーのダブルタップで 100%。
- **The roll** zooms in time with a pinch (touch, trackpad, Ctrl + wheel) and scrolls in time and pitch (two-finger scroll; on touch, a one-finger drag); a thin line on every beat (quarter note, found in the accompaniment) and an intro countdown; songs without a steady beat get time lines instead. / **ロール** はピンチで時間方向に拡大・縮小、2本指のスクロールやドラッグで前後・上下へ。拍（4分音符、伴奏から検出）ごとの縦線と歌い出しまでの秒数（拍が見つからない曲は時間の目盛り）。
- **Sing and see your pitch** over the bars: green / yellow / red by how far from the note (±70 / ±140 cents by default, three settings; up to 0.1 s early or late is judged against that note); a note's bar fills in green when the median of your pitch over it is in the green range (so vibrato does not count against you); the percentage on the results is the share of the melody, by length, whose notes turned green. The delay correction is also on the results, and the take's line moves with it. Singing an octave lower or higher counts as on pitch; the octave is found automatically. / **歌うと音程を重ねて表示**（音ごとに音程の中央値で判定し、合っているとバーが緑に。ビブラートは外れにならない。答え合わせの遅延の補正で線のずれを合わせられる）。オクターブ違いは正解。
- **Results**: on-pitch share, sung share, average high/low, the phrases that went off (tap to sing it again), listen again with a “My voice” slider next to Vocal and Accompaniment (the vocal starts muted after a take), the last take kept and opened with the song, “Delete the recording” next to Sing, “Save (MP3)”: the whole song as you hear it, your voice muted or not (192 kbps, lamejs; a dialog and an ID3 comment say it is for personal use only). / **答え合わせ**：一致率、ズレた区間（タップで歌い直し）、自分の声つきで聴き直し、録音を削除、保存（MP3）。
- **My vocal range (optional)**: measure the lowest / highest note (and falsetto), then each song suggests a key. / **マイ音域（任意）** と曲ごとのおすすめキー。
- **Delay correction** on the results (measured with beeps, or by hand; the take's line moves with it). Settings: microphone options, judging strictness. / 答え合わせに遅延補正（測定か手動。録音の線も一緒に動く）。設定はマイクと判定の厳しさ。
- Songs are kept in IndexedDB (key: SHA-256 of the file), so they open at once and offline. PWA. English / Japanese. / 曲は IndexedDB に保存（次回はすぐに・オフラインでも）。PWA。日英。

### How it works / 仕組み

- `separator.js` (worker): ONNX Runtime Web (WebGPU or WebAssembly) runs `vocals.onnx` and `accompaniment.onnx` (Spleeter 2stems converted to ONNX by sherpa-onnx). `dsp.js` does the STFT / masks / inverse STFT around the model as sherpa-onnx does (44.1 kHz, FFT 4096, hop 1024, input `[2, splits, 512, 1536]`: up to 16 kHz, as Spleeter's own `2stems-16kHz` configuration with the same weights; `fetch-model.mjs` frees the frequency axis declared as 1024 in the ONNX files), one 11.9 s split at a time. Then `pitch.js` finds the melody (pitchy, McLeod Pitch Method), and `beats.js` the beats of the accompaniment (copied from Loop Trainer, same author: spectral flux → tempo by autocorrelation → beats by dynamic programming).
- `mixer.js` (AudioWorklet): plays the tracks and receives the microphone in the same node, tagging each microphone block with the song position, so only the device latency (calibration) is left to correct.
- `keyshift.js` (worker): phase vocoder key and tempo change, from Band Stem Mixer (same author; the tempo is added here). The page keeps every position in the song's own time; `mixer.js` reads the stretched tracks at position / tempo.

## Privacy / プライバシー

Your song and your voice are processed only in your browser and never uploaded. The microphone is used only while singing or measuring. The browser downloads the AI model from this site and ONNX Runtime Web from jsDelivr (and the lamejs MP3 encoder when you save your singing with the song). Saved in the browser: the model, the songs you loaded, recordings you chose to keep, your range, and settings. Cloudflare Web Analytics (no cookies) counts page views. No ads, no accounts.

Only if you choose “Accept all” in the cookie banner, Google Analytics (through Cloudflare Zaraz, sent from Cloudflare's servers with a shortened IP address) records how the app is used: pages viewed and for how long, buttons tapped and settings changed, playing time, the kind and length of the songs opened and how the separation went, and the results shown after you sing. File names, the music itself, and your voice are never sent. Change your choice from “Cookie settings” at the bottom of the page. See [docs/analytics.md](docs/analytics.md).

曲と声はブラウザの中だけで処理し、アップロードしません。マイクは歌うとき・測るときだけ使います。ブラウザは AI モデルをこのサイトから、ONNX Runtime Web を jsDelivr から（歌を曲と一緒に MP3 で保存するときは lamejs も）ダウンロードします。ブラウザに保存するのは、モデル・読み込んだ曲・残した録音・音域・設定です。アクセス数は Cloudflare Web Analytics（Cookie なし）で数えます。広告・アカウントなし。

Cookie のバナーで「すべて同意」を選んだ場合に限り、Google アナリティクス（Cloudflare Zaraz 経由。Cloudflare のサーバーから IP アドレスの末尾を削って送信）でアプリの使われ方（見たページと時間、押したボタンと変えた設定、再生した時間、開いた曲の種類と長さ・分離の結果、歌ったあとの答え合わせの結果）を記録します。ファイル名・曲そのもの・あなたの声は送りません。選択はページ下の「Cookie の設定」から変えられます。

Full policy / 詳しくは: https://ktkwmr.com/karaoketrainer/privacy/

## Project structure / 構成

```
public/
  _headers  404.html
  karaoketrainer/
    index.html            # the app (HTML/CSS/JS, English and Japanese text in I18N) / アプリ本体
    separator.js dsp.js pitch.js beats.js mixer.js keyshift.js  # workers and the AudioWorklet
    vendor/pitchy.js vendor/fft.js                     # pitch detection (MIT, copied from npm)
    sw.js manifest.json icons/ og-image.png THIRD_PARTY_LICENSES.md
    models/spleeter-2stems-v2/   # fetched in the build (scripts/fetch-model.mjs), not in Git
    ja/index.html                # generated / 生成
    guide/ faq/ about/ privacy/ ja/… sitemap.xml   # generated / 生成
    images/guide/                # screenshots (scripts/render-guide-images.mjs)
scripts/
  fetch-model.mjs build-ja.mjs build-pages.mjs pages/ update-third-party-licenses.mjs
  render-icons.mjs render-og-image.mjs og-image.html render-guide-images.mjs build-preview.mjs
  test/   # fake model, test audio, local server, end-to-end test
```

## Development / 開発

Node.js 22+. Do not open `index.html` as a `file://` page (the Service Worker and workers need a server). If you see an old version, reload (or restart the home-screen app).
`file://` では開かないでください。古い画面が出るときは再読み込みしてください。

```bash
npx wrangler dev
```

Then open http://localhost:8787/karaoketrainer/ . The build command downloads the model once (about 75 MB) into `public/karaoketrainer/models/`.
（Windows の PowerShell では `npx.cmd wrangler dev`）

If `wrangler dev` stops with `spawn UNKNOWN` on Windows (its local server `workerd.exe` could not start, for example blocked by Windows security), use the small Node server instead. It serves `public/` with the headers in `public/_headers`:
Windows で `wrangler dev` が `spawn UNKNOWN` で止まるとき（ローカルサーバーの `workerd.exe` が起動できない。Windows のセキュリティに止められた場合など）は、Node だけのサーバーを使います。

```bash
node scripts/fetch-model.mjs && node scripts/test/serve.mjs 8788
```

Then open http://localhost:8788/karaoketrainer/ .

Tests without the real model / 本物のモデルなしでの確認:

```bash
pip install onnx numpy && python3 scripts/test/make-fake-model.py /tmp/fake && node scripts/fetch-model.mjs --from /tmp/fake --force
```

```bash
node scripts/test/make-test-song.mjs /tmp/audio && node scripts/test/serve.mjs 8788
```

```bash
npm i --no-save onnxruntime-web@1.30.0 playwright && node scripts/test/e2e.mjs http://localhost:8788 /tmp/audio node_modules/onnxruntime-web/dist
```

Afterwards run `node scripts/fetch-model.mjs --force` to put the real model back. / 終わったら本物のモデルに戻す。

## Deploy / デプロイ

Cloudflare Workers static assets (Workers Builds): a push to `main` deploys. The Worker only has the route `ktkwmr.com/karaoketrainer*`; the domain root is `ktkwmr/ktkwmr.com`.
`main` に push すると Cloudflare Workers Builds がデプロイします。

## Generated files / 生成ファイル

Do not edit by hand / 手で編集しないもの: `public/karaoketrainer/ja/index.html` (`scripts/build-ja.mjs`), the guide / info pages and `sitemap.xml` (`scripts/build-pages.mjs`). Both have `--check`. GitHub Actions regenerate them on `main`, and add new CDN libraries to `THIRD_PARTY_LICENSES.md`.

## License / ライセンス

MIT © 2026 ktkwmr. Third-party software and the AI model (Spleeter, MIT; sherpa-onnx, Apache-2.0; ONNX Runtime Web, MIT; pitchy, MIT; fft.js, MIT): see `public/karaoketrainer/THIRD_PARTY_LICENSES.md`.
