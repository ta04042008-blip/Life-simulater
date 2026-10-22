// All coefficients, places, careers and dates below are prototype fixtures.
// They are NOT historical statistics, calibrated mortality tables, or birth weights.
export const TITLE = '2000年の地球上の誰か1人。';
export const DATA_VERSION = 'prototype-2026-10-15';
export const STATS = [
  { id: 'health', name: '健康', icon: '♥', color: '#dc7770', description: '現在の身体の調子。病気や生活の負担とは別に経過を管理します。' },
  { id: 'fitness', name: '体力', icon: '◆', color: '#cf9959', description: '長期的な活動能力。疲労は別に記録します。' },
  { id: 'composure', name: '心のゆとり', icon: '❧', color: '#6c9e86', description: 'いまの精神的な余裕。休息と支援が助けになります。' },
  { id: 'knowledge', name: '知識', icon: '▤', color: '#729eb4', description: '学びの基盤。職業の経験や取得した修了歴とは別のものです。' },
  { id: 'connections', name: '人間関係', icon: '♧', color: '#ab87a4', description: '周囲とのつながりの全体像。相手ごとの関係とは別です。' },
  { id: 'happiness', name: '幸福', icon: '☼', color: '#d6b55c', description: '現在の暮らしへの満足。富や長寿だけで決まりません。' },
];
export const WORLDS = [
  { id: 'river', year: 100, region: '大河沿いの集落', era: '農耕の暮らし', family: '畑を耕す家庭', occupation: '農作業', palette: 'earth', names: ['リオ', 'ナラ', 'アリ'], income: 95, baseCost: 64, lifeRisk: 1.5 },
  { id: 'trade', year: 950, region: '内陸の交易の町', era: '手仕事と交易', family: '手仕事で暮らす家庭', occupation: '手仕事', palette: 'sand', names: ['サミ', 'ライラ', 'ヌリ'], income: 110, baseCost: 74, lifeRisk: 1.45 },
  { id: 'village', year: 1450, region: '東アジアの農村', era: '田畑と共同体', family: '田畑を守る家庭', occupation: '農作業', palette: 'green', names: ['ハル', 'ユウ', 'レン'], income: 100, baseCost: 67, lifeRisk: 1.4 },
  { id: 'workshop', year: 1750, region: '沿岸の手工業の町', era: '工房のある暮らし', family: '工房を営む家庭', occupation: '工房の仕事', palette: 'brick', names: ['アレク', 'ミラ', 'ルカ'], income: 135, baseCost: 93, lifeRisk: 1.2 },
  { id: 'industrial', year: 1880, region: '北西ヨーロッパの都市', era: '街と工場', family: '働き手を支え合う家庭', occupation: '工場の仕事', palette: 'brick', names: ['エリス', 'ノア', 'エマ'], income: 155, baseCost: 105, lifeRisk: 1.05 },
  { id: 'modern', year: 1900, region: '日本の町', era: '変わりゆく町の暮らし', family: '町で生計を立てる家庭', occupation: '町の仕事', palette: 'green', names: ['はると', 'あおい', 'なつ'], income: 180, baseCost: 120, lifeRisk: .85 },
];
export const FOCUSES = [
  { id: 'balance', name: 'バランス', icon: '◈', text: '暮らし全体を大切にする', gain: { health: 1, knowledge: 1.5, composure: 1, happiness: 1 } },
  { id: 'work', name: '仕事', icon: '⚒', text: '仕事と熟練に力を注ぐ', gain: { knowledge: 1, composure: -2, fitness: -.5 } },
  { id: 'learn', name: '学び', icon: '▤', text: '新しい知識を身につける', gain: { knowledge: 5, composure: -.5, happiness: 1 } },
  { id: 'social', name: '交流', icon: '♧', text: '人とのつながりを育む', gain: { connections: 4, happiness: 2 } },
  { id: 'family', name: '家族', icon: '⌂', text: '身近な人との時間を大切にする', gain: { connections: 2, happiness: 3, composure: 1 } },
  { id: 'hobby', name: '趣味', icon: '♫', text: '好きなことを続ける', gain: { happiness: 4, composure: 2, knowledge: 1 } },
  { id: 'rest', name: '休養・健康', icon: '❧', text: '無理をせず、心身を整える', gain: { health: 3, fitness: 2, composure: 4 } },
];
export const ACTIONS = [
  { id: 'study', name: '学びの準備を始める', icon: '▤', duration: 4, cost: 15, minAge: 6, text: '1年かけて学ぶ。知識が育ちやすくなる。', effect: { knowledge: 12 }, group: '学び' },
  { id: 'apply', name: '仕事の機会を探す', icon: '⚒', duration: 2, cost: 8, minAge: 16, text: '半年後に返事。経験が活きるが、見つからないこともある。', group: '仕事' },
  { id: 'visit', name: '親しい人と過ごす', icon: '♧', duration: 1, cost: 3, minAge: 6, text: '3か月のあいだに交流。相手との関係と気持ちを育む。', effect: { connections: 7, happiness: 5 }, group: '交流' },
  { id: 'rest', name: '暮らしの負担を整える', icon: '❧', duration: 2, cost: 5, minAge: 6, text: '半年間、休息を優先。疲労を減らす。', effect: { health: 5, composure: 10 }, group: '暮らし' },
  { id: 'craft', name: '小さな作品をつくる', icon: '✧', duration: 3, cost: 10, minAge: 10, text: '9か月かけて楽しむ。作品が思い出に残る。', effect: { happiness: 9, knowledge: 3 }, group: '趣味' },
];
export const MILESTONES = [6, 12, 16, 18, 25, 35, 50, 65, 80];
export function worldOf(run) { return WORLDS.find(w => w.id === run.worldId); }
export function focusOptions(run) { return FOCUSES.filter(f => f.id !== 'work' || Boolean(run.job)); }
export function decisionFor(age, run) {
  const world = worldOf(run);
  const option = (id, name, description, effects, extra = {}) => ({ id, name, description, effects, cost: 0, ...extra });
  switch (age) {
    case 6: return { title: '世界が少し、広くなる', text: '身近な大人や周囲の人から、暮らしのことを学ぶ年頃になった。', options: [option('learn', '教わる時間を大切にする', '知識が育ちやすい。身近な人との学びを続ける。', { knowledge: 10 }, { education: '身近な人から学習中' }), option('play', '遊びや手伝いから学ぶ', '体力とつながりが育つ。学びの形は一つではない。', { fitness: 8, connections: 7 }, { education: '暮らしの中で学習中' })] };
    case 12: return { title: '得意なことを探して', text: '少しずつ、自分の好きなことが見えてきた。', options: [option('craft', '手を動かしてみる', '趣味への関心が育つ。すぐに収入になるとは限らない。', { happiness: 9, knowledge: 6 }, { hobby: 'ものづくり' }), option('people', '人と過ごす時間を増やす', 'つながりが育つ。自分だけの時間は少し減る。', { connections: 12, happiness: 4 }), option('read', '学びを深める', '知識が育つ。機会と時間が必要になる。', { knowledge: 15 }, { education: '基礎の学びを修了' })] };
    case 16: return { title: 'これからの生計', text: '暮らしを支えるため、自分の進む道を考える。', options: [option('work', `${world.occupation}を始める`, '収入と経験を得る。仕事の時間と負担が増える。', { knowledge: 4 }, { job: world.occupation }), option('training', '教わりながら働く', '収入は控えめ。学びと仕事を両立する。', { knowledge: 10 }, { job: '見習い', education: '仕事を通じて学習中' })] };
    case 18: return { title: '自分の暮らし方', text: 'どんな毎日を大切にしていこう。生活方針は後から変えられる。', options: [option('steady', '安定した日々をつくる', '心のゆとりを大切にする。', { composure: 10 }, { focus: 'balance' }), option('ambition', '仕事の腕を磨く', '経験が育ちやすい。休息との両立が必要。', { knowledge: 5 }, { focus: 'work' }), option('bond', '人との時間を大切にする', 'つながりを育てる。', { connections: 10 }, { focus: 'social' })] };
    case 25: return { title: '大切な人とのこれから', text: '親しくなった相手と、これからの暮らしについて話す機会があった。', options: [option('together', '共に暮らす道を選ぶ', '新しい家族と支え合う。共同生活の負担も生まれる。', { happiness: 12, connections: 8 }, { cost: 30, partner: true }), option('apart', '今の暮らしを続ける', '自分の生活を大切にする。親しい関係は残る。', { composure: 6, happiness: 4 })] };
    case 35: return { title: '積み重ねた経験', text: 'これまでの経験を、次の暮らしにどう活かそう。', options: [option('skill', 'さらに腕を磨く', '熟練が進む。仕事の負担には気をつけたい。', { knowledge: 10, composure: -5 }, { promotion: true }), option('time', '身近な人との時間を増やす', '関係と幸福を大切にする。収入の急な増加はない。', { connections: 10, happiness: 10 }, { focus: 'family' })] };
    case 50: return { title: '暮らしを見つめ直す', text: '長く続けてきたことと、これから大切にしたいことを考える。', options: [option('continue', '続けてきたことを深める', '経験を活かし、日々の手応えを得る。', { knowledge: 8, happiness: 8 }), option('new', '好きなことを始める', '新しい楽しみ。費用と時間がかかる。', { happiness: 15, composure: 6 }, { cost: 20, hobby: '身近な自然を楽しむ' })] };
    case 65: return { title: 'これからのペースで', text: '働き方や人との関わりを、自分の体調に合わせて考える。', options: [option('slow', '仕事の負担を軽くする', '収入は減るが、休息の時間が増える。', { composure: 15, health: 6 }, { reduced: true, focus: 'rest' }), option('carry', '無理のない範囲で続ける', '経験を活かし、今の役割を続ける。', { happiness: 8, connections: 6 })] };
    default: return { title: '誰かと分かち合う時間', text: '積み重ねた思い出や経験を、身近な人に話す。', options: [option('share', '思い出を語る', '人とのつながりを感じる。', { connections: 10, happiness: 12 }), option('quiet', '静かな時間を楽しむ', '自分のペースで心を整える。', { composure: 15, happiness: 8 })] };
  }
}
