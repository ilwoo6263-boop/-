const frequencies = [
  {id:'reunion',icon:'💕',title:'재회',category:'REUNION',hz:528,minutes:11,seconds:11,desc:'마음을 가라앉히고 원하는 만남의 장면을 천천히 상상해보세요.',glow:'#b99aff'},
  {id:'money',icon:'💰',title:'재물',category:'ABUNDANCE',hz:888,minutes:8,seconds:8,desc:'풍요로운 미래를 구체적으로 떠올리며 집중해보세요.',glow:'#e8c86b'},
  {id:'love',icon:'❤️',title:'사랑',category:'LOVE',hz:639,minutes:6,seconds:39,desc:'따뜻하고 건강한 관계에 대한 이미지를 마음속에 그려보세요.',glow:'#ff8fba'},
  {id:'luck',icon:'🍀',title:'행운',category:'LUCK',hz:777,minutes:7,seconds:7,desc:'오늘 원하는 기회를 떠올리고 긍정적인 감각에 집중합니다.',glow:'#79e6a0'},
  {id:'focus',icon:'🧠',title:'집중',category:'FOCUS',hz:40,minutes:15,seconds:0,desc:'주변의 방해를 내려놓고 지금 해야 할 한 가지에 집중합니다.',glow:'#78d7ff'},
  {id:'dino',icon:'🦖',title:'티라노사우르스',category:'T-REX',hz:999,minutes:3,seconds:33,desc:'상상력을 위한 유쾌한 인터넷 밈 스타일의 주파수입니다.',glow:'#a7ff79'}
];

const $ = id => document.getElementById(id);
const grid = $('frequencyGrid');
let selected = frequencies[0];
let audioCtx = null, oscillators = [], gain = null, timerId = null, remaining = 0, total = 0, playing = false;

function renderCards(){
  grid.innerHTML = frequencies.map(f => `
    <button class="freq-card" data-id="${f.id}" style="--card-glow:${f.glow}">
      <span class="freq-icon">${f.icon}</span><span class="hz">${f.hz} Hz</span>
      <h3>${f.title}</h3><p>${f.desc}</p>
    </button>`).join('');
  grid.querySelectorAll('.freq-card').forEach(card => card.addEventListener('click',()=>selectFrequency(card.dataset.id)));
}

function selectFrequency(id){
  selected = frequencies.find(f=>f.id===id) || frequencies[0];
  stopAudio();
  $('playerSection').classList.remove('hidden');
  $('playerCategory').textContent = selected.category;
  $('playerTitle').textContent = selected.title;
  $('playerDescription').textContent = selected.desc;
  $('playerFrequency').textContent = selected.hz;
  $('orbitCore').textContent = selected.hz;
  total = remaining = selected.minutes*60 + selected.seconds;
  updateTimer();
  animateWishGauge(currentWish || selected.title);
  $('playerSection').scrollIntoView({behavior:'smooth',block:'center'});
  toast(`${selected.title} 주파수를 준비했어요 ✦`);
}

function formatTime(sec){return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`}
function updateTimer(){
  $('timer').textContent = formatTime(remaining);
  $('progressBar').style.width = `${Math.max(0,Math.min(100,(1-remaining/total)*100))}%`;
}

async function startAudio(){
  if(playing)return;
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  await audioCtx.resume();
  gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001,audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.045,audioCtx.currentTime+2);
  gain.connect(audioCtx.destination);
  oscillators = [selected.hz, selected.hz*2].map((hz,i)=>{
    const osc=audioCtx.createOscillator(); osc.type=i?'sine':'sine'; osc.frequency.value=hz; osc.connect(gain); osc.start(); return osc;
  });
  playing=true; $('playBtn').textContent='Ⅱ';
  timerId=setInterval(()=>{
    if(remaining>0){remaining--;updateTimer();}
    if(remaining<=0){finishSession();}
  },1000);
}

function stopAudio(){
  if(timerId){clearInterval(timerId);timerId=null}
  if(gain && audioCtx){try{gain.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+.35)}catch(e){} setTimeout(()=>oscillators.forEach(o=>{try{o.stop()}catch(e){}}),400)}
  oscillators=[]; gain=null; playing=false; $('playBtn').textContent='▶';
}
function finishSession(){stopAudio();stopAmbient();remaining=total;updateTimer();celebrate();toast('소원 봉인 완료 ✦ 오늘의 몰입이 끝났어요.')}
function restart(){stopAudio();remaining=total;updateTimer();startAudio()}
function toast(text){const t=$('toast');t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}

$('playBtn').addEventListener('click',()=>playing?stopAudio():startAudio());
$('restartBtn').addEventListener('click',restart);
$('favoriteBtn').addEventListener('click',e=>{e.currentTarget.textContent=e.currentTarget.textContent==='♡'?'♥':'♡';toast('즐겨찾기에 저장했어요')});
$('wishBtn').addEventListener('click',startWish);
$('wishInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('wishBtn').click()});
$('historyBtn').addEventListener('click',()=>toast('청취 기록 기능은 다음 버전에서 추가됩니다.'));
renderCards();

/* ===== 소원 타로 (메이저 아르카나 22장 · 과거·현재·미래 3장 스프레드) ===== */
const tarotDeck = [
  {no:0, symbol:'🃏', name:'바보', en:'The Fool', up:'새로운 시작, 자유로운 모험, 순수한 도전', rev:'무모함, 준비 부족, 경솔한 결정'},
  {no:1, symbol:'🪄', name:'마법사', en:'The Magician', up:'창조력, 강한 의지, 자원을 다루는 능력', rev:'미숙함, 조작, 자신감 부족'},
  {no:2, symbol:'🌙', name:'여사제', en:'The High Priestess', up:'직관, 내면의 지혜, 숨겨진 가능성', rev:'혼란, 억눌린 감정, 비밀'},
  {no:3, symbol:'👑', name:'여황제', en:'The Empress', up:'풍요, 사랑, 창조와 결실', rev:'과잉 의존, 정체, 자기소홀'},
  {no:4, symbol:'🏛️', name:'황제', en:'The Emperor', up:'안정, 리더십, 질서와 책임', rev:'독선, 완고함, 통제욕'},
  {no:5, symbol:'📜', name:'교황', en:'The Hierophant', up:'전통, 조언, 신뢰할 조력자', rev:'형식주의, 반항, 고정관념'},
  {no:6, symbol:'💞', name:'연인', en:'The Lovers', up:'사랑, 조화, 중요한 선택', rev:'갈등, 유혹, 가치관 충돌'},
  {no:7, symbol:'🏇', name:'전차', en:'The Chariot', up:'추진력, 승리, 목표를 향한 돌파', rev:'조급함, 방향 상실, 통제 실패'},
  {no:8, symbol:'🦁', name:'힘', en:'Strength', up:'용기, 인내, 부드러운 내면의 힘', rev:'자신감 부족, 감정 소진, 조급함'},
  {no:9, symbol:'🏮', name:'은둔자', en:'The Hermit', up:'성찰, 내면 탐색, 지혜로운 거리두기', rev:'고립, 외로움, 회피'},
  {no:10, symbol:'🎡', name:'운명의 수레바퀴', en:'Wheel of Fortune', up:'전환점, 행운의 흐름, 변화의 기회', rev:'정체, 불운, 흐름 거스르기'},
  {no:11, symbol:'⚖️', name:'정의', en:'Justice', up:'균형, 공정한 결과, 명확한 판단', rev:'불공정, 편향, 책임 회피'},
  {no:12, symbol:'🙃', name:'매달린 사람', en:'The Hanged Man', up:'관점의 전환, 잠시 멈춤, 새로운 깨달음', rev:'헛된 희생, 정체, 우유부단'},
  {no:13, symbol:'🦋', name:'죽음', en:'Death', up:'끝과 새로운 시작, 근본적 변화', rev:'변화에 대한 저항, 미련, 지연'},
  {no:14, symbol:'🌊', name:'절제', en:'Temperance', up:'조화, 균형, 인내로운 중용', rev:'불균형, 과함, 조급함'},
  {no:15, symbol:'😈', name:'악마', en:'The Devil', up:'욕망, 집착, 벗어나야 할 속박', rev:'해방, 굴레 끊기, 자각'},
  {no:16, symbol:'🗼', name:'탑', en:'The Tower', up:'급격한 변화, 낡은 것의 붕괴, 각성', rev:'위기 모면, 변화의 지연, 두려움'},
  {no:17, symbol:'⭐', name:'별', en:'The Star', up:'희망, 영감, 치유와 회복', rev:'실망, 자신감 상실, 방향 흐림'},
  {no:18, symbol:'🌕', name:'달', en:'The Moon', up:'불안, 상상, 드러나지 않은 진실', rev:'혼란 해소, 진실이 드러남, 안정'},
  {no:19, symbol:'☀️', name:'태양', en:'The Sun', up:'성공, 기쁨, 밝은 에너지와 활력', rev:'일시적 지연, 과열, 낙관의 과함'},
  {no:20, symbol:'📯', name:'심판', en:'Judgement', up:'각성, 결단, 새로운 부름', rev:'후회, 자기 비판, 결정 회피'},
  {no:21, symbol:'🌍', name:'세계', en:'The World', up:'완성, 성취, 하나의 여정의 결실', rev:'미완성, 마무리 지연, 아쉬움'}
];
const tarotPositions = ['과거','현재','미래'];
const tarotBoard = $('tarotBoard');
let currentWish = '', currentWishCat = 'general', lastTarotPicks = [];

// 소원 → 카테고리/추천 주파수 판별
function detectWishCategory(text){
  const lower = (text||'').toLowerCase();
  if(/재회|연락|전여친|전남친|다시 만나|돌아오|헤어|이별/.test(lower)) return {cat:'reunion', freq:frequencies[0]};
  if(/돈|재산|부자|재물|수입|투자|월급|대박|로또|성공/.test(lower)) return {cat:'money', freq:frequencies[1]};
  if(/사랑|연애|연인|애인|짝사랑|고백|썸|결혼/.test(lower)) return {cat:'love', freq:frequencies[2]};
  if(/공부|집중|시험|일|업무|합격|취업|면접|승진/.test(lower)) return {cat:'focus', freq:frequencies[4]};
  if(/행운|운|기회|행복|건강/.test(lower)) return {cat:'luck', freq:frequencies[3]};
  return {cat:'general', freq:frequencies[3]};
}

// 자리별 해석 문장
const posFrame = {
  '과거':(c,m)=>`이 소원이 시작된 배경에는 ‘${m}’의 기운이 자리합니다. <b>${c.name}</b> 카드는 지난 시간 당신의 마음속에 쌓여온 흐름과, 지금의 바람이 생겨난 뿌리를 비춰줍니다.`,
  '현재':(c,m)=>`지금 이 순간의 핵심은 ‘${m}’입니다. <b>${c.name}</b> 카드는 소원을 향한 현재의 에너지와, 당신이 마주한 상황에서 가장 먼저 다뤄야 할 열쇠를 가리킵니다.`,
  '미래':(c,m)=>`이대로 나아간다면 ‘${m}’의 방향으로 흐름이 이어집니다. <b>${c.name}</b> 카드는 앞으로 다가올 가능성과, 그 결과를 좋은 쪽으로 이끌기 위해 준비할 마음가짐을 알려줍니다.`
};

// 소원 카테고리별 맞춤 조언
const wishAdvice = {
  reunion:'재회는 조급하게 다가가기보다 먼저 당신의 마음을 안정시키는 데서 다시 이어질 길이 열립니다. 연락은 감정이 가라앉은 뒤, 짧고 진심을 담아 건네보세요.',
  money:'재물의 기회는 무리한 욕심보다 꾸준함과 타이밍에서 옵니다. 지금은 큰 결정을 서두르기보다 기반을 다지고 정보를 모으며 준비할 때입니다.',
  love:'사랑은 상대를 바꾸려 애쓰기보다, 당신이 편안하고 빛나는 상태일 때 자연스럽게 다가옵니다. 마음을 열되 자신을 잃지 마세요.',
  focus:'집중과 성취는 완벽함이 아니라 지금 한 가지에 몰입하는 데서 시작됩니다. 방해 요소를 정리하고 오늘 할 일에 마음을 모으세요.',
  luck:'행운은 준비된 사람에게 흐릅니다. 작은 시도와 긍정적인 태도가 뜻밖의 기회를 불러올 거예요.',
  general:'소원을 이루는 열쇠는 마음의 방향을 분명히 하는 데 있습니다. 조급함을 내려놓고 지금 할 수 있는 한 걸음에 집중해보세요.'
};

function escapeHtml(s){return (s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function shuffle(arr){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

// 소원 시작하기: 주파수 선택(플레이어로 스크롤) + 타로 3장 자동 생성
function startWish(){
  const wish = $('wishInput').value.trim();
  if(!wish){ toast('먼저 소원을 한 문장으로 적어주세요.'); $('wishInput').focus(); return; }
  currentWish = wish;
  const {cat, freq} = detectWishCategory(wish);
  currentWishCat = cat;
  renderWishTarot();                       // 타로 카드·해석 미리 준비 (아래 섹션)
  selectFrequency(freq.id);                // 소원 주파수로 스크롤 이동 + 재생 준비
  showAffirmation(wish, cat);              // 소원 긍정 확언 팝업
  toast(`소원을 분석해 ${freq.title} 주파수와 타로를 준비했어요 ✦`);
}

function renderWishTarot(){
  const picks = shuffle(tarotDeck).slice(0,3).map(card=>({card, reversed: Math.random()<0.3}));
  lastTarotPicks = picks;
  tarotBoard.className = 'tarot-board count-3';
  tarotBoard.innerHTML = picks.map((p,i)=>`
    <div class="tarot-slot">
      <span class="tarot-slot-label">${tarotPositions[i]}</span>
      <div class="tarot-card" data-i="${i}">
        <div class="tarot-card-inner">
          <div class="tarot-face tarot-back"><span>✦</span></div>
          <div class="tarot-face tarot-front ${p.reversed?'reversed':''}">
            <span class="tarot-no">${String(p.card.no).padStart(2,'0')}</span>
            <span class="tarot-symbol">${p.card.symbol}</span>
            <span class="tarot-name">${p.card.name}</span>
            <span class="tarot-en">${p.card.en}</span>
            <span class="tarot-dir">${p.reversed?'역방향':'정방향'}</span>
          </div>
        </div>
      </div>
    </div>`).join('');
  tarotBoard.querySelectorAll('.tarot-card').forEach((c,i)=>setTimeout(()=>c.classList.add('flipped'), 300 + i*420));
  $('tarotGuide').innerHTML = `“<b>${escapeHtml(currentWish)}</b>” 에 대한 과거·현재·미래 3장의 카드입니다.`;
  $('tarotDrawBtn').classList.remove('hidden');
  $('tarotDrawBtn').textContent = '다시 뽑기 ✦';
  $('talismanBtn').classList.remove('hidden');
  buildWishReading(picks);
}

function buildWishReading(picks){
  const reading = $('tarotReading');
  const revCount = picks.filter(p=>p.reversed).length;
  const tone = revCount===0 ? '세 장 모두 정방향으로, 지금 이 소원을 향한 기운이 매우 순조롭게 흐르고 있습니다.'
    : revCount===3 ? '세 장 모두 역방향으로, 잠시 속도를 늦추고 마음을 정비하라는 신호가 강하게 나타납니다.'
    : revCount===1 ? '대체로 흐름이 좋지만, 한 장의 역방향 카드가 조심해야 할 지점을 짚어줍니다.'
    : '기회와 주의가 함께 담긴 스프레드입니다. 서두르기보다 균형을 잡는 것이 무엇보다 중요합니다.';
  const meanings = picks.map(p=>p.reversed?p.card.rev:p.card.up);
  const flow = `과거의 ‘${meanings[0].split(',')[0]}’에서 출발해, 현재는 ‘${meanings[1].split(',')[0]}’의 기운 속에 있으며, 앞으로는 ‘${meanings[2].split(',')[0]}’(으)로 이어지는 흐름입니다. 세 장을 이어보면 지금 당신에게 필요한 것은 흐름을 억지로 바꾸는 것이 아니라, 그 방향을 이해하고 한 걸음씩 맞춰가는 태도입니다.`;
  const freq = detectWishCategory(currentWish).freq;
  const cardHtml = picks.map((p,i)=>{
    const pos = tarotPositions[i];
    const m = p.reversed?p.card.rev:p.card.up;
    return `<div class="reading-item">
      <strong>${pos} · ${p.card.name} <em>(${p.reversed?'역방향':'정방향'})</em></strong>
      <p>${posFrame[pos](p.card, m)}</p>
    </div>`;
  }).join('');
  reading.innerHTML = `
    <h3>“${escapeHtml(currentWish)}” 타로 해석</h3>
    <p class="reading-lead">${tone}</p>
    ${cardHtml}
    <div class="reading-summary">
      <strong>종합 해석</strong>
      <p>${flow}</p>
      <p>${wishAdvice[currentWishCat]}</p>
      <p class="reading-tip">🎧 추천 주파수 <b>${freq.title} ${freq.hz}Hz</b>를 들으며 오늘 카드의 기운을 마음에 담아보세요.</p>
    </div>`;
  reading.classList.add('hidden');
  setTimeout(()=>reading.classList.remove('hidden'), 300 + 3*420 + 400);
}

$('tarotDrawBtn').addEventListener('click', renderWishTarot);

/* ===== 재미 요소: 성취 게이지 · 세리머니 · 오늘의 운세 ===== */
function hashStr(s){let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function seededPick(seed, arr){return arr[hashStr(seed)%arr.length]}

// 소원 성취 기운 게이지 (소원 텍스트 기반 72~98%, 0에서 차오름)
function animateWishGauge(seed){
  const pct = 72 + (hashStr('gauge:'+seed) % 27); // 72~98
  const fill = $('wishGaugeFill'), label = $('wishGaugePct');
  fill.style.width = '0%'; label.textContent = '0%';
  let cur = 0;
  clearInterval(animateWishGauge._t);
  animateWishGauge._t = setInterval(()=>{
    cur += Math.max(1, Math.round((pct-cur)/6));
    if(cur >= pct){ cur = pct; clearInterval(animateWishGauge._t); }
    fill.style.width = cur+'%'; label.textContent = cur+'%';
  }, 28);
}

// 완료 세리머니 (별가루/컨페티)
function celebrate(){
  const colors = ['#b79cff','#78d7ff','#ff8fba','#e8c86b','#79e6a0','#ffffff'];
  const wrap = document.createElement('div');
  wrap.className = 'confetti-wrap';
  for(let i=0;i<90;i++){
    const c = document.createElement('i');
    c.style.left = Math.random()*100 + '%';
    c.style.background = colors[i % colors.length];
    c.style.animationDelay = (Math.random()*0.7) + 's';
    c.style.animationDuration = (2.4 + Math.random()*1.8) + 's';
    if(i % 4 === 0) c.classList.add('spark');
    wrap.appendChild(c);
  }
  document.body.appendChild(wrap);
  setTimeout(()=>wrap.remove(), 4600);
}

// 오늘의 운세 (날짜 기반 → 하루 동안 고정)
const fortunes = [
  '오늘은 마음먹은 일이 뜻밖의 도움을 받는 날이에요.',
  '작은 용기가 큰 변화를 부르는 하루입니다.',
  '기다리던 소식이 슬며시 다가오고 있어요.',
  '오늘의 미소가 행운의 문을 엽니다.',
  '서두르지 않으면 원하는 것이 제자리를 찾아와요.',
  '누군가의 진심이 당신에게 닿는 하루예요.',
  '잠시 멈춰 숨을 고르면 길이 또렷해집니다.',
  '오늘 내민 손이 좋은 인연으로 돌아와요.',
  '마음속 소원에 한 걸음 가까워지는 날이에요.',
  '작은 정리 하나가 큰 행운의 자리를 만듭니다.',
  '오늘은 직감을 믿어도 좋은 날이에요.',
  '예상 못한 곳에서 반가운 기회가 반짝입니다.'
];
const luckyColors = [
  {name:'라벤더', hex:'#b79cff'}, {name:'딥블루', hex:'#5b8cff'}, {name:'로즈핑크', hex:'#ff8fba'},
  {name:'민트', hex:'#79e6a0'}, {name:'골드', hex:'#e8c86b'}, {name:'실버', hex:'#cfd3e6'},
  {name:'코랄', hex:'#ff9f7a'}, {name:'퍼플', hex:'#9c78ff'}
];
const luckyItems = ['향초','작은 거울','손편지','따뜻한 차','반지','노트','이어폰','꽃 한 송이','작은 돌','열쇠고리','목걸이','책갈피'];

function initFortune(){
  const d = new Date();
  const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  const f = seededPick('fortune:'+key, fortunes);
  const color = seededPick('color:'+key, luckyColors);
  const num = (hashStr('num:'+key) % 9) + 1;
  const item = seededPick('item:'+key, luckyItems);
  $('fortuneText').textContent = f;
  $('luckyColor').textContent = color.name;
  $('luckyColorDot').style.background = color.hex;
  $('luckyNumber').textContent = num;
  $('luckyItem').textContent = item;
}
initFortune();

/* ===== 소원 긍정 확언 팝업 (3번 외치기) ===== */
const affirmations = {
  reunion:['나는 사랑받을 자격이 충분한 사람이다.','필요한 인연은 가장 좋은 순간에 내게 돌아온다.','나는 조급함을 내려놓고 내 마음부터 편안하게 한다.'],
  money:['나는 풍요를 누릴 자격이 있다.','기회는 언제나 나를 향해 열려 있다.','나는 매일 조금씩 더 나은 방향으로 나아간다.'],
  love:['나는 있는 그대로 충분히 사랑스럽다.','나는 건강하고 따뜻한 사랑을 끌어당긴다.','나는 나를 아끼는 만큼 좋은 사람을 만난다.'],
  focus:['나는 내가 원하는 것을 이룰 힘이 있다.','나는 지금 이 순간에 온전히 집중한다.','나의 노력은 반드시 좋은 결실로 돌아온다.'],
  luck:['좋은 일이 자연스럽게 나를 찾아온다.','나는 매일 행운에 마음을 연다.','나는 준비된 사람이고, 기회를 알아본다.'],
  general:['나는 내 소원을 이룰 자격이 있다.','나는 매일 원하는 삶에 가까워지고 있다.','내가 바라는 것은 이미 내게로 오고 있다.']
};
const AFFIRM_TIMES = 3;
let affirmCount = 0;

function showAffirmation(wish, cat){
  affirmCount = 0;
  $('affirmWish').textContent = `“${wish}”`;
  const list = affirmations[cat] || affirmations.general;
  $('affirmList').innerHTML = list.map(a=>`<li>${escapeHtml(a)}</li>`).join('');
  const btn = $('affirmReadBtn');
  btn.disabled = false;
  btn.innerHTML = `확언 외치기 <span id="affirmCount">(0/${AFFIRM_TIMES})</span>`;
  const modal = $('affirmModal');
  modal.classList.remove('hidden');
  requestAnimationFrame(()=>modal.classList.add('show'));
}

function closeAffirmation(){
  const modal = $('affirmModal');
  modal.classList.remove('show');
  setTimeout(()=>modal.classList.add('hidden'), 280);
}

$('affirmReadBtn').addEventListener('click',()=>{
  if(affirmCount >= AFFIRM_TIMES) return;
  affirmCount++;
  const items = $('affirmList').querySelectorAll('li');
  items.forEach(li=>{ li.classList.remove('shout'); void li.offsetWidth; li.classList.add('shout'); });
  if(affirmCount >= AFFIRM_TIMES){
    items.forEach(li=>li.classList.add('read'));
    const btn = $('affirmReadBtn');
    btn.textContent = '확언 완성! 마음에 새겨졌어요 ✦';
    btn.disabled = true;
    celebrate();
    toast('긍정 확언 3번 완료 ✦ 소원에 힘이 실렸어요');
  } else {
    $('affirmCount').textContent = `(${affirmCount}/${AFFIRM_TIMES})`;
  }
});
$('affirmCloseBtn').addEventListener('click', closeAffirmation);
$('affirmBackdrop').addEventListener('click', closeAffirmation);

/* ===== 소원 부적 카드 (캔버스 → PNG 저장) ===== */
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function wrapText(ctx,text,maxW){const lines=[];let line='';for(const ch of [...text]){if(line && ctx.measureText(line+ch).width>maxW){lines.push(line);line=ch;}else line+=ch;}if(line)lines.push(line);return lines;}

async function generateTalisman(){
  const wish = currentWish || '나의 소원';
  const {freq} = detectWishCategory(wish);
  const picks = lastTarotPicks.length ? lastTarotPicks : shuffle(tarotDeck).slice(0,3).map(c=>({card:c,reversed:false}));
  const KR = "'Noto Sans KR','Malgun Gothic',sans-serif";
  const S=2, W=600, H=700;
  const cv=document.createElement('canvas'); cv.width=W*S; cv.height=H*S;
  const ctx=cv.getContext('2d'); ctx.scale(S,S); ctx.textAlign='center';
  try{ await Promise.race([Promise.all([document.fonts.load(`800 30px "Noto Sans KR"`),document.fonts.load(`500 12px "Noto Sans KR"`)]), new Promise(r=>setTimeout(r,800))]); }catch(e){}
  // 배경
  const g=ctx.createLinearGradient(0,0,W,H); g.addColorStop(0,'#241d3d'); g.addColorStop(.55,'#14111f'); g.addColorStop(1,'#0b0a14');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  const glow=(x,y,r,color,a)=>{const rg=ctx.createRadialGradient(x,y,0,x,y,r);rg.addColorStop(0,color);rg.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=a;ctx.fillStyle=rg;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.globalAlpha=1;};
  glow(120,150,280,'#9c78ff',.5); glow(490,600,300,'#46d5ff',.3);
  // 테두리
  ctx.strokeStyle='rgba(183,156,255,.55)'; ctx.lineWidth=2; roundRect(ctx,24,24,W-48,H-48,26); ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.lineWidth=1; roundRect(ctx,36,36,W-72,H-72,20); ctx.stroke();
  // 제목 / 날짜
  ctx.fillStyle='#e7ddff'; ctx.font=`800 15px ${KR}`; ctx.fillText('✦   소   원   부   적   ✦', W/2, 90);
  const d=new Date(); const ds=`${d.getFullYear()}. ${String(d.getMonth()+1).padStart(2,'0')}. ${String(d.getDate()).padStart(2,'0')}`;
  ctx.fillStyle='#a7a3b7'; ctx.font=`500 12px ${KR}`; ctx.fillText(ds, W/2, 114);
  // 소원
  ctx.fillStyle='#ffffff'; ctx.font=`700 30px ${KR}`;
  let wy=196; wrapText(ctx,`“${wish}”`, W-150).slice(0,3).forEach(l=>{ ctx.fillText(l, W/2, wy); wy+=42; });
  // 구분선
  wy+=8; ctx.strokeStyle='rgba(255,255,255,.14)'; ctx.beginPath(); ctx.moveTo(96,wy); ctx.lineTo(W-96,wy); ctx.stroke();
  // 주파수
  wy+=42; ctx.fillStyle='#b79cff'; ctx.font=`800 12px ${KR}`; ctx.fillText('소원 주파수', W/2, wy-20);
  ctx.fillStyle='#ffffff'; ctx.font=`800 32px ${KR}`; ctx.fillText(`${freq.title}  ${freq.hz}Hz`, W/2, wy+12);
  // 타로 3장
  const cardW=132, cardH=188, gap=22, totalW=cardW*3+gap*2, sx=(W-totalW)/2, cyTop=wy+50;
  picks.forEach((p,i)=>{
    const x=sx+i*(cardW+gap);
    ctx.fillStyle='rgba(255,255,255,.05)'; ctx.strokeStyle='rgba(183,156,255,.4)'; ctx.lineWidth=1.5;
    roundRect(ctx,x,cyTop,cardW,cardH,14); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#c9b6ff'; ctx.font=`700 11px ${KR}`; ctx.fillText(tarotPositions[i], x+cardW/2, cyTop+26);
    ctx.font=`400 46px ${KR}`;
    if(p.reversed){ ctx.save(); ctx.translate(x+cardW/2, cyTop+cardH/2-4); ctx.rotate(Math.PI); ctx.fillText(p.card.symbol,0,16); ctx.restore(); }
    else ctx.fillText(p.card.symbol, x+cardW/2, cyTop+cardH/2+10);
    ctx.fillStyle='#ffffff'; ctx.font=`700 15px ${KR}`; ctx.fillText(p.card.name, x+cardW/2, cyTop+cardH-38);
    ctx.fillStyle='#a7a3b7'; ctx.font=`500 10px ${KR}`; ctx.fillText(p.reversed?'역방향':'정방향', x+cardW/2, cyTop+cardH-20);
  });
  // 축원 문구 / 로고
  const by=cyTop+cardH+58;
  ctx.fillStyle='#d4ccff'; ctx.font=`600 14px ${KR}`;
  wrapText(ctx,'이 부적에 담긴 기운이 당신의 소원을 지켜주기를.', W-150).forEach((l,i)=>ctx.fillText(l, W/2, by+i*24));
  ctx.fillStyle='#706d7e'; ctx.font=`800 11px ${KR}`; ctx.fillText('WISH FREQUENCY · Make a wish ✦', W/2, H-52);
  return cv.toDataURL('image/png');
}

async function openTalisman(){
  const btn=$('talismanBtn'); const label=btn.textContent; btn.textContent='부적 만드는 중…'; btn.disabled=true;
  try{
    const url=await generateTalisman();
    $('talismanImg').src=url;
    const dl=$('talismanDownload'); dl.href=url;
    const d=new Date(); dl.download=`소원부적_${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}.png`;
    const m=$('talismanModal'); m.classList.remove('hidden'); requestAnimationFrame(()=>m.classList.add('show'));
  }catch(e){ toast('부적 생성 중 문제가 생겼어요.'); }
  btn.textContent=label; btn.disabled=false;
}
function closeTalisman(){ const m=$('talismanModal'); m.classList.remove('show'); setTimeout(()=>m.classList.add('hidden'),280); }

$('talismanBtn').addEventListener('click', openTalisman);
$('talismanCloseBtn').addEventListener('click', closeTalisman);
$('talismanBackdrop').addEventListener('click', closeTalisman);
$('talismanShare').addEventListener('click', shareTalisman);

/* ===== 배경 사운드 믹스 (Web Audio로 실시간 생성) ===== */
let ambientSource=null, ambientLFO=null, ambientGainNode=null, currentAmbient='none', ambientVol=0.45;

function makeNoiseBuffer(ctx, kind){
  const len=Math.floor(ctx.sampleRate*2.2);
  const buf=ctx.createBuffer(1,len,ctx.sampleRate);
  const d=buf.getChannelData(0);
  if(kind==='brown'){let last=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;last=(last+0.02*w)/1.02;d[i]=last*3.2;}}
  else {for(let i=0;i<len;i++) d[i]=Math.random()*2-1;}
  return buf;
}
function ambientTargetGain(){ return ambientVol*0.32; }

async function setAmbient(type){
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  await audioCtx.resume();
  if(ambientSource){ try{ambientSource.stop()}catch(e){} ambientSource=null; }
  if(ambientLFO){ try{ambientLFO.stop()}catch(e){} ambientLFO=null; }
  currentAmbient = type;
  document.querySelectorAll('.mix-btn').forEach(b=>b.classList.toggle('active', b.dataset.amb===type));
  if(type==='none') return;
  if(!ambientGainNode){ ambientGainNode=audioCtx.createGain(); ambientGainNode.connect(audioCtx.destination); }
  ambientGainNode.gain.value = ambientTargetGain();
  const src=audioCtx.createBufferSource();
  src.buffer=makeNoiseBuffer(audioCtx, type==='waves'?'brown':'white');
  src.loop=true;
  const filter=audioCtx.createBiquadFilter();
  if(type==='rain'){
    filter.type='bandpass'; filter.frequency.value=1400; filter.Q.value=0.6;
    src.connect(filter).connect(ambientGainNode);
  } else if(type==='waves'){
    filter.type='lowpass'; filter.frequency.value=600;
    const swell=audioCtx.createGain(); swell.gain.value=1;
    ambientLFO=audioCtx.createOscillator(); ambientLFO.type='sine'; ambientLFO.frequency.value=0.12;
    const depth=audioCtx.createGain(); depth.gain.value=0.6;
    ambientLFO.connect(depth).connect(swell.gain);
    src.connect(filter).connect(swell).connect(ambientGainNode);
    ambientLFO.start();
  } else { // 화이트노이즈 (부드럽게)
    filter.type='lowpass'; filter.frequency.value=8000;
    src.connect(filter).connect(ambientGainNode);
  }
  src.start();
  ambientSource=src;
}
function stopAmbient(){
  if(ambientSource){ try{ambientSource.stop()}catch(e){} ambientSource=null; }
  if(ambientLFO){ try{ambientLFO.stop()}catch(e){} ambientLFO=null; }
  currentAmbient='none';
  document.querySelectorAll('.mix-btn').forEach(b=>b.classList.toggle('active', b.dataset.amb==='none'));
}
document.querySelectorAll('.mix-btn').forEach(b=>b.addEventListener('click',()=>setAmbient(b.dataset.amb)));
$('ambientVol').addEventListener('input',e=>{
  ambientVol=+e.target.value/100;
  if(ambientGainNode) ambientGainNode.gain.value = ambientTargetGain();
});

/* ===== 공유하기 ===== */
function buildShareText(){
  const parts=[];
  if(currentWish) parts.push(`✦ 내 소원: "${currentWish}"`);
  if(selected) parts.push(`추천 주파수: ${selected.title} ${selected.hz}Hz`);
  if(lastTarotPicks.length) parts.push('타로 '+lastTarotPicks.map((p,i)=>`${tarotPositions[i]}-${p.card.name}(${p.reversed?'역':'정'})`).join(', '));
  parts.push('— WISH FREQUENCY ✦ 소원을 정하고, 주파수를 켜세요.');
  return parts.join('\n');
}
async function shareWish(){
  const text=buildShareText();
  try{
    if(navigator.share){ await navigator.share({title:'WISH FREQUENCY', text}); }
    else { await navigator.clipboard.writeText(text); toast('공유 문구를 복사했어요 ✦'); }
  }catch(e){
    if(e.name==='AbortError') return;
    try{ await navigator.clipboard.writeText(text); toast('공유 문구를 복사했어요 ✦'); }
    catch(_){ toast('이 브라우저는 공유를 지원하지 않아요.'); }
  }
}
async function shareTalisman(){
  const url=$('talismanImg').src; const text=buildShareText();
  try{
    const blob=await (await fetch(url)).blob();
    const file=new File([blob],'소원부적.png',{type:'image/png'});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({files:[file], title:'소원 부적', text});
    } else if(navigator.share){
      await navigator.share({title:'소원 부적', text});
    } else {
      try{ await navigator.clipboard.writeText(text); toast('공유 문구를 복사했어요. 이미지는 저장해서 공유해주세요 ✦'); }
      catch(_){ toast('저장 후 공유해주세요 ✦'); }
    }
  }catch(e){ if(e.name!=='AbortError') toast('공유를 지원하지 않는 환경이에요. 저장해서 공유해주세요.'); }
}
$('shareBtn').addEventListener('click', shareWish);
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape') return;
  if(!$('affirmModal').classList.contains('hidden')) closeAffirmation();
  if(!$('talismanModal').classList.contains('hidden')) closeTalisman();
});
