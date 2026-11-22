// Questions and answers. The answers are HTML; build-pages.mjs also puts a plain-text
// copy in the FAQPage structured data.
import { MODEL_MB, MAX_MIN, KEEP_SONGS, STRICT } from "./app.mjs";

const [G, Y] = STRICT.normal;

const EN = [
  { q: "Is Karaoke Trainer free?", a: "Yes. It is free, with no sign-up, no account, and no ads." },
  {
    q: "Are my song and my voice uploaded?",
    a: 'No. The song is separated and analyzed in your browser, and your voice is analyzed and recorded in your browser. Nothing about either is sent anywhere. See the <a href="../privacy/">privacy policy</a>.',
  },
  {
    q: "Do I have to measure my vocal range?",
    a: "No. The range is optional: loading a song, singing, and looking back at how you sang all work without it. If you measure it, each song also shows a suggested key.",
  },
  {
    q: "Which files can I use?",
    a: `Any audio format your browser can play: MP3, WAV, M4A (AAC), FLAC, Ogg, and others, up to ${MAX_MIN} minutes. Use files you bought or recorded.`,
  },
  {
    q: "Can I use songs from YouTube, Spotify, or Apple Music?",
    a: "No. The app only opens audio files on your device; it does not take songs from websites or streaming services (music from streaming services is protected and cannot be opened in other apps).",
  },
  {
    q: "Why is there a download the first time?",
    a: `The AI model that separates the vocals (about ${MODEL_MB} MB) runs on your device, so the browser downloads it once and keeps it. On mobile data the app asks first. ⚙ → “Delete the AI model” frees the space.`,
  },
  {
    q: "How long does loading a song take?",
    a: "On a recent computer, a 4-minute song is usually ready in a minute or two; phones take longer. The bar shows about how long is left. A song you loaded before opens at once from “Recent songs”.",
  },
  {
    q: "Does it work offline?",
    a: `Yes, once the app and the AI model are on your device. The last ${KEEP_SONGS} songs you loaded are kept, so you can open and practice them offline. Loading a new song offline also works if the model was downloaded before.`,
  },
  {
    q: "I sing an octave lower than the singer. Is that wrong?",
    a: "No. Singing an octave lower or higher counts as on pitch. The app finds your octave in the first seconds you sing and draws your line next to the melody. You can also choose the octave in the menu next to “Sing”.",
  },
  {
    q: "What do the colours mean?",
    a: `Green: within ±${G} cents of the melody; yellow: within ±${Y} cents; red: further off (100 cents = one semitone). Settings → “How strict” changes these ranges.`,
  },
  {
    q: "Why do I need headphones?",
    a: "With a speaker, the microphone hears the song too, including the original singer, and their voice gets mixed into your line. Wired headphones work best. If you must use a speaker, turn the vocal down to 0% and try Settings → “Echo cancellation”.",
  },
  {
    q: "My line is drawn later than the melody.",
    a: "Every device takes a little time to play sound and to hear the microphone; Bluetooth headphones take more. Use Settings → “Measure the delay” (say “ta” with each beep), or move the slider until your line sits on the melody when you sing in time.",
  },
  {
    q: "The grey line is missing or wrong in some places.",
    a: "The melody line is made from the separated vocals. Backing vocals, harmonies, rap or spoken parts, and very breathy or distorted singing can give a wrong or missing line there, and some of the accompaniment can stay in the vocals. Use it as a guide.",
  },
  {
    q: "Is the percentage a score?",
    a: "It is a rough guide, not a score: the share of the time you were within the green range, counted only where the original singer sings and you sang. The list of parts that went off, and listening to your recording, tell you more.",
  },
  {
    q: "Is my recording saved?",
    a: "Only if you press “Keep this recording” (it is kept on this device with the song), “Save my voice only (WAV)”, or “Save with the song (MP3)” (files on your device). Otherwise it is gone when you sing again or close the page.",
  },
  {
    q: "Can I save my singing with the song?",
    a: "Yes. After singing, “Save with the song (MP3)” saves your voice with the accompaniment as one MP3 file. It contains the song, so it is for your own practice only: do not upload it to video or social media sites, share it, or distribute it. The rights to the song belong to its rights holders.",
  },
  {
    q: "How is the suggested key chosen?",
    a: "From the melody, the app takes its low and high notes (leaving out the lowest and highest 5% of the time, so a single stray note does not count), and finds the key change from −6 to +6 semitones, possibly an octave lower or higher, that fits them best inside the range you measured.",
  },
  {
    q: "Does it work on a phone?",
    a: "Yes, in a recent browser. Loading a new song takes longer than on a computer; keep the screen on until it is ready. On iPhone and iPad, sound plays even with the silent switch on.",
  },
  {
    q: "Which AI model does it use?",
    a: "Spleeter (2 stems: vocals and accompaniment) by Deezer, released under the MIT License, in the ONNX format converted by the sherpa-onnx project. It is lighter than newer models, so it also runs on phones, but the separation is not perfect.",
  },
  {
    q: "How do I delete my data?",
    a: "⚙ → “Delete saved songs” deletes the songs and kept recordings; ⚙ → “Delete the AI model” deletes the model; “My vocal range” → “Delete” deletes your range. Clearing this site's data in the browser settings deletes everything.",
  },
];

const JA = [
  { q: "無料ですか？", a: "はい。無料で、登録もアカウントも不要、広告もありません。" },
  {
    q: "曲や声はアップロードされますか？",
    a: 'いいえ。曲の分離と解析も、声の解析と録音も、ブラウザの中だけで行います。どちらの情報もどこにも送りません。<a href="../privacy/">プライバシーポリシー</a>をご覧ください。',
  },
  {
    q: "音域を測らないと使えませんか？",
    a: "いいえ。音域の登録は任意です。曲の読み込み、歌う、答え合わせまで、測らなくても全部使えます。測っておくと、曲ごとにおすすめのキーも表示されます。",
  },
  {
    q: "どんなファイルが使えますか？",
    a: `ブラウザで再生できる音声ファイルなら使えます（MP3、WAV、M4A（AAC）、FLAC、Ogg など）。${MAX_MIN}分までです。購入した曲や自分で録音した曲のファイルを使ってください。`,
  },
  {
    q: "YouTube や Spotify、Apple Music の曲は使えますか？",
    a: "使えません。このアプリは端末にある音声ファイルだけを開き、サイトやストリーミングサービスから曲を取り込む機能はありません（ストリーミングの音楽は保護されていて、ほかのアプリでは開けません）。",
  },
  {
    q: "初回に大きなダウンロードがあるのはなぜですか？",
    a: `ボーカルを分離する AI モデル（約${MODEL_MB}MB）を端末の中で動かすため、最初に一度だけダウンロードして保存します。モバイルデータ通信のときは先に確認します。⚙ →「AIモデルを削除」で容量を空けられます。`,
  },
  {
    q: "曲の読み込みにどれくらいかかりますか？",
    a: "最近のパソコンなら、4分の曲でたいてい1〜2分です。スマホではもっとかかります。バーに残り時間の目安が出ます。一度読み込んだ曲は「最近の曲」からすぐに開けます。",
  },
  {
    q: "オフラインでも使えますか？",
    a: `はい。アプリと AI モデルが端末にあれば使えます。最近読み込んだ${KEEP_SONGS}曲までは保存されるので、オフラインでも開いて練習できます。モデルをダウンロード済みなら、オフラインで新しい曲を読み込むこともできます。`,
  },
  {
    q: "歌手より1オクターブ低く歌っています。間違いになりますか？",
    a: "なりません。1オクターブ下や上で歌っても正解として判定します。歌いはじめの数秒であなたのオクターブを判定し、メロディの隣に線を描きます。「歌う」の横のメニューで選ぶこともできます。",
  },
  {
    q: "線の色の意味は？",
    a: `緑：メロディとのズレが±${G}セント以内、黄：±${Y}セント以内、赤：それより外れ（100セント＝半音）。設定の「判定の厳しさ」で範囲を変えられます。`,
  },
  {
    q: "なぜヘッドホンが必要ですか？",
    a: "スピーカーで流すと、マイクが曲の音（原曲の歌手の声も）を拾い、あなたの線に混ざってしまいます。有線のヘッドホンがおすすめです。どうしてもスピーカーを使うときは、ボーカルを0%にして、設定の「エコーキャンセル」を試してください。",
  },
  {
    q: "自分の線がメロディより遅れて描かれます。",
    a: "どの端末でも、音を出すのとマイクで聞くのに少し時間がかかり、Bluetooth のヘッドホンではさらに遅れます。設定の「遅延を測る」（「ピッ」に合わせて「タッ」と声を出す）を使うか、合わせて歌ったときに線がメロディに重なるまでスライダーを動かしてください。",
  },
  {
    q: "グレーの線がないところや、おかしいところがあります。",
    a: "メロディの線は、分離したボーカルから作っています。コーラスやハモリ、ラップやセリフ、息の多い声やひずませた声のところでは、線がずれたり欠けたりすることがあり、伴奏の一部がボーカルに残ることもあります。目安としてお使いください。",
  },
  {
    q: "パーセントは点数ですか？",
    a: "点数ではなく、おおまかな目安です。原曲の歌手が歌っていて、あなたも歌った部分のうち、緑の範囲に入っていた時間の割合です。ズレが大きかったところの一覧や、録音の聴き比べのほうが、多くのことがわかります。",
  },
  {
    q: "録音は保存されますか？",
    a: "「この録音を残す」（曲と一緒にこの端末に保存）、「自分の声だけ保存（WAV）」、「曲と一緒に保存（MP3）」（端末にファイルを保存）を押したときだけです。それ以外は、もう一度歌うかページを閉じると消えます。",
  },
  {
    q: "自分の歌を曲と一緒に保存できますか？",
    a: "できます。歌ったあとの「曲と一緒に保存（MP3）」で、あなたの声と伴奏を 1 つの MP3 ファイルにします。曲が入っているので、自分の練習用だけに使い、動画サイトや SNS への投稿・共有・配布はしないでください。曲の権利は権利者にあります。",
  },
  {
    q: "おすすめキーはどう決めていますか？",
    a: "メロディから低い音と高い音を取り出し（一瞬だけの外れた音を数えないよう、一番低い5%と一番高い5%の時間を除きます）、測った音域の中に一番よく収まる移調量を、−6〜＋6半音と、1オクターブ下・上で歌う場合の中から選びます。",
  },
  {
    q: "スマホでも使えますか？",
    a: "はい、最近のブラウザなら使えます。新しい曲の読み込みはパソコンより時間がかかるので、終わるまで画面をつけたままにしてください。iPhone・iPad では、消音スイッチがオンでも音が出ます。",
  },
  {
    q: "どの AI モデルを使っていますか？",
    a: "Deezer の Spleeter（ボーカルと伴奏の2分割）です。MIT ライセンスで公開されているもので、sherpa-onnx プロジェクトが ONNX 形式に変換したものを使っています。新しいモデルより軽く、スマホでも動きますが、分離は完全ではありません。",
  },
  {
    q: "データを削除するには？",
    a: "⚙ →「保存した曲を削除」で曲と残した録音、⚙ →「AIモデルを削除」でモデル、「マイ音域」→「削除」で音域を削除できます。ブラウザの設定でこのサイトのデータを消すと、すべて削除されます。",
  },
];

const list = (items) => `<dl class="faq">\n${items.map((x) => `  <dt>${x.q}</dt>\n  <dd>${x.a}</dd>`).join("\n")}\n</dl>`;

export default {
  slug: "faq",
  faq: true,
  en: {
    title: "Karaoke Trainer FAQ: Octaves, Headphones, Delay, Offline Use, and Privacy",
    heading: "Frequently asked questions",
    nav: "FAQ",
    description:
      "Answers about Karaoke Trainer: is it free, are your song and voice uploaded, singing an octave lower, what the colours mean, headphones and delay, offline use, the suggested key, and the AI model.",
    faq: EN,
    body: () => `<p class="lead">Short answers to common questions. For step-by-step instructions, see the <a href="../guide/">guide</a>.</p>\n${list(EN)}`,
  },
  ja: {
    title: "Karaoke Trainer のよくある質問：オクターブ・ヘッドホン・遅れ・オフライン・プライバシー",
    heading: "よくある質問",
    nav: "よくある質問",
    description:
      "Karaoke Trainer のよくある質問。無料か、曲や声はアップロードされるか、1オクターブ下で歌うと、線の色の意味、ヘッドホンと遅れ、オフライン、おすすめキー、AI モデルについて。",
    faq: JA,
    body: () => `<p class="lead">よくある質問への短い回答です。詳しい手順は<a href="../guide/">使い方ガイド</a>をご覧ください。</p>\n${list(JA)}`,
  },
};
