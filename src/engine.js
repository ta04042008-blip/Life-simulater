import { ACTIONS, DATA_VERSION, FOCUSES, MILESTONES, STATS, WORLDS, decisionFor, focusOptions, worldOf } from './data.js';

export const SAVE_VERSION = 1;
export const MAX_AGE = 110; // Prototype safety bound, not a historical longevity claim.
export const clone = value => structuredClone(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export function random(run) {
  let x = run.rng >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  run.rng = x >>> 0;
  return run.rng / 4294967296;
}
export function log(run, text, category = '暮らし', icon = '✧') {
  run.log.push({ id: `${run.id}-l${run.nextId++}`, tick: run.tick, age: Math.floor(run.tick / 4), year: run.birthYear + Math.floor(run.tick / 4), text, category, icon });
}
function effects(run, values) {
  for (const [key, amount] of Object.entries(values || {})) if (Object.hasOwn(run.stats, key)) run.stats[key] = clamp(run.stats[key] + amount, 0, 300);
}
export function createRun(seed, worldId) {
  seed = (Number(seed) >>> 0) || 1;
  const run = { version: SAVE_VERSION, dataVersion: DATA_VERSION, id: `life-${seed}`, seed, rng: seed, tick: 0, nextId: 1,
    worldId: worldId || WORLDS[seed % WORLDS.length].id, birthYear: 0, name: '', stats: { health: 245, fitness: 16, composure: 190, knowledge: 8, connections: 170, happiness: 195 },
    money: 25, focus: 'balance', focusTime: Object.fromEntries(FOCUSES.map(f => [f.id, 0])), job: null, experience: 0, role: '一人前を目指して', incomeFactor: 1, reduced: false,
    education: '暮らしの中で成長中', hobby: null, fatigue: 0, housing: '家族と暮らす住まい', food: '食事は足りている', people: [], actions: [], log: [], history: [], ledger: [], memories: [], completedMilestones: [], pending: null, dead: false, death: null };
  const world = worldOf(run);
  if (!world) throw new Error('Unknown world');
  run.birthYear = world.year;
  run.name = world.names[Math.floor(random(run) * world.names.length)];
  run.people = [{ id: 'carer', name: '養育者', relation: '家族', birthYear: world.year - 28, trust: 65, alive: true, lastContact: 0 }, { id: 'sibling', name: 'きょうだい', relation: '家族', birthYear: world.year - 3, trust: 58, alive: true, lastContact: 0 }];
  log(run, `${world.region}。${world.family}に、一人の子が生まれた。`, '誕生', '❧');
  run.history.push({ age: 0, stats: { ...run.stats }, money: run.money });
  return run;
}
export function setFocus(run, id) {
  if (run.dead || run.pending) return { ok: false, reason: '決断が終わってから変更できます。' };
  if (!focusOptions(run).some(f => f.id === id)) return { ok: false, reason: '今の暮らしでは選べません。' };
  if (run.focus !== id) { run.focus = id; log(run, `生活方針を「${FOCUSES.find(f => f.id === id).name}」にした。`, '方針', '◈'); }
  return { ok: true };
}
export function actionAvailability(run, id) {
  const action = ACTIONS.find(a => a.id === id);
  if (!action) return '行動が見つかりません。';
  if (run.dead) return 'この人生は終了しました。';
  if (run.pending) return 'いまの決断を終えてから始められます。';
  if (run.tick / 4 < action.minAge) return `${action.minAge}歳から始められます。`;
  if (run.actions.some(a => a.type === id)) return '同じ行動が進行中です。';
  if (run.actions.length >= 2) return '同時に進められる行動は2件までです（試作上の制約）。';
  if (run.money < action.cost) return '使える資金が足りません。';
  return '';
}
export function startAction(run, id, personId) {
  const reason = actionAvailability(run, id);
  if (reason) return { ok: false, reason };
  if (personId && !run.people.some(p => p.id === personId && p.alive)) return { ok: false, reason: '交流する相手が見つかりません。' };
  const definition = ACTIONS.find(a => a.id === id);
  run.money -= definition.cost;
  run.ledger.push({ tick: run.tick, amount: -definition.cost, text: `${definition.name}・開始費` });
  run.actions.push({ id: `${run.id}-a${run.nextId++}`, type: id, started: run.tick, due: run.tick + definition.duration, personId: personId || null });
  log(run, `${definition.name}。結果まで${definition.duration * 3}か月。`, definition.group, definition.icon);
  return { ok: true };
}
function finishActions(run) {
  const due = run.actions.filter(a => a.due <= run.tick);
  run.actions = run.actions.filter(a => a.due > run.tick);
  for (const action of due) {
    const def = ACTIONS.find(a => a.id === action.type);
    if (action.personId && !run.people.some(p => p.id === action.personId && p.alive)) { log(run, '相手の事情が変わり、予定していた交流は見送った。開始時の費用は戻らない。', '交流'); continue; }
    effects(run, def.effect);
    let text = '';
    if (action.type === 'apply') {
      if (random(run) < .62 + Math.min(run.experience / 150, .2)) {
        run.job = worldOf(run).occupation; run.incomeFactor = Math.max(run.incomeFactor, 1.15);
        text = '仕事の機会が見つかった。経験を活かして、新しい役割を始める。';
      } else text = '今回は仕事の縁につながらなかった。今の暮らしは続き、また機会を探せる。';
    } else if (action.type === 'visit') {
      const person = run.people.find(p => p.id === action.personId && p.alive) || run.people.find(p => p.alive);
      if (person) { person.trust = clamp(person.trust + 7, 0, 100); person.lastContact = run.tick; text = `${person.name}と話す時間を持った。小さな近況を分かち合った。`; }
      else text = '地域の人と話す時間を持った。';
    } else if (action.type === 'rest') { run.fatigue = Math.max(0, run.fatigue - 25); text = '暮らしの負担を見直し、休める時間ができた。'; }
    else if (action.type === 'craft') { run.hobby = 'ものづくり'; run.memories.push({ tick: run.tick, text: '自分の手でつくった小さな作品' }); text = '小さな作品ができあがった。手を動かした時間が思い出になった。'; }
    else { run.education = '自発的な学習を経験'; text = '続けてきた学びが一区切りついた。知ることの楽しさを感じた。'; }
    log(run, text, def.group, def.icon);
  }
}
export function resolveDecision(run, optionId, decisionId) {
  if (run.dead || !run.pending || run.pending.id !== decisionId) return { ok: false, reason: 'この決断はすでに処理されています。' };
  const option = run.pending.options.find(o => o.id === optionId);
  if (!option) return { ok: false, reason: '選択肢が見つかりません。' };
  if (run.money < option.cost) return { ok: false, reason: '使える資金が足りません。ほかの道を選べます。' };
  run.money -= option.cost;
  if (option.cost) run.ledger.push({ tick: run.tick, amount: -option.cost, text: option.name });
  effects(run, option.effects);
  for (const key of ['job', 'education', 'hobby', 'focus']) if (option[key]) run[key] = option[key];
  if (option.promotion) { run.role = '経験を活かす担い手'; run.incomeFactor += .2; }
  if (option.reduced) { run.reduced = true; run.incomeFactor *= .65; run.role = '自分のペースで'; }
  if (option.partner) {
    run.people.push({ id: 'partner', name: '大切な人', relation: '共に暮らす相手', birthYear: run.birthYear + 1, trust: 72, alive: true, lastContact: run.tick });
    run.housing = '大切な人と暮らす住まい';
  }
  log(run, option.name + '。' + option.description, '決断', '◇');
  run.pending = null;
  return { ok: true };
}
function annual(run) {
  const age = run.tick / 4;
  if (age >= 10 && !run.people.some(p => p.id === 'friend')) {
    run.people.push({ id: 'friend', name: '昔からの友人', relation: '友人', birthYear: run.birthYear, trust: 60, alive: true, lastContact: run.tick });
    log(run, '身近に、気の合う友人ができた。', '人物', '♧');
  }
  for (const person of run.people) {
    const personAge = run.birthYear + age - person.birthYear;
    if (person.alive && personAge > 65 && random(run) < Math.min(.01 * Math.exp((personAge - 65) / 15), .65)) {
      person.alive = false; effects(run, { happiness: -12, composure: -10 });
      log(run, `${person.name}との別れがあった。過ごした日々の記録は残っている。`, '別れ', '❧');
    }
  }
  if (random(run) < .58) {
    const daily = run.focus === 'family' ? ['身近な人と食事を囲んだ。', { happiness: 3 }] : run.focus === 'learn' ? ['分からなかったことが、少し分かるようになった。', { knowledge: 2 }] : run.focus === 'rest' ? ['穏やかな時間を過ごし、心身を休めた。', { composure: 3 }] : ['いつもの暮らしの中に、小さな喜びがあった。', { happiness: 2 }];
    effects(run, daily[1]); log(run, daily[0], '日常', '❧');
  }
  if (age >= 18 && random(run) < .12) { effects(run, { health: -8, composure: -3 }); log(run, '体調を崩し、しばらく無理をせずに過ごした。', '健康', '♥'); }
  const p = age <= 1 ? .008 : age < 6 ? .002 : age < 40 ? .001 : .002 * Math.exp((age - 40) / 11);
  const healthFactor = clamp(1.3 - run.stats.health / 400, .55, 1.3);
  if (age >= MAX_AGE || random(run) < clamp(p * worldOf(run).lifeRisk * healthFactor, 0, .95)) {
    run.dead = true; run.pending = null;
    run.death = { age, year: run.birthYear + age, text: 'この場所で生きた、一人の人生が静かに幕を閉じた。' };
    log(run, run.death.text, '人生の終わり', '❧');
    return;
  }
  if (MILESTONES.includes(age) && !run.completedMilestones.includes(age)) {
    run.completedMilestones.push(age);
    run.pending = { ...decisionFor(age, run), id: `${run.id}-d${age}`, age };
  }
}
export function step(run) {
  if (run.dead || run.pending) return false;
  const age = run.tick / 4;
  const focus = FOCUSES.find(f => f.id === run.focus);
  const world = worldOf(run);
  const actionLoad = run.actions.length * .12;
  const available = clamp((run.job && !run.reduced ? .72 : 1) - actionLoad - run.fatigue / 300, .15, 1);
  run.focusTime[run.focus] += .25;
  effects(run, Object.fromEntries(Object.entries(focus.gain).map(([k, v]) => [k, v * .25 * available * (v > 0 ? 1 - run.stats[k] / 450 : 1)])));
  effects(run, { knowledge: age < 18 ? 1.05 : .12, fitness: age < 18 ? 1.6 : age > 50 ? -.55 : -.05, health: age > 45 ? -.3 : .12 });
  // Exponential quarter-step convergence does not multiply annual gains by UI ticks.
  for (const [key, target] of [['happiness', 180], ['composure', 180]]) run.stats[key] = clamp(target + (run.stats[key] - target) * Math.pow(.94, .25), 0, 300);
  run.fatigue = clamp(run.fatigue + (run.focus === 'work' ? 2 : run.focus === 'rest' ? -3 : -.4), 0, 100);
  if (run.job) run.experience += .25 * (run.focus === 'work' ? 1.2 : 1) * (run.reduced ? .65 : 1);
  if (run.focus === 'family' || run.focus === 'social') {
    const candidates = run.people.filter(p => p.alive && (run.focus !== 'family' || p.relation !== '友人'));
    if (candidates.length) candidates[run.tick % candidates.length].trust = clamp(candidates[run.tick % candidates.length].trust + .5 * available, 0, 100);
  }
  if (run.job) {
    const gross = world.income * run.incomeFactor * (1 + Math.min(run.experience, 35) * .008) / 4;
    const normal = world.baseCost * (run.people.some(p => p.id === 'partner' && p.alive) ? 1.18 : 1) / 4;
    const net = gross - normal;
    run.money += net;
    run.ledger.push({ tick: run.tick + 1, amount: net, text: '通常生活の負担を含む生計の増減' });
  }
  run.food = run.money < 0 ? '生活の備えが心もとない' : '食事は足りている';
  if (run.money < 0) effects(run, { composure: -.5 });
  run.tick++;
  finishActions(run);
  if (run.tick % 4 === 0) {
    annual(run);
    run.history.push({ age: run.tick / 4, stats: { ...run.stats }, money: run.money });
  }
  return true;
}
export function nextDecision(run) {
  let steps = 0;
  while (!run.pending && !run.dead && steps < MAX_AGE * 4 + 1) { step(run); steps++; }
  return steps;
}
export function relationship(person) { return !person.alive ? '思い出の中に' : person.trust >= 70 ? 'とても親しい' : person.trust >= 45 ? '良好' : person.trust >= 25 ? '少し距離がある' : 'ぎくしゃくしている'; }
export function snapshot(run) { return JSON.stringify({ version: SAVE_VERSION, run }); }
export function restore(value) {
  let data;
  try { data = JSON.parse(value); } catch { throw new Error('保存データを読み取れません。'); }
  const r = data?.run;
  const finite = n => typeof n === 'number' && Number.isFinite(n);
  if (data?.version !== SAVE_VERSION || r?.version !== SAVE_VERSION || r?.dataVersion !== DATA_VERSION) throw new Error('対応していない保存データです。元データは上書きしません。');
  if (!worldOf(r) || !finite(r.tick) || r.tick < 0 || r.tick > MAX_AGE * 4 || !Number.isInteger(r.tick) || !Number.isInteger(r.rng) || r.rng < 1 || r.rng > 0xffffffff || !finite(r.money) || !finite(r.experience) || !finite(r.incomeFactor) || !finite(r.fatigue) || !FOCUSES.some(f => f.id === r.focus)) throw new Error('保存データの形式に問題があります。');
  if (r.birthYear !== worldOf(r).year || typeof r.name !== 'string' || typeof r.id !== 'string' || typeof r.dead !== 'boolean' || !finite(r.nextId)) throw new Error('基本情報を確認できません。');
  if (!STATS.every(s => finite(r.stats?.[s.id]) && r.stats[s.id] >= 0 && r.stats[s.id] <= 300) || !FOCUSES.every(f => finite(r.focusTime?.[f.id]) && r.focusTime[f.id] >= 0)) throw new Error('状態の値を確認できません。');
  if (!['people', 'actions', 'log', 'history', 'ledger', 'memories', 'completedMilestones'].every(k => Array.isArray(r[k]))) throw new Error('履歴を確認できません。');
  if (r.log.length > 5000 || r.history.length > 112 || r.actions.length > 2 || r.people.length > 100 || r.ledger.length > 3000 || r.memories.length > 1000) throw new Error('保存データの件数が対応範囲を超えています。');
  if (r.log.some(e => !e || typeof e.id !== 'string' || typeof e.text !== 'string' || typeof e.category !== 'string' || typeof e.icon !== 'string' || !finite(e.tick) || !finite(e.age) || !finite(e.year)) || r.history.some(h => !h || !finite(h.age) || !finite(h.money) || !STATS.every(s => finite(h.stats?.[s.id]))) || r.ledger.some(l => !l || !finite(l.tick) || !finite(l.amount) || typeof l.text !== 'string') || r.memories.some(m => !m || !finite(m.tick) || typeof m.text !== 'string')) throw new Error('履歴の形式を確認できません。');
  if (r.actions.some(a => !ACTIONS.some(d => d.id === a.type) || !finite(a.due) || a.due <= r.tick) || r.people.some(p => typeof p.id !== 'string' || typeof p.name !== 'string' || !finite(p.trust) || !finite(p.birthYear) || typeof p.alive !== 'boolean')) throw new Error('進行中の情報を確認できません。');
  if (r.pending && (r.dead || !Array.isArray(r.pending.options) || !r.pending.options.length || typeof r.pending.id !== 'string' || r.pending.options.some(o => typeof o.id !== 'string' || typeof o.name !== 'string' || !finite(o.cost) || o.cost < 0 || !o.effects || Object.values(o.effects).some(n => !finite(n))))) throw new Error('決断の情報を確認できません。');
  if (r.pending) {
    const expected = { ...decisionFor(r.pending.age, r), id: `${r.id}-d${r.pending.age}`, age: r.pending.age };
    if (!MILESTONES.includes(r.pending.age) || r.pending.age !== r.tick / 4 || JSON.stringify(expected) !== JSON.stringify(r.pending)) throw new Error('決断がこの版の内容と一致しません。');
  }
  if (typeof r.housing !== 'string' || typeof r.education !== 'string' || typeof r.role !== 'string' || typeof r.food !== 'string' || (r.job !== null && typeof r.job !== 'string') || (r.hobby !== null && typeof r.hobby !== 'string') || r.completedMilestones.some(n => !MILESTONES.includes(n))) throw new Error('生活情報の形式を確認できません。');
  if (r.dead && !r.death) throw new Error('終了情報を確認できません。');
  return r;
}
export function summary(run) {
  const focus = Object.entries(run.focusTime).sort((a, b) => b[1] - a[1])[0];
  return { id: run.id, name: run.name, age: Math.floor(run.tick / 4), year: run.birthYear, region: worldOf(run).region, focus: FOCUSES.find(f => f.id === focus[0]).name, memories: run.memories.length, job: run.job || '家族と暮らした日々' };
}
