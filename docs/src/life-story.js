// A short connected story for NEW lives in the 1900 Japan sample.
// Existing saves without workStory keep their original decisions.
export const newWorkStory = () => ({ version: 1, stage: 'waiting', due: null, approach: null, priority: null });
export function beginWorkStory(run) {
  const s = run.workStory;
  if (!s || s.stage !== 'waiting' || !run.job) return;
  s.stage = 'meeting'; s.due = run.tick + 4;
  run.people.push({ id: 'coworker', name: run.seed % 2 ? '千代' : '清吉', relation: '仕事仲間', birthYear: run.birthYear, trust: 40, alive: true, lastContact: run.tick });
}
const option = (id, name, description, effects = {}) => ({ id, name, description, effects, cost: 0 });
export function workStoryDecision(run) {
  const s = run.workStory;
  if (!s || s.due === null || run.tick < s.due) return null;
  const p = run.people.find(p => p.id === 'coworker');
  if (!p) return null;
  let title, text, options;
  if (s.stage === 'meeting') {
    title = '働く日々に、一人の顔';
    text = p.alive ? `${run.job}を続けるうち、仕事仲間の${p.name}と顔を合わせることが増えた。仕事の合間をどう過ごそう。` : `${p.name}との別れがあった。共に働いた日々を、これからどう心に残そう。`;
    options = [option('help', '教わったことを仕事に活かす', '仕事の経験を育てる。', { knowledge: 4 }), option('talk', '一緒に過ごす時間を大切にする', '仕事以外の話にも耳を傾ける。', { connections: 4 }), option('distance', '自分の時間も大切にする', '無理に距離を縮めず、自分のペースを保つ。', { composure: 4 })];
  } else if (s.stage === 'priority') {
    title = '働き方と、人との時間';
    text = p.alive ? `${p.name}と仕事を重ね、少しずつ任されることも増えた。これから3年間、どんな時間を大切にしよう。` : '共に働いた人の記憶を胸に、これから3年間の暮らし方を考える。';
    options = [option('work', '仕事を多く引き受ける', '3年間、収入と経験が増える。疲れがたまり、人と過ごす余裕は減る。'), option('balance', '仕事と暮らしの釣り合いを取る', '今の収入を保ち、無理のないペースを続ける。'), option('people', '人と過ごす時間を確保する', '3年間、収入は少し減る。休息と交流の余裕が生まれる。')];
  } else if (s.stage === 'reflection') {
    title = 'あの選択から、三年';
    const work = s.priority === 'work' ? '仕事を多く引き受け、収入と経験を積んだ。忙しさと疲れも日々に残った。' : s.priority === 'people' ? '収入の一部を手放し、人と過ごせる時間と休息を守ってきた。' : '仕事と暮らしの釣り合いを取りながら、日々を重ねてきた。';
    const bond = !p.alive ? `${p.name}との時間は、思い出の中に残っている。` : p.trust >= 60 ? `${p.name}とは、仕事以外のことも話せる間柄になった。` : p.trust >= 40 ? `${p.name}とは、互いに挨拶を交わす仲が続いている。` : `${p.name}とは、以前より少し距離ができた。`;
    text = `${work}${bond} 収入だけでは測れない、選んだ暮らしがここにある。`;
    options = [option('continue', 'この日々を、これからの人生へ', '選んだ働き方の期間は終わる。経験と人との関係、思い出は残る。')];
  } else return null;
  return { title, text, options, id: `${run.id}-work-${s.stage}`, age: run.tick / 4, story: 'work', stage: s.stage };
}
export function resolveWorkStory(run, id) {
  const s = run.workStory, p = run.people.find(p => p.id === 'coworker');
  const trust = n => { if (p?.alive) { p.trust = Math.max(0, Math.min(100, p.trust + n)); p.lastContact = run.tick; } };
  if (s.stage === 'meeting') {
    s.approach = id; trust(id === 'talk' ? 14 : id === 'help' ? 7 : 0);
    if (id === 'help') run.experience += .5;
    s.stage = 'priority'; s.due = run.tick + 4;
  } else if (s.stage === 'priority') {
    s.priority = id; s.stage = 'reflection'; s.due = run.tick + 12;
  } else {
    run.memories.push({ tick: run.tick, text: run.pending.text });
    s.stage = 'complete'; s.due = null;
  }
}
export function workStoryLoad(run) {
  if (run.workStory?.stage !== 'reflection') return { income: 1, experience: 0, fatigue: 0, trust: 0 };
  return run.workStory.priority === 'work' ? { income: 1.15, experience: .05, fatigue: 1.2, trust: -.75 } : run.workStory.priority === 'people' ? { income: .9, experience: 0, fatigue: -1, trust: 1 } : { income: 1, experience: 0, fatigue: 0, trust: .25 };
}
export function validWorkStory(run) {
  const s = run.workStory;
  if (s === undefined) return true;
  if (!s || run.worldId !== 'modern' || s.version !== 1 || !['waiting', 'meeting', 'priority', 'reflection', 'complete'].includes(s.stage)) return false;
  if (['waiting', 'complete'].includes(s.stage) ? s.due !== null : !Number.isInteger(s.due) || s.due < 0 || s.due > 452) return false;
  if (![null, 'help', 'talk', 'distance'].includes(s.approach) || ![null, 'work', 'balance', 'people'].includes(s.priority)) return false;
  if (s.stage === 'waiting') return s.approach === null && s.priority === null;
  if (run.people.filter(p => p.id === 'coworker').length !== 1 || !run.job) return false;
  if (s.stage === 'meeting') return s.approach === null && s.priority === null;
  if (s.approach === null) return false;
  return s.stage === 'priority' ? s.priority === null : s.priority !== null;
}
