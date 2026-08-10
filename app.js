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
function finishSession(){stopAudio();remaining=total;updateTimer();toast('소원 몰입 시간이 끝났어요. ✦')}
function restart(){stopAudio();remaining=total;updateTimer();startAudio()}
function toast(text){const t=$('toast');t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}

$('playBtn').addEventListener('click',()=>playing?stopAudio():startAudio());
$('restartBtn').addEventListener('click',restart);
$('favoriteBtn').addEventListener('click',e=>{e.currentTarget.textContent=e.currentTarget.textContent==='♡'?'♥':'♡';toast('즐겨찾기에 저장했어요')});
$('wishBtn').addEventListener('click',()=>{
  const wish=$('wishInput').value.trim();
  if(!wish){toast('먼저 소원을 한 문장으로 적어주세요.');$('wishInput').focus();return}
  const lower=wish.toLowerCase();
  let pick = frequencies[3];
  if(/재회|연락|전여친|전남친|다시 만나|돌아오/.test(lower)) pick=frequencies[0];
  else if(/돈|재산|부자|재물|수입|투자/.test(lower)) pick=frequencies[1];
  else if(/사랑|연애|연인|애인|짝사랑/.test(lower)) pick=frequencies[2];
  else if(/공부|집중|시험|일|업무/.test(lower)) pick=frequencies[4];
  selectFrequency(pick.id); toast(`소원을 분석해 ${pick.title} 주파수를 추천했어요`);
});
$('wishInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('wishBtn').click()});
$('historyBtn').addEventListener('click',()=>toast('청취 기록 기능은 다음 버전에서 추가됩니다.'));
renderCards();
