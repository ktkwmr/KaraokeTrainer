import { MODEL_MB, KEEP_SONGS } from "./app.mjs";

// Privacy policy (site information page, linked from the footer and from the app's Privacy dialog).
// Includes the external-transmission notice required in Japan (電気通信事業法の外部送信規律).
// Update `modified` and the dates at the end when the content changes (for example when a service is added).
const ISSUES = "https://github.com/ktkwmr/KaraokeTrainer/issues";
const CLOUDFLARE = "https://www.cloudflare.com/privacypolicy/";
const JSDELIVR = "https://www.jsdelivr.com/terms/privacy-policy-jsdelivr-net";

export default {
  slug: "privacy",
  schemaType: "WebPage",
  modified: "2026-11-21",
  en: {
    title: "Privacy Policy",
    heading: "Privacy policy",
    nav: "Privacy policy",
    description:
      "How Karaoke Trainer handles information: your song and your voice are processed on your device and never uploaded, how the microphone is used, the AI engine download (jsDelivr), the songs and settings saved in your browser, analytics without cookies, and no ads.",
    body: () => `
<p class="lead">This policy explains how Karaoke Trainer (https://ktkwmr.com/karaoketrainer/, "this site") handles information. In short: your song and your voice are processed on your device and never uploaded. To separate the vocals, your browser downloads an AI model from this site and a library from an external CDN.</p>

<nav class="toc" aria-label="Contents"><b>Contents</b><ol>
  <li><a href="#app">What you do in the app</a></li>
  <li><a href="#storage">Data saved in your browser</a></li>
  <li><a href="#external">Information sent to external services</a></li>
  <li><a href="#cookies">Cookies and advertising</a></li>
  <li><a href="#analytics">Analytics</a></li>
  <li><a href="#third-party">Sharing with third parties</a></li>
  <li><a href="#contact">Contact</a></li>
  <li><a href="#changes">Changes to this policy</a></li>
</ol></nav>

<h2 id="app">1. What you do in the app</h2>
<p>The audio file you choose is read, separated into the vocals and the accompaniment by the AI model, analyzed (the melody line of the vocals), moved to another key when you ask, and played only in your browser. The file, the separated audio, the melody line, and the file name are never sent to our server or to anyone else.</p>
<p><b>Microphone:</b> the app uses the microphone only while you sing (“Sing”), measure your vocal range, or measure the delay, and only after your browser asks for your permission. Your voice is analyzed (its pitch) and recorded only in your browser; the recording and the results are never sent anywhere. A recording is kept on your device only when you press “Keep this recording”, and “Save as WAV” only saves a file on your device.</p>
<p>This site has no accounts, and we do not ask for your name, email address, or other personal information.</p>

<h2 id="storage">2. Data saved in your browser</h2>
<p>The following data is saved in your browser's storage on your device. It is not sent to us.</p>
<ul>
  <li><b>The AI model:</b> the model files (about ${MODEL_MB} MB) downloaded the first time you load a song, so they are not downloaded again.</li>
  <li><b>Songs you loaded:</b> the separated vocals and accompaniment, the melody line, the file name, and the length of the last songs you loaded (up to ${KEEP_SONGS}), so they open at once next time, even offline. Your original file is not copied.</li>
  <li><b>Recordings you chose to keep:</b> only when you press “Keep this recording”, with the song.</li>
  <li><b>Your vocal range:</b> only if you measure it (the lowest and highest notes).</li>
  <li><b>Settings:</b> the vocal and accompaniment levels, how strict the judging is, the delay correction, the microphone options, and whether to show the headphones notice. While a song is being separated, a short note of the progress is kept, so that if the page closes unexpectedly the app can tell you where it stopped.</li>
  <li><b>App files:</b> the pages and files of this site and the ONNX Runtime library, so the app works offline.</li>
</ul>
<p>To delete them, use ⚙ → “Delete saved songs”, ⚙ → “Delete the AI model”, and “Delete” in “My vocal range” in the app, or clear this site's data (site data, cookies, and storage for ktkwmr.com) in your browser settings.</p>

<h2 id="external">3. Information sent to external services</h2>
<p>When you use this site, your browser sends information to the following services. This list also serves as the notice of external transmission required under Japan's Telecommunications Business Act.</p>
<div class="table-wrap">
  <table class="text stack">
    <thead><tr><th scope="col">Service (operator)</th><th scope="col">When</th><th scope="col">Information sent</th><th scope="col">Purpose</th></tr></thead>
    <tbody>
      <tr><th scope="row"><a href="${CLOUDFLARE}" rel="noopener">Cloudflare</a> (Cloudflare, Inc.)</th><td data-label="When:">Every page and file request</td><td data-label="Information sent:">IP address, browser information (user agent), requested URL, date and time</td><td data-label="Purpose:">Hosting this site, security, and access logs for operation</td></tr>
      <tr><th scope="row"><a href="${CLOUDFLARE}" rel="noopener">Cloudflare Web Analytics</a> (Cloudflare, Inc.)</th><td data-label="When:">Every page view</td><td data-label="Information sent:">IP address, browser information (user agent), the URL of the page, referrer, page load time. No cookies are used.</td><td data-label="Purpose:">Counting page views (see "Analytics" below)</td></tr>
      <tr><th scope="row"><a href="${JSDELIVR}" rel="noopener">jsDelivr</a> (a CDN run by Prospect One and its partners)</th><td data-label="When:">When you load a new song (until the library is saved in your browser)</td><td data-label="Information sent:">IP address, browser information (user agent), the URL of the library file, the page that requested it (referrer), date and time. Nothing about your song or your voice is sent.</td><td data-label="Purpose:">Downloading ONNX Runtime Web, the library that runs the AI model</td></tr>
    </tbody>
  </table>
</div>

<h2 id="cookies">4. Cookies and advertising</h2>
<p>This site does not set cookies and does not show ads. If we add ads in the future, we will update this policy before they are shown.</p>

<h2 id="analytics">5. Analytics</h2>
<p>To see how many people use this site, we use <b>Cloudflare Web Analytics</b>. It counts page views without cookies and without identifying or tracking individual visitors across sites. We do not use Google Analytics.</p>

<h2 id="third-party">6. Sharing with third parties</h2>
<p>We do not collect personal information that identifies you, and we do not sell or provide it to third parties, except where required by law.</p>

<h2 id="contact">7. Contact</h2>
<p>For questions about this policy, please open an issue on <a href="${ISSUES}" rel="noopener">GitHub Issues</a>. See <a href="../about/">about this site</a> for the operator.</p>

<h2 id="changes">8. Changes to this policy</h2>
<p>We may update this policy when the site changes, for example when we add or remove a service. The updated policy applies from the time it is posted on this page.</p>
<p>Effective: November 21, 2026</p>
`,
  },
  ja: {
    title: "プライバシーポリシー",
    heading: "プライバシーポリシー",
    nav: "プライバシーポリシー",
    description:
      "Karaoke Trainer のプライバシーポリシー。曲と声は端末の中で処理してアップロードしないこと、マイクの使い方、AI エンジンのダウンロード（jsDelivr）、ブラウザに保存する曲と設定、Cookie を使わないアクセス解析、広告がないことについて。",
    body: () => `
<p class="lead">Karaoke Trainer（https://ktkwmr.com/karaoketrainer/、以下「本サイト」）での情報の取り扱いについて説明します。要点は、曲もあなたの声も端末の中で処理し、どこにもアップロードしないことです。ボーカルを分離するために、ブラウザが本サイトから AI モデルを、外部の CDN からライブラリをダウンロードします。</p>

<nav class="toc" aria-label="目次"><b>目次</b><ol>
  <li><a href="#app">アプリで行うこと</a></li>
  <li><a href="#storage">ブラウザに保存するデータ</a></li>
  <li><a href="#external">外部への情報の送信</a></li>
  <li><a href="#cookies">Cookie と広告</a></li>
  <li><a href="#analytics">アクセス解析</a></li>
  <li><a href="#third-party">第三者への提供</a></li>
  <li><a href="#contact">お問い合わせ</a></li>
  <li><a href="#changes">改定</a></li>
</ol></nav>

<h2 id="app">1. アプリで行うこと</h2>
<p>選んだ音声ファイルの読み込み、AI モデルによるボーカルと伴奏への分離、解析（ボーカルのメロディの線）、キーの変更、再生は、ブラウザの中だけで行います。ファイル、分離した音声、メロディの線、ファイル名が、運営者のサーバーやほかの誰かに送られることはありません。</p>
<p><b>マイク：</b>マイクは、歌うとき（「歌う」）、音域を測るとき、遅延を測るときだけ、ブラウザが許可を求めたあとに使います。あなたの声の解析（音程）と録音はブラウザの中だけで行い、録音や結果をどこかに送ることはありません。録音は「この録音を残す」を押したときだけ端末に保存し、「WAVで保存」も端末にファイルを保存するだけです。</p>
<p>本サイトにはアカウント登録はなく、氏名やメールアドレスなどの個人情報をお聞きすることもありません。</p>

<h2 id="storage">2. ブラウザに保存するデータ</h2>
<p>次のデータを、お使いの端末のブラウザ内に保存します。運営者に送られることはありません。</p>
<ul>
  <li><b>AI モデル：</b>次から再びダウンロードしなくて済むよう、初めて曲を読み込んだときにダウンロードしたモデルのファイル（約 ${MODEL_MB} MB）を保存します。</li>
  <li><b>読み込んだ曲：</b>次からすぐに（オフラインでも）開けるよう、最近読み込んだ曲（${KEEP_SONGS} 曲まで）の分離したボーカルと伴奏、メロディの線、ファイル名、長さを保存します。元のファイルはコピーしません。</li>
  <li><b>残すことにした録音：</b>「この録音を残す」を押したときだけ、曲と一緒に保存します。</li>
  <li><b>マイ音域：</b>測った場合だけ（一番低い音と一番高い音）。</li>
  <li><b>設定：</b>ボーカルと伴奏の音量、判定の厳しさ、遅延の補正、マイクの設定、ヘッドホンの案内を表示するかどうか。分離の途中は、予期せずページが閉じたときにどこで止まったかを伝えられるよう、進み具合を短く記録します。</li>
  <li><b>アプリのファイル：</b>オフラインでも使えるよう、本サイトのページやファイルと ONNX Runtime のライブラリを保存します。</li>
</ul>
<p>消したいときは、アプリの ⚙ →「保存した曲を削除」、⚙ →「AI モデルを削除」、「マイ音域」の「削除」を使うか、ブラウザの設定でこのサイト（ktkwmr.com）のデータ（サイトデータ・Cookie・ストレージ）を削除してください。</p>

<h2 id="external">3. 外部への情報の送信</h2>
<p>本サイトを利用すると、お使いのブラウザから次のサービスに情報が送信されます。この一覧は、電気通信事業法の外部送信規律に基づく公表を兼ねています。</p>
<div class="table-wrap">
  <table class="text stack">
    <thead><tr><th scope="col">送信先（事業者）</th><th scope="col">送信のタイミング</th><th scope="col">送信される情報</th><th scope="col">利用目的</th></tr></thead>
    <tbody>
      <tr><th scope="row"><a href="${CLOUDFLARE}" rel="noopener">Cloudflare</a>（Cloudflare, Inc.）</th><td data-label="タイミング：">すべてのページ・ファイルの読み込み時</td><td data-label="送信される情報：">IP アドレス、ブラウザの情報（ユーザーエージェント）、アクセスした URL、日時</td><td data-label="利用目的：">本サイトの配信、セキュリティの確保、運用のためのアクセスログ</td></tr>
      <tr><th scope="row"><a href="${CLOUDFLARE}" rel="noopener">Cloudflare Web Analytics</a>（Cloudflare, Inc.）</th><td data-label="タイミング：">ページを開いたとき</td><td data-label="送信される情報：">IP アドレス、ブラウザの情報（ユーザーエージェント）、閲覧したページの URL、参照元、ページの表示速度。Cookie は使いません。</td><td data-label="利用目的：">ページの閲覧数の集計（「アクセス解析」の項目を参照）</td></tr>
      <tr><th scope="row"><a href="${JSDELIVR}" rel="noopener">jsDelivr</a>（Prospect One とそのパートナーが運営する CDN）</th><td data-label="タイミング：">新しい曲を読み込むとき（ライブラリがブラウザに保存されるまで）</td><td data-label="送信される情報：">IP アドレス、ブラウザの情報（ユーザーエージェント）、ライブラリのファイルの URL、読み込んだページ（参照元）、日時。曲や声の情報は送りません。</td><td data-label="利用目的：">AI モデルを動かすライブラリ ONNX Runtime Web のダウンロード</td></tr>
    </tbody>
  </table>
</div>

<h2 id="cookies">4. Cookie と広告</h2>
<p>本サイトは Cookie を設定せず、広告も表示しません。今後広告を表示する場合は、表示を始める前に本ポリシーを改定します。</p>

<h2 id="analytics">5. アクセス解析</h2>
<p>本サイトの利用状況を知るため、<b>Cloudflare Web Analytics</b> を使用しています。Cookie を使わずにページの閲覧数を集計するもので、個人を特定したり、ほかのサイトをまたいで追跡したりはしません。Google アナリティクスは使用していません。</p>

<h2 id="third-party">6. 第三者への提供</h2>
<p>本サイトは、個人を特定できる情報を収集していません。法令に基づく場合を除き、個人情報を第三者に販売・提供することはありません。</p>

<h2 id="contact">7. お問い合わせ</h2>
<p>本ポリシーについてのご質問は、<a href="${ISSUES}" rel="noopener">GitHub の Issues</a> にお寄せください。運営者については<a href="../about/">運営者情報</a>をご覧ください。</p>

<h2 id="changes">8. 改定</h2>
<p>サービスの追加・終了など本サイトの変更に合わせて、本ポリシーを改定することがあります。改定後のポリシーは、このページに掲載した時点から適用されます。</p>
<p>制定日：2026 年 11 月 21 日</p>
`,
  },
};
