// How to use the app. Screenshots: node scripts/render-guide-images.mjs
import { MODEL_MB, ENGINE_MB, MAX_MIN, KEEP_SONGS, STRICT } from "./app.mjs";
import { img } from "./shots.mjs";

const FIRST_MB = MODEL_MB + ENGINE_MB.cpu;
const [G, Y] = STRICT.normal;
const strictRows = (names) =>
  ["easy", "normal", "strict"].map((k) => `<tr><th scope="row">${names[k]}</th><td>±${STRICT[k][0]}</td><td>±${STRICT[k][1]}</td></tr>`).join("\n      ");

export default {
  slug: "guide",
  en: {
    title: "How to Use Karaoke Trainer: Sing Along and See Your Pitch Over the Melody",
    heading: "How to use Karaoke Trainer",
    nav: "How to use (guide)",
    description:
      "Step-by-step guide to Karaoke Trainer: load a song file, turn the vocals down, sing and see your pitch over the original melody, read the results, sing the parts that went off again, change the key, and find a key for your vocal range.",
    body: () => `
<p class="lead">Karaoke Trainer shows the original singer's melody as note bars, as on a karaoke machine, and draws your pitch over them while you sing, so you can see where you went flat or sharp. This guide walks through each part of the screen.</p>

<nav class="toc" aria-label="Contents"><b>Contents</b><ol>
  <li><a href="#quick">Start in three steps</a></li>
  <li><a href="#song">Loading a song</a></li>
  <li><a href="#roll">Reading the melody line</a></li>
  <li><a href="#sing">Singing</a></li>
  <li><a href="#results">Looking back: how you sang</a></li>
  <li><a href="#practice">Vocal volume and key</a></li>
  <li><a href="#range">Finding your key (optional)</a></li>
  <li><a href="#settings">Settings: how strict, microphone</a></li>
  <li><a href="#phone">On a phone or tablet</a></li>
  <li><a href="#data">What is kept on your device</a></li>
</ol></nav>

<h2 id="quick">Start in three steps</h2>
<ol>
  <li><b>Load a song.</b> Tap “Choose a song file” and pick a song you have (MP3, WAV, M4A, FLAC…, or a video such as MP4). Wait until the bar is full.</li>
  <li><b>Put on headphones and press “Sing”.</b> The song starts and your pitch is drawn over the grey melody bars.</li>
  <li><b>Press “Stop singing”.</b> See how much was on pitch, and tap a part that went off to sing it again.</li>
</ol>
<p>No song at hand? Press <b>“Try the demo song”</b>: a short song made for this app, which needs no download.</p>

<h2 id="song">Loading a song</h2>
<p>Choose a file, or drop it on the box. Any audio format your browser can play works (MP3, WAV, M4A (AAC), FLAC, Ogg…), up to ${MAX_MIN} minutes. A video file (MP4, MOV, WebM…) works too: only its sound is used, and the picture is not shown or kept. The app then:</p>
<ol>
  <li><b>separates the vocals</b> from the accompaniment with an AI model (Spleeter), and</li>
  <li><b>finds the melody</b> of the separated vocals: the pitch every 10 milliseconds.</li>
</ol>
<p>The bar shows how far it is and about how long is left. On a recent computer a 4-minute song is usually ready in a minute or two; a phone takes longer. Keep the screen on until it finishes.</p>
<p><b>The first time</b>, the browser downloads the AI model (about ${MODEL_MB} MB) and the engine that runs it (about ${ENGINE_MB.cpu} MB, or ${ENGINE_MB.gpu} MB when the GPU is used): about ${FIRST_MB} MB in all, only once. On a phone or tablet the app asks before it starts, so you can wait for Wi-Fi.</p>
<p>Every song you load is kept on this device (the last ${KEEP_SONGS}). Under <b>“Recent songs”</b>, tap one and it opens at once, with no separation and even offline. Choosing the same file again also opens the saved copy.</p>
<div class="note"><p>The app only opens files on your device. It does not take songs from YouTube or streaming services. Use songs you bought or recorded, for your own practice.</p></div>

<h2 id="roll">Reading the melody line</h2>
<figure class="shot">
  ${img("en", "sing", "The practice screen while singing: a piano keyboard on the left with note names, the grey note bars of the demo song, and the singer's line drawn over them: green where it is on pitch, with the bar filled in green, and yellow where it is lower than the note. A black vertical line marks now, and the note being sung shows at the top right.")}
  <figcaption>The demo song while singing. Tap the image to enlarge it.</figcaption>
</figure>
<ul>
  <li><b>Across</b> is time. The black vertical line is <b>now</b>; the song scrolls to the left, so you see the next notes coming.</li>
  <li><b>Up and down</b> is pitch, like a piano keyboard turned on its side (the note names are on the left; C4 is middle C).</li>
  <li><b>The grey bars</b> are the original singer's melody, one bar per note, each on the row of its note. A note you sing on pitch fills with green: each note is judged by the middle (median) of your pitch over it, so vibrato or a short slide into the note does not make it wrong, while a note sung too high or too low does.</li>
  <li><b>Your line</b> is coloured by how close you are to the note: <b>green</b> within ±${G} cents, <b>yellow</b> within ±${Y} cents, <b>red</b> further off. 100 cents is one semitone. The line is coloured moment by moment, so a wide vibrato can show yellow at its peaks while the note's bar is green.</li>
  <li>The note you are singing now, and how far it is from the melody, show at the top right.</li>
</ul>
<ul>
  <li><b>Zoom</b> – pinch the line (on a phone, or on a laptop's trackpad) to see more or fewer seconds at once; with a mouse, Ctrl + wheel. Only the time is zoomed.</li>
  <li><b>Look around</b> – on a computer, scroll with two fingers on the trackpad: sideways moves in time, up and down moves to higher or lower notes (with a mouse, the wheel moves up and down and Shift + wheel moves in time). On a phone, drag the line with one finger: sideways moves in time, up and down moves to higher or lower notes. To scroll the page, swipe outside the line.</li>
  <li>While the song plays, the line follows it again when the playing position comes back to its place, or when you press ▶. Tap the line to jump to that point of the song.</li>
  <li>The thin vertical lines are the <b>beats</b> (quarter notes), found in the accompaniment, so you can see where each note starts against the beat and that the song is playing even in the intro. For a song without a steady beat (free tempo, no drums or rhythm part), lines every few seconds with the time are shown instead. Before the singing starts, the time until it does is shown (“Singing starts in 12 s”).</li>
</ul>

<h2 id="sing">Singing</h2>
<ol>
  <li><b>Put on headphones.</b> With a speaker, the microphone hears the song too, and the original singer's voice gets mixed into your line. Wired headphones are best; Bluetooth headphones add a delay (see “Delay correction” in <a href="#results">Looking back</a>).</li>
  <li><b>Press “Sing”.</b> The first time, the browser asks to use the microphone: allow it. The song starts from where it is.</li>
  <li><b>Sing along.</b> Your line appears as you sing.</li>
  <li><b>Press “Stop singing”</b> (or pause, or let the song end) to see how you sang.</li>
</ol>
<p><b>Octaves:</b> many people sing a song an octave lower or higher than the original singer (a man singing a song by a woman, for example). That counts as on pitch. The app finds your octave in the first seconds you sing and draws your line next to the melody; the menu next to “Sing” shows what it found (“Octave: auto (lower)”), and you can choose the octave yourself.</p>

<h2 id="results">Looking back: how you sang</h2>
<figure class="shot">
  ${img("en", "results", "How you sang: the share of the time on pitch, the average in cents (a minus sign for lower), and a list of the parts that went off, each with its time and how many cents low or high. Below, buttons to compare the original vocal and my voice, to save my singing with the song (MP3) or my voice only (WAV), and to delete my voice, with a note that the MP3 is for personal use only.")}
  <figcaption>After singing the demo song (a take of the demo song is not kept on this device).</figcaption>
</figure>
<ul>
  <li><b>On pitch</b> – the share of the melody you sang on pitch: the notes whose bar turned green, a long note counting more than a short one. It counts only where the original singer sings and you sang, so pauses do not count against you.</li>
  <li><b>Average</b> – whether you tend to be higher (+) or lower (−) than the melody, in cents.</li>
  <li><b>Where it went off</b> – the phrases that were furthest off, with how far and in which direction. <b>Tap one</b> and the song plays from a second before that phrase, so you can sing it again right away.</li>
  <li><b>Listen and compare</b> – while the results are open, a “My voice” slider appears under “Vocal” and “Accompaniment”, so you can set each volume and mute each one. The original vocal starts muted after you sing; turn it on to hear it with your voice. “Play from the start of the take” plays from where you started singing.</li>
  <li><b>Delay correction</b> – every device takes a moment to play the sound and to hear the microphone (Bluetooth headphones much more), and the app subtracts this delay. If your line sits to the right of the grey bars even though you sang in time (your voice sounds behind the accompaniment), make the value larger; if to the left, smaller. Your line, the numbers, what you hear, and the saved files move with it, and your next takes use the new value too. To measure it instead, press <b>“Measure the delay”</b> with your headphones on and say “ta” with each of the 8 beeps.</li>
  <li><b>Your last take is kept</b> on this device with the song, by itself: next time you open the song, press <b>“See the last take”</b> (next to “Sing”) to see the results and listen again. Only the last take of each song is kept: singing again replaces it. <b>Delete my voice</b> deletes it (the song stays).</li>
  <li><b>Save with the song (MP3)</b> saves your voice with the accompaniment as one MP3 file (192 kbps): at the volumes you hear, with the original vocal too when it is on. It covers the part you sang. <b>Save my voice only (WAV)</b> saves just your voice.</li>
</ul>
<div class="note"><p><b>The MP3 is for your personal use only.</b> It contains the song, and the rights to the song belong to its rights holders. Use it to listen back to your own practice, and do not upload it to video or social media sites, send it to others, or distribute it. The app asks you to confirm this each time, and writes it into the file's tag (comment).</p></div>
<p>The numbers are a guide for practice, not a score. The line and the list tell you more: where you go flat at the end of a long note, which jump you overshoot, which phrase starts late.</p>

<h2 id="practice">Vocal volume and key</h2>
<ul>
  <li><b>Vocal</b> – 0% is karaoke (the accompaniment only), 100% is the original. In between, the singer becomes a quiet guide: useful while you are learning a song, then turn it down to 0%.</li>
  <li><b>Accompaniment</b> – the volume of everything else.</li>
  <li><b>Mute</b> – the speaker button next to each slider turns that part off and on again without losing its volume.</li>
  <li><b>Key</b> – − / + moves the whole song down or up a semitone at a time, up to 6, without changing the tempo. The grey bars move with it. It takes a few seconds to prepare.</li>
</ul>

<h2 id="range">Finding your key (optional)</h2>
<p>If a song feels too high or too low, measure your vocal range once (“Measure my range” in the song panel, or ⚙ → “My vocal range”). You do not need it to practice.</p>
<ol>
  <li>Sing the <b>lowest</b> note you can sing comfortably on “ah” and hold it for 4 seconds.</li>
  <li>Then the <b>highest</b> note in your normal voice (not falsetto).</li>
  <li>Optionally, the highest note in <b>falsetto</b>.</li>
</ol>
<p>The range is shown on a keyboard and saved on this device. From then on, each song shows a suggestion next to the key, such as “Suggested for you: −3”. Tap it to use that key. The app compares the melody's range (its low and high notes, leaving out the lowest and highest 5% of the time so a stray note does not count) with your range, and picks the change that fits best; sometimes the best fit is the original key sung an octave lower or higher.</p>

<h2 id="settings">Settings: how strict, microphone</h2>
<p>⚙ → <b>Settings</b>.</p>
<div class="table-wrap">
  <table>
    <thead><tr><th scope="col">How strict</th><th scope="col">Green (cents)</th><th scope="col">Yellow (cents)</th></tr></thead>
    <tbody>
      ${strictRows({ easy: "Easy", normal: "Normal (default)", strict: "Strict" })}
    </tbody>
  </table>
</div>
<p><b>Microphone:</b> noise suppression, echo cancellation, and automatic gain are off by default, because they can cut or change parts of the voice and make the pitch harder to follow. Turn on echo cancellation only if you must use a speaker.</p>

<h2 id="phone">On a phone or tablet</h2>
<p>Everything works on a phone, in one column: after a song is loaded, the screen scrolls to the melody line. Loading a new song takes longer than on a computer; keep the screen on until it is ready. On iPhone and iPad, the sound plays even with the silent switch on. The app can be added to the home screen and then works offline.</p>

<h2 id="data">What is kept on your device</h2>
<p>The AI model, the songs you loaded (the separated vocals and accompaniment and the melody line), your last take of each song, your vocal range if you measured it, and your settings. Nothing is uploaded. Delete them with ⚙ → “Delete saved songs”, ⚙ → “Delete the AI model”, and “Delete” in “My vocal range”. See the <a href="../privacy/">privacy policy</a>.</p>
`,
  },
  ja: {
    title: "Karaoke Trainer の使い方：歌って、原曲のメロディと自分の音程を見比べる",
    heading: "Karaoke Trainer の使い方",
    nav: "使い方ガイド",
    description:
      "Karaoke Trainer の使い方。曲のファイルを読み込み、ボーカルを小さくして、歌うと原曲のメロディに自分の音程が重なって表示されます。答え合わせの見方、ズレたところの歌い直し、キー変更、音域からおすすめキーを出す方法まで。",
    body: () => `
<p class="lead">Karaoke Trainer は、原曲の歌手のメロディをカラオケのような音のバーで表示し、歌っている間あなたの音程をその上に描きます。どこで高すぎたか、低すぎたかが目でわかります。このガイドでは、画面の各部分を順に説明します。</p>

<nav class="toc" aria-label="目次"><b>目次</b><ol>
  <li><a href="#quick">3ステップで始める</a></li>
  <li><a href="#song">曲を読み込む</a></li>
  <li><a href="#roll">メロディの線の見方</a></li>
  <li><a href="#sing">歌う</a></li>
  <li><a href="#results">答え合わせ</a></li>
  <li><a href="#practice">ボーカルの音量とキー</a></li>
  <li><a href="#range">自分に合うキーを探す（任意）</a></li>
  <li><a href="#settings">設定：判定の厳しさ・マイク</a></li>
  <li><a href="#phone">スマホ・タブレットで使う</a></li>
  <li><a href="#data">端末に保存されるもの</a></li>
</ol></nav>

<h2 id="quick">3ステップで始める</h2>
<ol>
  <li><b>曲を読み込む。</b>「曲のファイルを選ぶ」を押して、手持ちの曲（MP3、WAV、M4A、FLAC など。MP4 などの動画も可）を選びます。バーがいっぱいになるまで待ちます。</li>
  <li><b>ヘッドホンをつけて「歌う」を押す。</b>曲が始まり、グレーのメロディのバーの上にあなたの音程が描かれます。</li>
  <li><b>「歌うのをやめる」を押す。</b>音程が合っていた割合を確認し、ズレたところをタップして歌い直します。</li>
</ol>
<p>手元に曲がなければ、<b>「デモ曲で試す」</b>を押してください。このアプリのために作った短い曲で、ダウンロードも不要です。</p>

<h2 id="song">曲を読み込む</h2>
<p>ファイルを選ぶか、枠にドロップします。ブラウザで再生できる形式（MP3、WAV、M4A（AAC）、FLAC、Ogg など）なら使え、${MAX_MIN}分までです。動画のファイル（MP4、MOV、WebM など）も使えます。使うのは音声だけで、映像は表示も保存もしません。読み込むと、アプリは次のことをします。</p>
<ol>
  <li>AI モデル（Spleeter）で、<b>ボーカルと伴奏を分離</b>する</li>
  <li>分離したボーカルから<b>メロディを取り出す</b>（10ミリ秒ごとの音程）</li>
</ol>
<p>バーに進み具合と残り時間の目安が出ます。最近のパソコンなら4分の曲でたいてい1〜2分、スマホではもっとかかります。終わるまで画面をつけたままにしてください。</p>
<p><b>初回</b>は、ブラウザが AI モデル（約${MODEL_MB}MB）と、それを動かすエンジン（約${ENGINE_MB.cpu}MB、GPU を使う場合は約${ENGINE_MB.gpu}MB）、合わせて約${FIRST_MB}MBを一度だけダウンロードします。スマホやタブレットでは始める前に確認するので、Wi-Fi になるまで待つこともできます。</p>
<p>読み込んだ曲はこの端末に保存されます（最近の${KEEP_SONGS}曲まで）。<b>「最近の曲」</b>からタップすると、分離なしで、オフラインでもすぐに開けます。同じファイルをもう一度選んだときも、保存したものを開きます。</p>
<div class="note"><p>このアプリが開けるのは端末にあるファイルだけです。YouTube やストリーミングサービスから曲を取り込む機能はありません。購入した曲や自分で録音した曲を、自分の練習に使ってください。</p></div>

<h2 id="roll">メロディの線の見方</h2>
<figure class="shot">
  ${img("ja", "sing", "歌っているときの練習画面。左に音名つきの鍵盤、デモ曲のグレーのメロディのバー、その上に歌った線が、合っているところは緑（バーも緑に塗られる）、バーの音より低いところは黄で描かれている。黒い縦線が現在の位置で、右上に歌っている音が出ている。")}
  <figcaption>デモ曲を歌っているところ。画像をタップすると拡大します。</figcaption>
</figure>
<ul>
  <li><b>横</b>は時間です。黒い縦線が<b>いま</b>で、曲は左へ流れていくので、次の音が右から近づいてきます。</li>
  <li><b>縦</b>は音の高さで、ピアノの鍵盤を横に倒した形です（左に音名。C4 が真ん中のド）。</li>
  <li><b>グレーのバー</b>が原曲の歌手のメロディです。1つの音に1本で、その音の段に置かれます。音程が合っていると、バーが緑に塗られます。音ごとに、その間のあなたの音程の真ん中（中央値）で判定するので、ビブラートや音の入りのしゃくりでは外れにならず、音全体が高すぎたり低すぎたりすると外れになります。</li>
  <li><b>あなたの線</b>は、バーの音との近さで色が変わります。<b>緑</b>は±${G}セント以内、<b>黄</b>は±${Y}セント以内、<b>赤</b>はそれより外れ。100セントが半音です。線は瞬間ごとの色なので、深いビブラートでは揺れの山が黄になっても、その音のバーは緑になることがあります。</li>
  <li>いま歌っている音と、メロディとのズレが右上に出ます。</li>
</ul>
<ul>
  <li><b>拡大・縮小</b> ― 線をピンチすると（スマホや、ノートパソコンのトラックパッドで）、一度に見える秒数が変わります。マウスでは Ctrl＋ホイール。時間の方向だけが伸び縮みします。</li>
  <li><b>前後・上下を見る</b> ― パソコンではトラックパッドの2本指のスクロールで、横に動かすと時間、縦に動かすと音の高さの方向に動きます（マウスはホイールで上下、Shift＋ホイールで時間）。スマホでは線を1本指でドラッグします。横に動かすと時間、縦に動かすと音の高さの方向に動きます。ページをスクロールするときは線の外をスワイプします。</li>
  <li>再生中は、再生位置が元の場所まで来るか ▶ を押すと、また曲について動きます。線をタップすると、曲のその位置に移ります。</li>
  <li>細い縦線は伴奏から見つけた<b>拍</b>（4分音符）です。音が拍のどこで始まるかがわかり、前奏でも再生中かどうかがわかります。テンポが自由に揺れる曲や、ドラムなどのリズムがない曲では、代わりに数秒ごとの縦線と時刻が出ます。歌い出しの前には、歌い出しまでの秒数（「歌い出しまで 12秒」）が出ます。</li>
</ul>

<h2 id="sing">歌う</h2>
<ol>
  <li><b>ヘッドホンをつけます。</b>スピーカーだとマイクが曲の音も拾い、原曲の歌手の声があなたの線に混ざります。有線のヘッドホンがおすすめです。Bluetooth のヘッドホンでは遅れが出ます（<a href="#results">答え合わせ</a>の「遅延の補正」で合わせられます）。</li>
  <li><b>「歌う」を押します。</b>初回はブラウザがマイクの使用を確認するので、許可してください。曲がいまの位置から始まります。</li>
  <li><b>一緒に歌います。</b>歌うとあなたの線が描かれます。</li>
  <li><b>「歌うのをやめる」を押す</b>（一時停止する、曲が終わる、でも同じ）と答え合わせが出ます。</li>
</ol>
<p><b>オクターブについて：</b>原曲の歌手より1オクターブ低く（または高く）歌うことはよくあります（男性が女性の曲を歌う場合など）。これは正解として判定します。歌いはじめの数秒であなたのオクターブを判定し、メロディの隣に線を描きます。「歌う」の横のメニューに判定結果（「オクターブ：自動（1つ下）」など）が出て、自分で選ぶこともできます。</p>

<h2 id="results">答え合わせ</h2>
<figure class="shot">
  ${img("ja", "results", "答え合わせの画面。音程が合っていた割合、平均のズレ（セント。低めはマイナス）、ズレが大きかったところの一覧（時間と、何セント低いか高いか）。下に、原曲のボーカルと自分の声の聴き比べと、曲と一緒に保存（MP3）・自分の声だけ保存（WAV）・自分の声を削除のボタン、MP3 は個人の練習用だけという注意書き。")}
  <figcaption>デモ曲を歌ったあと（デモ曲の録音は端末に残りません）。</figcaption>
</figure>
<ul>
  <li><b>音程が合っていた</b> ― メロディのうち、音程が合っていた（バーが緑になった）音の割合です。長い音ほど大きく数えます。原曲の歌手が歌っていて、あなたも歌った部分だけで数えるので、休んだところは減点になりません。</li>
  <li><b>平均</b> ― メロディより高め（＋）か低め（−）かの傾向（セント）。</li>
  <li><b>ズレが大きかったところ</b> ― 一番ズレたフレーズと、どれだけ・どちらにズレたか。<b>タップすると</b>、そのフレーズの1秒前から曲が流れるので、すぐに歌い直せます。</li>
  <li><b>聴き比べ</b> ― 答え合わせを開いている間は「ボーカル」「伴奏」の下に「自分の声」のスライダーが出て、それぞれの音量とミュートを別々に変えられます。歌い終わった直後は原曲のボーカルがミュートです。オンにすると自分の声と重ねて聴けます。「録音の最初から再生」で、歌いはじめた位置から再生します。</li>
  <li><b>遅延の補正</b> ― どの端末でも、音を出すのとマイクで聞くのに少し時間がかかり（Bluetooth のヘッドホンではずっと長くなります）、アプリはこの遅れを差し引いて線を描きます。合わせて歌ったのに線がグレーのバーより右にある（声が伴奏より遅れて聞こえる）ときは値を大きく、左にあるときは小さくします。線・数字・聞こえる音・保存するファイルが一緒に動き、次に歌うときもこの値を使います。<b>「遅延を測る」</b>を押し、ヘッドホンをつけて8回の「ピッ」に合わせて「タッ」と声を出せば、測って合わせることもできます。</li>
  <li><b>直前の録音は自動で残ります</b>（曲と一緒にこの端末に保存）。次にその曲を開いたら、「歌う」の横の<b>「前の録音を見る」</b>で、答え合わせを見たり聴き直したりできます。残るのは各曲の直前の1回分だけで、もう一度歌うと置き換わります。<b>自分の声を削除</b>で消せます（曲は残ります）。</li>
  <li><b>曲と一緒に保存（MP3）</b>で、あなたの声と伴奏を 1 つの MP3 ファイル（192 kbps）にします。聞こえている音量のままで、原曲のボーカルをオンにしているときはそれも入ります。保存するのは歌った範囲です。<b>自分の声だけ保存（WAV）</b>は、あなたの声だけを保存します。</li>
</ul>
<div class="note"><p><b>MP3 は個人の練習用にだけ使ってください。</b>曲が入っていて、曲の権利は権利者にあります。自分の練習を聴き返すためだけに使い、動画サイトや SNS への投稿、ほかの人に送ること、配布はしないでください。保存のたびに確認が出て、ファイルのタグ（コメント）にも書き込まれます。</p></div>
<p>数字は練習の目安で、点数ではありません。線と一覧のほうが多くを教えてくれます。伸ばした音の終わりで下がる、跳ぶ音で行き過ぎる、歌い出しが遅れる、といったクセが見えてきます。</p>

<h2 id="practice">ボーカルの音量とキー</h2>
<ul>
  <li><b>ボーカル</b> ― 0%でカラオケ（伴奏だけ）、100%で原曲どおり。間にすると歌手の声が小さなガイドになります。覚えるまではガイドを残し、慣れたら0%に。</li>
  <li><b>伴奏</b> ― ボーカル以外の音量。</li>
  <li><b>ミュート</b> ― 各スライダーの横のスピーカーのボタンで、音量を変えずにそのパートを消したり戻したりできます。</li>
  <li><b>キー</b> ― − / ＋ で、テンポを変えずに曲全体を半音ずつ、最大6半音まで上げ下げします。グレーのバーも一緒に動きます。準備に数秒かかります。</li>
</ul>

<h2 id="range">自分に合うキーを探す（任意）</h2>
<p>高すぎる・低すぎると感じる曲があれば、一度だけ音域を測っておきましょう（曲の欄の「音域を測って…」か、⚙ →「マイ音域」）。練習に必須ではありません。</p>
<ol>
  <li>楽に出せる<b>一番低い声</b>を「あー」で4秒伸ばします。</li>
  <li>次に、地声（裏声ではない声）で出せる<b>一番高い声</b>。</li>
  <li>任意で、<b>裏声</b>の一番高い声。</li>
</ol>
<p>音域は鍵盤の上に表示され、この端末に保存されます。以後、曲ごとにキーの横に「あなたへのおすすめ：−3」のような表示が出て、タップするとそのキーになります。メロディの音域（一瞬だけの外れた音を数えないよう、一番低い5%と一番高い5%の時間を除いた低い音と高い音）とあなたの音域を比べ、一番よく収まる移調量を選びます。原曲キーのまま1オクターブ下（上）で歌うのが一番合う、という結果になることもあります。</p>

<h2 id="settings">設定：判定の厳しさ・マイク</h2>
<p>⚙ →<b>「設定」</b>です。</p>
<div class="table-wrap">
  <table>
    <thead><tr><th scope="col">判定の厳しさ</th><th scope="col">緑（セント）</th><th scope="col">黄（セント）</th></tr></thead>
    <tbody>
      ${strictRows({ easy: "やさしい", normal: "ふつう（最初の設定）", strict: "きびしい" })}
    </tbody>
  </table>
</div>
<p><b>マイク：</b>ノイズ抑制・エコーキャンセル・自動音量調整は、最初はオフです。声の一部を消したり変えたりして、音程を追いにくくすることがあるためです。どうしてもスピーカーを使うときだけ、エコーキャンセルをオンにしてください。</p>

<h2 id="phone">スマホ・タブレットで使う</h2>
<p>スマホでもすべての機能が1列の画面で使えます。曲を読み込むと、メロディの線のところまで画面が動きます。新しい曲の読み込みはパソコンより時間がかかるので、終わるまで画面をつけたままにしてください。iPhone・iPad では、消音スイッチがオンでも音が出ます。ホーム画面に追加すると、オフラインでも使えます。</p>

<h2 id="data">端末に保存されるもの</h2>
<p>AI モデル、読み込んだ曲（分離したボーカルと伴奏、メロディの線）、各曲の直前の録音、測った場合はマイ音域、設定です。どれもアップロードしません。⚙ →「保存した曲を削除」、⚙ →「AIモデルを削除」、「マイ音域」の「削除」で消せます。<a href="../privacy/">プライバシーポリシー</a>もご覧ください。</p>
`,
  },
};
