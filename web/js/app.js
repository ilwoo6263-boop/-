/* =========================================================
 * WISH FREQUENCY · 앱 로직 (app.js)
 * 정적 데이터(frequencies, tarotDeck, affirmations 등)는 data.js에 있습니다.
 * ======================================================= */

const $ = id => document.getElementById(id);

/* ===== 네이티브 브리지 (안드로이드 / iOS 공용) =====
 * 앱(WebView/WKWebView)에서 실행되면 네이티브 공유·저장을 사용하고,
 * 일반 브라우저에서는 available=false 라서 웹 기본 동작으로 폴백된다. */
const Native = (function(){
  const android = window.AndroidBridge;                                  // 안드로이드
  const ios = (window.webkit && window.webkit.messageHandlers) || null;  // iOS(WKWebView)
  const iosHas = name => ios && ios[name];
  return {
    available: !!(android || ios),
    shareText(text){
      if(android && android.shareText){ android.shareText(text); return true; }
      if(iosHas('shareText')){ ios.shareText.postMessage(text); return true; }
      return false;
    },
    shareImage(dataUrl, text){
      if(android && android.shareImage){ android.shareImage(dataUrl, text); return true; }
      if(iosHas('shareImage')){ ios.shareImage.postMessage({dataUrl, text}); return true; }
      return false;
    },
    saveImage(dataUrl){
      if(android && android.saveImage){ android.saveImage(dataUrl); return true; }
      if(iosHas('saveImage')){ ios.saveImage.postMessage(dataUrl); return true; }
      return false;
    }
  };
})();
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

// 오늘의 운세 (날짜 기반 → 하루 동안 고정, 데이터는 data.js)
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

/* ===== 소원 긍정 확언 팝업 (3번 외치기, affirmations 데이터는 data.js) ===== */
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
// 앱(WebView/WKWebView)에서는 <a download>가 동작하지 않으므로 네이티브 저장으로 대체
$('talismanDownload').addEventListener('click', e=>{
  if(Native.saveImage($('talismanImg').src)){ e.preventDefault(); toast('이미지를 저장 중… ✦'); }
});

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
  if(Native.shareText(text)) return;  // 앱(안드로이드/iOS) 네이티브 공유
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
  if(Native.shareImage(url, text)) return;  // 앱(안드로이드/iOS) 네이티브 이미지 공유
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
