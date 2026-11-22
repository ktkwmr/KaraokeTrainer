// Operator information (site information page, linked from the footer)
const ISSUES = "https://github.com/ktkwmr/KaraokeTrainer/issues";
const REPO = "https://github.com/ktkwmr/KaraokeTrainer";

export default {
  slug: "about",
  schemaType: "AboutPage",
  modified: "2026-11-21",
  en: {
    title: "About This Site",
    heading: "About this site",
    nav: "About this site",
    description: "Operator information for Karaoke Trainer: who runs the site, how to contact us, disclaimer, and copyright.",
    body: () => `
<div class="table-wrap">
  <table class="text stack">
    <tbody>
      <tr><th scope="row">Site name</th><td>Karaoke Trainer</td></tr>
      <tr><th scope="row">URL</th><td><a href="/karaoketrainer/">https://ktkwmr.com/karaoketrainer/</a></td></tr>
      <tr><th scope="row">Operator</th><td>ktkwmr (individual developer)</td></tr>
      <tr><th scope="row">What we offer</th><td>A free web app for karaoke practice: it separates the vocals of your own song file with AI on your device and shows your pitch over the original melody as you sing, with key change and a key suggestion for your vocal range</td></tr>
      <tr><th scope="row">Contact</th><td><a href="${ISSUES}" rel="noopener">GitHub Issues</a></td></tr>
    </tbody>
  </table>
</div>

<h2 id="contact">Contact</h2>
<p>For questions, bug reports, and suggestions, please open an issue on <a href="${ISSUES}" rel="noopener">GitHub Issues</a>. A GitHub account (free) is required.</p>
<p>Issues are public. Do not include personal information, and do not attach songs or recordings. If something fails, the error message, the length and format of the file (for example <code>4:30, MP3</code> or <code>4:30, MP4 video</code>), your browser, your device, and the headphones you use are enough.</p>

<h2 id="disclaimer">Disclaimer</h2>
<ul>
  <li>The separation is done by an AI model and is not perfect: some of the accompaniment can stay in the vocals and the other way round. The melody line and the judging of your pitch are made automatically and can be wrong, for example with backing vocals, harmonies, or spoken parts. They are a guide for practice, not a score or an evaluation of your singing. We do not guarantee the results or that the information on this site is correct or complete.</li>
  <li>Separation needs memory and processing. On some devices it can be slow or fail, and the device can get warm.</li>
  <li>Use song files you bought or recorded, for your own practice. Publishing or distributing separated audio of other people's songs may infringe copyright. You are responsible for how you use the files.</li>
  <li>We are not responsible for any loss or damage resulting from the use of this site.</li>
  <li>Links to other websites are provided for convenience. We are not responsible for their content.</li>
  <li>The content of this site may be changed or removed, and the service may be stopped, without notice.</li>
</ul>

<h2 id="copyright">Copyright</h2>
<ul>
  <li>The app's source code is published under the <a href="${REPO}/blob/main/LICENSE" rel="noopener">MIT License</a>. The libraries used by the app are listed under Settings → About in the app.</li>
  <li>The AI model is Spleeter (2 stems) by Deezer, whose code and trained models are published under the MIT License, converted to ONNX by the sherpa-onnx project (Apache License 2.0). This site serves the model files itself. The licenses of the model and the libraries are listed under ⚙ → About in the app.</li>
  <li>The text and images on this site are © 2026 ktkwmr.</li>
</ul>

<h2 id="privacy">Privacy</h2>
<p>How this site handles information is described in the <a href="../privacy/">privacy policy</a>.</p>
`,
  },
  ja: {
    title: "運営者情報",
    heading: "運営者情報",
    nav: "運営者情報",
    description: "Karaoke Trainer の運営者情報。運営者、お問い合わせ先、免責事項、著作権について。",
    body: () => `
<div class="table-wrap">
  <table class="text stack">
    <tbody>
      <tr><th scope="row">サイト名</th><td>Karaoke Trainer</td></tr>
      <tr><th scope="row">URL</th><td><a href="/karaoketrainer/ja/">https://ktkwmr.com/karaoketrainer/ja/</a></td></tr>
      <tr><th scope="row">運営者</th><td>ktkwmr（個人開発者）</td></tr>
      <tr><th scope="row">内容</th><td>手持ちの曲のボーカルを AI で端末の中で分離し、歌うと原曲のメロディに自分の音程を重ねて表示する、無料のカラオケ練習用 Web アプリ（キーの変更、音域からのおすすめキーつき）</td></tr>
      <tr><th scope="row">お問い合わせ</th><td><a href="${ISSUES}" rel="noopener">GitHub の Issues</a></td></tr>
    </tbody>
  </table>
</div>

<h2 id="contact">お問い合わせ</h2>
<p>ご質問・不具合の報告・ご要望は、<a href="${ISSUES}" rel="noopener">GitHub の Issues</a> にお寄せください。投稿には GitHub のアカウント（無料）が必要です。</p>
<p>Issues の内容は公開されます。個人情報は書かず、曲や録音のファイルも添付しないでください。うまく動かないときは、エラーの文言、ファイルの長さと形式（例: <code>4:30・MP3</code>、<code>4:30・MP4 動画</code>）、ブラウザと端末の種類、使っているヘッドホンがあれば十分です。</p>

<h2 id="disclaimer">免責事項</h2>
<ul>
  <li>分離は AI モデルが行うもので、完全ではありません。ボーカルに伴奏の一部が残ったり、その逆が起きたりします。メロディの線や音程の判定も自動で作るもので、コーラスやハモリ、セリフの部分などでは間違うことがあります。練習の目安であり、点数や歌の評価ではありません。結果や、本サイトの情報が正確・完全であることを保証するものではありません。</li>
  <li>分離にはメモリと処理が必要です。端末によっては時間がかかったり失敗したりし、端末が熱くなることがあります。</li>
  <li>購入した曲や自分で録音した曲のファイルを、自分の練習に使ってください。ほかの人の曲を分離した音声を公開・配布すると、著作権の侵害になることがあります。ファイルの使い方は利用者の責任となります。</li>
  <li>本サイトの利用によって生じた損害について、運営者は責任を負いません。</li>
  <li>本サイトからリンクしている外部サイトの内容について、運営者は責任を負いません。</li>
  <li>本サイトの内容は、予告なく変更・削除したり、提供を終了したりすることがあります。</li>
</ul>

<h2 id="copyright">著作権</h2>
<ul>
  <li>アプリのソースコードは <a href="${REPO}/blob/main/LICENSE" rel="noopener">MIT ライセンス</a>で公開しています。アプリが使用しているライブラリは、アプリの「設定 → このアプリについて」に掲載しています。</li>
  <li>AI モデルは Deezer の Spleeter（2 分割）です。コードと学習済みモデルは MIT ライセンスで公開されており、sherpa-onnx プロジェクト（Apache License 2.0）が ONNX 形式に変換したものを、本サイトから配信しています。モデルとライブラリのライセンスは、アプリの ⚙ →「このアプリについて」に掲載しています。</li>
  <li>本サイトの文章と画像の著作権は ktkwmr に帰属します（© 2026 ktkwmr）。</li>
</ul>

<h2 id="privacy">プライバシー</h2>
<p>本サイトでの情報の取り扱いについては<a href="../privacy/">プライバシーポリシー</a>をご覧ください。</p>
`,
  },
};
