import { ACTIONS, DATA_VERSION, FOCUSES, STATS, TITLE, WORLDS, focusOptions, worldOf } from './data.js';
import { actionAvailability, createRun, nextDecision, relationship, resolveDecision, restore, setFocus, snapshot, startAction, step, summary } from './engine.js';
import { drawScene } from './scene.js';
import { HAIRS, TOPS, BOTTOMS, characterLayers, layerClip, normalizeAppearance, preloadCharacters } from './characters.js';

const KEY = 'earth2000.run.v1', META = 'earth2000.history.v1';
const APPEARANCE_KEY = 'earth2000.appearance.v1';
let appearance = normalizeAppearance(null);
try { appearance = normalizeAppearance(JSON.parse(localStorage.getItem(APPEARANCE_KEY) || 'null')); } catch { /* Bad display settings never replace the current life. */ }
const root = document.querySelector('#app');
let run = null, screen = 'title', panel = null, playing = false, speed = 1, returnToPlay = false, tucked = false, storageError = '', lastTime = 0, progress = 0, selectedWorld = 'modern', previousFocus = null;
let history = [];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = n => Math.round(n).toLocaleString('ja-JP');
try {
  const stored = localStorage.getItem(KEY);
  if (stored) run = restore(stored);
  const h = JSON.parse(localStorage.getItem(META) || '[]');
  if (Array.isArray(h)) history = h.filter(x => x && typeof x.id === 'string' && Number.isFinite(x.age)).slice(-20);
} catch (e) { storageError = e.message || '保存データにアクセスできません。'; }
function toast(message) { const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 4500); }
function save() {
  if (!run) return;
  try { localStorage.setItem(KEY, snapshot(run)); }
  catch { if (!save.warned) { toast('端末への保存ができません。設定からデータを書き出してください。'); save.warned = true; } }
}
function archive() {
  if (!run?.dead || history.some(h => h.id === run.id)) return;
  history.push(summary(run)); history = history.slice(-20);
  try { localStorage.setItem(META, JSON.stringify(history)); } catch { toast('人生記録を保存できません。書き出しをご利用ください。'); }
}
function seed() { return crypto.getRandomValues(new Uint32Array(1))[0] || 1; }
function birth() { run = createRun(seed(), selectedWorld || undefined); storageError = ''; save.warned = false; screen = 'game'; panel = 'birth'; playing = false; returnToPlay = false; tucked = false; progress = 0; save(); render(); }
function openPanel(name, detail = '') { previousFocus = document.activeElement; returnToPlay = playing; playing = false; panel = name; panelDetail = detail; tucked = false; progress = 0; render(); }
let panelDetail = '';
function closePanel() { panel = null; playing = returnToPlay && !run?.pending && !run?.dead; returnToPlay = false; render(); if (previousFocus?.isConnected) previousFocus.focus(); else document.querySelector('[data-action="menu"]')?.focus(); }
function titleMarkup() {
  return `<main class="title-screen"><div class="title-top"><span>A LIFE, SOMEWHERE ON EARTH</span><span>試作 0.2</span></div><p class="title-kicker">名もない人生に、物語がある。</p><h1><span class="number">2000</span>年の<br>地球上の誰か1人。</h1><p class="title-subtitle">生まれる場所も、時代も、選べない。<br>それでも、あなたにしかない日々がある。</p><div class="scene-frame title-scene"><div class="scene-scroll"><canvas id="scene" role="img" aria-label="家と暮らしを描いた横長のピクセル風景"></canvas></div><span class="scene-caption">時代を越えて、暮らしの中へ</span></div><div class="title-actions">${run ? `<button class="big-button" data-action="continue">${run.dead ? 'この人生を振り返る' : 'つづきの人生へ'}　→</button>` : ''}<label class="field-label" for="world">試作の出生サンプル</label><select id="world" class="select-field"><option value="">いずれかのサンプルに生まれる</option>${WORLDS.map(w => `<option value="${w.id}" ${selectedWorld === w.id ? 'selected' : ''}>${w.year}年 · ${esc(w.region)}</option>`).join('')}</select><button class="big-button ${run ? 'secondary' : ''}" data-action="new">新しい人生をはじめる　↗</button><button class="big-button secondary" data-action="menu" data-panel="past">これまでの人生</button><button class="big-button secondary" data-action="menu" data-panel="appearance">キャラクター素材を見る</button><button class="text-button" data-action="menu" data-panel="settings" style="display:block;margin:18px auto">設定・保存データ・この試作について</button>${storageError ? `<p class="notice">${esc(storageError)}<br>新しく始めるまで保存済みデータは上書きしません。</p>` : ''}<p class="title-note">1900年の日本では、就職から出会い・働き方・3年後の変化をたどれます。<br>6つの地域・年代サンプルを収録した試作版。<br>出生抽選はサンプル間の簡易抽選です。<br>歴史・人口・所得・死亡率は未較正の仮設定です。</p></div></main>`;
}
function logMarkup(entries) { return entries.map(e => `<div class="event"><span class="event-icon" aria-hidden="true">${esc(e.icon)}</span><span class="event-age">${e.age}歳</span><div class="event-text">${esc(e.text)}</div></div>`).join(''); }
function homeMarkup() {
  const world = worldOf(run), age = Math.floor(run.tick / 4), focus = FOCUSES.find(f => f.id === run.focus);
  return `<main class="app-shell"><header class="masthead"><div class="brand"><b>2000</b>年の地球上の誰か1人。</div><button class="edition" data-action="menu" data-panel="settings">試作版 · 設定</button></header><section class="profile"><div><p class="eyebrow">ひとつの人生、つづく日々。</p><h1>${esc(run.name)}<span>${age}歳</span></h1><p class="location">⌖ ${esc(world.region)}<br>${esc(run.job || (age < 6 ? '家族に見守られて成長中' : age < 16 ? '暮らしの中で学ぶ日々' : 'これからの生計を考える'))}</p></div><div class="year-badge"><small>西暦</small>${run.birthYear + age}</div></section><div class="scene-frame"><div class="scene-scroll"><canvas id="scene" role="img" aria-label="${esc(run.housing)}を表した、左右に閲覧できるピクセル風景"></canvas></div><span class="scene-caption">${esc(run.housing)}</span></div><p class="scene-hint">←　左右にスワイプして暮らしを見る　→</p><div class="content">${run.dead ? `<div class="ended-badge">この人生は幕を閉じました。<br><button class="text-button" data-action="menu" data-panel="ending">人生を振り返る →</button></div>` : ''}${run.pending ? `<div class="pending-notice"><span>◇ 大切な決断が待っています</span><button class="small-button" data-action="decision">決断に戻る</button></div>` : ''}<div class="section-heading"><h2>❧ 今のようす</h2><small>項目を押すと詳細</small></div><div class="card"><div class="stats">${STATS.map(s => `<button class="stat" data-action="stat" data-id="${s.id}" aria-label="${s.name} ${Math.round(run.stats[s.id])} / 300、詳細を開く"><div class="stat-top"><span class="stat-label"><span class="stat-icon" style="color:${s.color}">${s.icon}</span>${s.name}</span><strong class="stat-value">${Math.round(run.stats[s.id])}<small> /300</small></strong></div><div class="bar"><span style="width:${run.stats[s.id] / 3}%;background:${s.color}"></span></div></button>`).join('')}</div><button class="funds-button" data-action="menu" data-panel="finance"><span class="funds"><span>◉ 使える資金</span><strong>${fmt(run.money)}<small>生活点 →</small></strong></span></button></div><div class="section-heading"><h2>◈ 現在の生活方針</h2><small>変更するまで継続</small></div><div class="card focus-card"><span class="focus-icon">${focus.icon}</span><div class="focus-copy"><h3>${focus.name}</h3><p>${focus.text}</p></div><button class="small-button" data-action="menu" data-panel="focus" ${run.dead || run.pending ? 'disabled' : ''}>変更</button></div>${run.actions.length ? `<div class="section-heading"><h2>◷ 進行中のこと</h2></div><div class="card events">${run.actions.map(a => `<div class="event"><span class="event-icon">◷</span><span class="event-age">あと</span><div class="event-text">${esc(ACTIONS.find(d => d.id === a.type).name)}<br><strong>${(a.due - run.tick) * 3}か月</strong></div></div>`).join('')}</div>` : ''}<div class="section-heading"><h2>▤ 最近の出来事</h2><button class="text-button" data-action="menu" data-panel="records">すべての記録 →</button></div><div class="card events">${logMarkup(run.log.slice(-3).reverse())}</div><p class="prototype-note">※ 地域・年代は体験用のサンプルです。実際の歴史・統計を再現するものではありません。「生活点」は時代間比較のための仮単位で、通貨や実収入ではありません。</p></div><footer class="footer"><div class="progress-label"><span>${run.dead ? '人生の記録' : run.pending ? '決断を待っています' : playing ? '暮らしが進んでいます' : '時間は止まっています'}</span><span>${age}歳 ${run.tick % 4 * 3}か月</span></div><div class="year-track"><span style="width:${run.tick % 4 * 25}%"></span></div><div class="controls"><button class="control primary" data-action="play" ${run.dead || run.pending ? 'disabled' : ''}>${playing ? 'Ⅱ 一時停止' : '▶ 再生'}</button><button class="control" data-action="speed" ${run.dead ? 'disabled' : ''}>速度 ×${speed}</button><button class="control" data-action="skip" ${run.dead ? 'disabled' : ''}>${run.pending ? '◇ 決断に戻る' : '▷ 次の決断まで'}</button></div><nav class="tabs" aria-label="生活メニュー">${[['actions', '⚒', '行動'], ['people', '♧', '人物'], ['finance', '⌂', '家計'], ['records', '▤', '記録']].map(([id, icon, name]) => `<button class="tab" data-action="menu" data-panel="${id}"><span aria-hidden="true">${icon}</span>${name}</button>`).join('')}</nav></footer></main>`;
}
function panelBody() {
  const world = run ? worldOf(run) : null;
  if (panel === 'appearance') {
    const preview = (v, small = false) => `<div class="avatar-stack ${small ? 'small' : ''}" aria-hidden="true">${characterLayers(v).map(l => `<img src="${l.url}" alt="" width="24" height="32" draggable="false" style="clip-path:${layerClip(l)}">`).join('')}</div>`;
    const choices = (defs, kind) => `<div class="appearance-grid">${defs.map(d => `<button class="appearance-choice ${appearance[kind] === d.id ? 'selected' : ''}" data-action="appearance" data-kind="${kind}" data-id="${d.id}" aria-pressed="${appearance[kind] === d.id}">${preview({ ...appearance, [kind]: d.id }, true)}<span>${d.label}</span></button>`).join('')}</div>`;
    return { title: 'キャラクター素材', body: `<p class="sheet-intro">髪型・上着・ズボンをそれぞれ選べます。腰の境界をそろえた元画像を、色やドットを変えずに重ねています。</p><div class="avatar-stage"><div role="img" aria-label="選択中の髪型・上着・ズボンを組み合わせたキャラクター">${preview(appearance)}</div><p>24 × 32 px · あなたのキャラクター</p></div><h3 class="appearance-heading">髪型</h3>${choices(HAIRS, 'hair')}<h3 class="appearance-heading">上着</h3>${choices(TOPS, 'top')}<h3 class="appearance-heading">ズボン</h3>${choices(BOTTOMS, 'bottom')}<p class="notice">近現代用の素材サンプルです。ゲーム内では1850年以降・16歳以上の主人公に適用します。古い時代・子ども・周囲の人物は仮表示です。組み合わせは端末内に保存し、進行中の人生にも反映します。元画像はそのまま保管し、表示時だけ上半分と下半分を使い分けます。</p>` };
  }
  if (panel === 'birth') return { title: 'あなたの人生が、はじまる。', body: `<p class="end-quote">${run.birthYear}年、${esc(world.region)}。<br>名前は、${esc(run.name)}。</p><div class="summary-grid"><div>生まれた場所<strong>${esc(world.region)}</strong></div><div>家庭の暮らし<strong>${esc(world.family)}</strong></div></div><p class="sheet-intro">${run.workStory ? '働き始めると、仕事仲間との出会いが待っています。選んだ働き方が、その後3年間の収入・疲れ・関係につながります。<br>' : ''}まだ知らない日々が、この先にある。生活方針を選び、大切な場面で立ち止まりながら、一人の人生を見届けましょう。</p><p class="notice">この試作は歴史・統計の仮モデルです。乳幼児期も含め、人生が早く終わる場合があります。出生サンプルは史実の国や人物を再現しません。</p><button class="big-button" data-action="begin">日々をはじめる　→</button>` };
  if (panel === 'decision' && run.pending) return { title: run.pending.title, body: `<p class="eyebrow" style="margin-top:16px">${run.pending.age}歳 · 時間は止まっています</p><p class="sheet-intro">${esc(run.pending.text)}</p><div class="choice-list">${run.pending.options.map(o => `<button class="choice" data-action="choose" data-id="${o.id}" data-decision="${run.pending.id}" ${run.money < o.cost ? 'disabled' : ''}><strong>${esc(o.name)}</strong><p>${esc(o.description)}</p><small>確定時の費用：${o.cost ? o.cost + '生活点' : 'なし'}${run.money < o.cost ? ' · 資金が足りません' : ''}</small></button>`).join('')}</div><p class="sheet-intro">×でたたんで、人物や家計を確認できます。選ぶまで時間は進みません。</p>` };
  if (panel === 'focus') return { title: '暮らしで大切にすること', body: `<p class="sheet-intro">重点は一つ。変更するまで続きます。実際に使える時間に応じて効果が変わり、変更前の期間には遡りません。</p><div class="choice-list">${focusOptions(run).map(f => `<button class="choice ${run.focus === f.id ? 'selected' : ''}" data-action="focus" data-id="${f.id}"><strong>${f.icon} ${f.name}${run.focus === f.id ? ' · 選択中' : ''}</strong><p>${f.text}</p></button>`).join('')}</div>` };
  if (panel === 'actions') return { title: '自分から、はじめる', body: `<p class="sheet-intro">準備や交流は、日々の時間の中で進みます。費用は開始時に一度だけ支払います。この試作では同時に2件まで進められ、途中取消はできません。</p>${ACTIONS.map(a => { const why = actionAvailability(run, a.id); return `<article class="row-card"><h3>${a.icon} ${a.name}</h3><p>${a.text}</p><span class="tag">${a.duration * 3}か月</span><span class="tag">開始費 ${a.cost}生活点</span><span class="tag">${a.minAge}歳から</span><br><button class="small-button" data-action="start" data-id="${a.id}" ${why ? 'disabled' : ''}>${esc(why || 'この行動を始める')}</button></article>`; }).join('')}` };
  if (panel === 'people') return { title: 'あなたを囲む人たち', body: `<p class="sheet-intro">人間関係の全体値とは別に、一人ひとりとの関係を記録します。別れた人との思い出も残ります。</p>${run.people.map(p => `<article class="row-card"><h3>♧ ${esc(p.name)} <span class="tag">${esc(p.relation)}</span></h3><p>${p.alive ? `${run.birthYear + Math.floor(run.tick / 4) - p.birthYear}歳 · ${relationship(p)}` : 'この人生の記録に残る人'}</p>${p.alive && !run.dead ? `<button class="small-button" data-action="visit" data-id="${esc(p.id)}" ${actionAvailability(run, 'visit') ? 'disabled' : ''}>一緒に過ごす · 3か月 / 3生活点</button>` : ''}</article>`).join('')}` };
  if (panel === 'finance') {
    const yearStart = Math.floor(run.tick / 4) * 4;
    const current = run.ledger.filter(l => l.tick > yearStart || (l.tick === yearStart && !l.text.includes('通常生活')));
    const total = current.reduce((n, l) => n + l.amount, 0);
    return { title: '家計と、暮らしの土台', body: `<div class="summary-grid"><div>使える資金<strong>${fmt(run.money)} 生活点</strong></div><div>今年ここまでの増減<strong>${total >= 0 ? '+' : ''}${fmt(total)}</strong></div></div><article class="row-card"><h3>⌂ ${esc(run.housing)}</h3><p>${esc(run.food)}。${run.job ? '自分の仕事が暮らしを支えています。' : '家庭の支援で日々を過ごしています。'}</p></article><article class="row-card"><h3>仕事と経験</h3><p>${esc(run.job || 'まだ就労していません')} · 経験 ${run.experience.toFixed(1)}年<br>${esc(run.role)}${run.reduced ? ' · 負担を軽減中' : ''}</p>${run.workStory?.stage === 'reflection' ? `<p>これからの働き方：${({ work: '仕事を多く引き受ける', balance: '仕事と暮らしの釣り合い', people: '人と過ごす時間を確保' })[run.workStory.priority]}<br>振り返りまで、あと${Math.max(0, run.workStory.due - run.tick) * 3}か月</p>` : ''}</article><div class="section-heading"><h2>最近の資金の動き</h2></div>${run.ledger.length ? run.ledger.slice(-12).reverse().map(l => `<div class="ledger-row"><span>${Math.floor(l.tick / 4)}歳 · ${esc(l.text)}</span><strong class="${l.amount >= 0 ? 'positive' : 'negative'}">${l.amount >= 0 ? '+' : ''}${fmt(l.amount)}</strong></div>`).join('') : '<p class="empty">本人の資金の動きは、まだありません。</p>'}<p class="notice">生活点は仮の比較単位です。通常生活の負担は生計の増減に含まれており、ここで再度差し引きません。住宅・投資・相続・自給の詳細は未実装です。残高が負なら資金不足として表示します。</p>` };
  }
  if (panel === 'records') return { title: '積み重なる日々', body: `<p class="sheet-intro">${run.birthYear}年からの記録。${esc(run.education)}。${run.hobby ? `趣味は${esc(run.hobby)}。` : ''}</p><canvas id="chart" class="chart" role="img" aria-label="6項目の年齢ごとの推移。現在値はホームで確認できます。"></canvas><div class="events">${logMarkup([...run.log].reverse())}</div>` };
  if (panel === 'stat') {
    const s = STATS.find(x => x.id === panelDetail), f = FOCUSES.find(x => x.id === run.focus);
    return { title: `${s.name} · ${Math.round(run.stats[s.id])} / 300`, body: `<p class="sheet-intro">${s.description}</p><article class="row-card"><h3>いまの生活</h3><p>生活方針：${f.name}<br>疲労：${run.fatigue < 30 ? '大きな負担はたまっていない' : run.fatigue < 65 ? '少し疲れがたまっている' : '休息が必要な状態'}<br>${esc(run.food)}<br>進行中の行動：${run.actions.length}件</p></article><p class="notice">値はゲーム内の尺度です。医学的な評価や、異なる時代・文化の優劣を示すものではありません。</p>` };
  }
  if (panel === 'ending') {
    const s = summary(run);
    return { title: 'ここに、一人の人生があった。', body: `<p class="end-quote">${esc(run.name)}の、${s.age}年。<br>誰かと過ごし、日々を重ねた。</p><p class="sheet-intro">${esc(run.death?.text || '')} 長さや豊かさだけで、この人生の価値は決まりません。</p><div class="summary-grid"><div>生きた場所<strong>${esc(s.region)}</strong></div><div>生きた年代<strong>${run.birthYear} — ${run.death?.year}</strong></div><div>大切にした方針<strong>${esc(s.focus)}</strong></div><div>生計・役割<strong>${esc(s.job)}</strong></div></div><canvas id="chart" class="chart" role="img" aria-label="この人生の6項目の推移"></canvas>${run.memories.length ? `<p class="sheet-intro">残った思い出：${run.memories.map(m => esc(m.text)).join('、')}</p>` : ''}<button class="big-button" data-action="menu" data-panel="records">この人生の記録を読む</button><button class="big-button secondary" data-action="title">タイトルへ戻る</button>` };
  }
  if (panel === 'past') return { title: 'これまでの人生', body: history.length ? [...history].reverse().map(h => `<article class="row-card"><h3>${esc(h.name)} · ${h.age}年の人生</h3><p>${h.year}年生まれ · ${esc(h.region)}<br>大切にしたこと：${esc(h.focus)}<br>${esc(h.job)}</p></article>`).join('') : '<p class="empty">まだ記録はありません。終えた人生の要約が、ここに残ります。</p>' };
  if (panel === 'confirm-new') return { title: '新しい人生をはじめますか？', body: `<p class="sheet-intro">${run && !run.dead ? '進行中の人生は、新しい人生で置き換わります。先に書き出して保管できます。' : storageError ? '読み取れなかった保存データが、新しいデータで置き換わります。' : '前の人生の要約は記録に残ります。'}</p>${run ? '<button class="big-button secondary" data-action="export">先に保存データを書き出す</button>' : ''}<button class="big-button" data-action="birth">新しい人生をはじめる</button><button class="big-button secondary" data-action="close">今は戻る</button>` };
  return { title: '設定と、この試作について', body: `<p class="sheet-intro">${TITLE}<br>試作 v0.2 · ${DATA_VERSION}</p><div class="notice">実装済み：6項目、生活方針、期間付き行動、決断、人物、簡易家計、人生終了、保存・再開。<br><br>未実装：2000年間・全地球の網羅、史実イベント、人口に沿った抽選、正確な死亡率・所得、自給経済の詳細、才能・性格・才能の芽。<br><br>人物・年代・生計・死亡率は仮設定です。最長110歳は試作の終了保証であり、現実の寿命上限ではありません。</div><button class="big-button secondary" data-action="menu" data-panel="appearance">キャラクター素材・見た目の変更</button><button class="big-button secondary" data-action="export" ${run ? '' : 'disabled'}>進行中の人生を書き出す（JSON）</button><label class="file-label">保存データを読み込む<input id="import-file" type="file" accept="application/json,.json"></label><p class="sheet-intro">読み込み前に確認します。端末内保存のため、ブラウザのデータ削除や端末変更で記録が失われます。書き出しには現在の人生が含まれ、通算記録は含まれません。</p><details><summary>操作のヒント</summary><p>再生で日々が進み、大切な決断で止まります。「次の決断まで」は結果を変えずに待ち時間を省略します。詳細画面を開いている間や、アプリを離れている間は進みません。<br>生活方針は変更まで継続。選択中の方針以外の生活も続きます。6歳から学びや交流などを自分で始められます。</p></details>${screen === 'game' ? '<button class="big-button secondary" data-action="title">保存してタイトルへ</button>' : ''}` };
}
function drawChart() {
  const el = document.querySelector('#chart'); if (!el || !run) return;
  el.width = 800; el.height = 210;
  const c = el.getContext('2d'); c.fillStyle = '#f2efdf'; c.fillRect(0, 0, 800, 210);
  c.strokeStyle = '#dedfca';
  [35, 85, 135, 185].forEach(y => { c.beginPath(); c.moveTo(28, y); c.lineTo(780, y); c.stroke(); });
  for (const s of STATS) { c.strokeStyle = s.color; c.lineWidth = 3; c.beginPath(); run.history.forEach((h, i) => { const x = 28 + h.age / Math.max(run.tick / 4, 1) * 750, y = 185 - h.stats[s.id] / 300 * 160; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); }
}
function render() {
  const oldScroll = document.querySelector('.scene-scroll')?.scrollLeft;
  root.innerHTML = (screen === 'title' ? titleMarkup() : homeMarkup()) + '<div id="sheet-root"></div>';
  const w = run ? worldOf(run) : WORLDS[2]; drawScene(document.querySelector('#scene'), screen === 'game' ? run : null, w, appearance);
  const scroller = document.querySelector('.scene-scroll'); if (scroller) scroller.scrollLeft = oldScroll ?? 190;
  if (panel) {
    const p = panelBody();
    document.querySelector('#sheet-root').innerHTML = `<div class="overlay"><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="panel-title" tabindex="-1"><div class="sheet-header"><h2 id="panel-title">${esc(p.title)}</h2><button class="close" aria-label="${panel === 'decision' ? '決断をたたむ' : '閉じる'}" data-action="close">×</button></div>${p.body}</section></div>`;
    document.querySelector('main')?.setAttribute('inert', '');
    document.querySelector('.sheet')?.focus({ preventScroll: true }); drawChart();
  }
  document.body.classList.toggle('modal-open', Boolean(panel));
}
function afterStep() {
  save();
  if (run.dead) { playing = false; archive(); panel = 'ending'; }
  else if (run.pending) { playing = false; returnToPlay = false; panel = 'decision'; }
  render();
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
  const a = button.dataset.action, id = button.dataset.id;
  if (a === 'appearance') {
    if (!['hair', 'top', 'bottom'].includes(button.dataset.kind)) return;
    appearance = normalizeAppearance({ ...appearance, [button.dataset.kind]: id });
    try { localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance)); } catch { toast('見た目を保存できません。今回の表示には反映しました。'); }
    const y = document.querySelector('.sheet')?.scrollTop || 0;
    render();
    if (document.querySelector('.sheet')) document.querySelector('.sheet').scrollTop = y;
    document.querySelector(`[data-action="appearance"][data-id="${id}"]`)?.focus({ preventScroll: true });
  }
  if (a === 'new') { if (run || storageError) openPanel('confirm-new'); else birth(); }
  if (a === 'birth') birth();
  if (a === 'continue') { screen = 'game'; playing = false; panel = run.dead ? 'ending' : run.pending ? 'decision' : null; render(); }
  if (a === 'begin') { panel = null; playing = true; progress = 0; render(); }
  if (a === 'play') { if (!run.dead && !run.pending) { playing = !playing; progress = 0; render(); } }
  if (a === 'speed') { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; render(); }
  if (a === 'skip') { playing = false; if (run.pending) { panel = 'decision'; render(); } else { nextDecision(run); afterStep(); } }
  if (a === 'menu') { if (panel) { panel = button.dataset.panel; render(); } else openPanel(button.dataset.panel); }
  if (a === 'stat') openPanel('stat', id);
  if (a === 'close') {
    if (panel === 'decision') { tucked = true; panel = null; playing = false; render(); }
    else closePanel();
  }
  if (a === 'decision') { panel = 'decision'; playing = false; render(); }
  if (a === 'focus') { const result = setFocus(run, id); if (result.ok) { save(); closePanel(); } else toast(result.reason); }
  if (a === 'start' || a === 'visit') { const result = startAction(run, a === 'visit' ? 'visit' : id, a === 'visit' ? id : null); if (result.ok) { save(); render(); toast('始めました。時間を進めると結果が届きます。'); } else toast(result.reason); }
  if (a === 'choose') {
    const result = resolveDecision(run, id, button.dataset.decision);
    if (result.ok) { panel = null; tucked = false; playing = false; save(); render(); toast('選んだ道を、これからの日々へ。再生で続けられます。'); }
    else toast(result.reason);
  }
  if (a === 'title') { playing = false; panel = null; returnToPlay = false; screen = 'title'; save(); render(); window.scrollTo(0, 0); }
  if (a === 'export' && run) {
    const blob = new Blob([snapshot(run)], { type: 'application/json' }), url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = `earth2000-${run.seed}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('現在の人生を書き出しました。');
  }
});
document.addEventListener('change', async event => {
  if (event.target.id === 'world') selectedWorld = event.target.value;
  if (event.target.id === 'import-file') {
    const file = event.target.files[0]; if (!file) return;
    if (file.size > 4_000_000) { toast('読み込めるのは4MB以内の保存データです。'); return; }
    try {
      const imported = restore(await file.text());
      if (!window.confirm('現在の人生を、読み込んだ人生で置き換えます。よろしいですか？')) return;
      run = imported; playing = false; returnToPlay = false; storageError = ''; screen = 'game'; panel = run.dead ? 'ending' : run.pending ? 'decision' : null;
      save(); if (run.dead) archive(); render(); toast('保存した時点から再開できます。');
    } catch (e) { toast(e.message || '読み込めませんでした。現在の人生は変更していません。'); }
  }
});
document.addEventListener('keydown', event => {
  if (!panel) return;
  if (event.key === 'Escape') { event.preventDefault(); document.querySelector('.close')?.click(); }
  if (event.key === 'Tab') {
    const nodes = [...document.querySelector('.sheet').querySelectorAll('button:not(:disabled),input,select,a[href],summary')].filter(el => !el.closest('details:not([open])') || el.tagName === 'SUMMARY');
    if (!nodes.length) return;
    const i = nodes.indexOf(document.activeElement);
    if (event.shiftKey && i <= 0) { event.preventDefault(); nodes.at(-1).focus(); }
    else if (!event.shiftKey && (i < 0 || i === nodes.length - 1)) { event.preventDefault(); nodes[0].focus(); }
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { playing = false; returnToPlay = false; progress = 0; save(); } else { lastTime = performance.now(); render(); } });
window.addEventListener('pagehide', save);
function frame(now) {
  const delta = Math.min(now - (lastTime || now), 200); lastTime = now;
  if (playing && run && !run.dead && !run.pending && !panel && !document.hidden) {
    progress += delta * speed;
    if (progress >= 1000) { progress -= 1000; step(run); afterStep(); }
  }
  requestAnimationFrame(frame);
}
render(); requestAnimationFrame(frame);
if (typeof Image !== 'undefined') preloadCharacters().then(ok => {
  // Redraw only the current canvas: do not reset focus, scrolling or the open panel.
  drawScene(document.querySelector('#scene'), screen === 'game' ? run : null, run ? worldOf(run) : WORLDS[2], appearance);
  if (!ok) toast('一部の素材を読み込めませんでした。ゲーム内は仮表示を続けます。');
});
