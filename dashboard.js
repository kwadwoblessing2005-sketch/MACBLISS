const teamPool = [
  ['London City','North United','ENGLISH PREMIER LEAGUE'],
  ['Madrid Stars','Barcelona Athletic','SPANISH LA LIGA'],
  ['Munich Eleven','Berlin Rovers','GERMAN BUNDESLIGA'],
  ['Milano','Roma Sporting','ITALIAN SERIE A'],
  ['Accra Hearts','Kumasi Lions','GHANA PREMIER LEAGUE'],
  ['Paris Central','Marseille Blue','FRENCH LIGUE 1'],
  ['Lagos United','Abuja FC','NIGERIA PREMIER FOOTBALL LEAGUE'],
  ['Cape Town Stars','Johannesburg City','SOUTH AFRICAN PREMIER DIVISION']
];
const daySeed = Math.floor(new Date(new Date().setHours(0,0,0,0)) / 86400000);
const todayLabel = new Intl.DateTimeFormat('en-GB', { weekday:'short', day:'2-digit', month:'short' }).format(new Date());
const matches = [
  {home:'Accra Hearts', away:'Kumasi Lions', league:'GHANA PREMIER LEAGUE', odds:[1.75,3.35,4.25]},
  {home:'London City', away:'North United', league:'ENGLISH PREMIER LEAGUE', odds:[1.82,3.40,4.10]},
  {home:'Madrid Stars', away:'Barcelona Athletic', league:'SPANISH LA LIGA', odds:[2.05,3.20,3.65]},
  {home:'Lagos United', away:'Abuja FC', league:'NIGERIA PREMIER FOOTBALL LEAGUE', odds:[1.96,3.10,3.80]}
].map((match, index) => {
  const rotation = (daySeed + index * 3) % teamPool.length;
  const teams = teamPool[(rotation + index * 2) % teamPool.length];
  const hours = [17, 18, 20, 21][index];
  const minutes = ['30','00','15','45'][index];
  return { ...match, home:teams[0], away:teams[1], league:teams[2], time:`${index < 2 ? 'LIVE' : 'Today'} ${hours}:${minutes}`, live:index < 2, minute:[23,61][index] || null };
});
const picked=[];
async function guard(){try{const r=await fetch('session.php');if(!r.ok){location.href='login.html';return}const d=await r.json();document.querySelector('#avatar').textContent=d.user.firstName.charAt(0).toUpperCase();}catch(_){location.href='login.html'}}
guard();
function render(filter='all'){const visible=filter==='live'?matches.filter(match=>match.live):matches;document.querySelector('#matches').innerHTML=`<div class="fixtures-date"><span>⚽ MATCHES FOR</span><strong>${todayLabel}</strong></div>`+visible.map((m,i)=>`<article class="match"><div class="match-head">⚽ ${m.league}<b class="${m.live?'live-badge':''}">${m.live?'● LIVE '+m.minute+'\'' : m.time}</b></div><div class="match-body"><div class="team"><div><b>${m.home}</b>${m.live?'<small class="live-score">1</small>':''}</div><div><b>${m.away}</b>${m.live?'<small class="live-score">0</small>':''}</div><div style="color:#999;font-size:10px">Draw</div></div><div class="odds">${['1','X','2'].map((name,n)=>`<button data-match="${matches.indexOf(m)}" data-side="${n}"><small>${name}</small>${m.odds[n].toFixed(2)}</button>`).join('')}</div></div></article>`).join('');}
render();
document.querySelector('.sports').addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;document.querySelectorAll('.sports button').forEach(item=>item.classList.remove('active'));button.classList.add('active');render(button.textContent.trim()==='LIVE'?'live':'all');});
document.querySelector('#matches').addEventListener('click',event=>{const button=event.target.closest('.odds button');if(!button)return;if(depositRequired){modal.classList.add('open','mandatory');modal.setAttribute('aria-hidden','false');showToast('Make a deposit before placing bets');return;}const i=Number(button.dataset.match),side=Number(button.dataset.side),match=matches[i],names=[match.home,'Draw',match.away],key=`${i}-${side}`;document.querySelectorAll('.odds button').forEach(b=>b.classList.remove('selected'));button.classList.add('selected');const existing=picked.findIndex(p=>p.key===key);if(existing<0)picked.push({key,i,side,name:names[side],match,odds:match.odds[side]});else picked.splice(existing,1);updateSlip();});
function updateSlip(){document.querySelector('#emptySlip').style.display=picked.length?'none':'block';document.querySelector('#stakeBox').style.display=picked.length?'block':'none';document.querySelector('#slipItems').innerHTML=picked.map((p,n)=>`<div class="slip-item"><button data-remove="${n}">✕</button><small>${p.match.home} - ${p.match.away}</small><br><b>${p.name}</b> &nbsp; <b>${p.odds.toFixed(2)}</b></div>`).join('');document.querySelector('.slip-tabs span').textContent=picked.length;updateReturns();}
document.querySelector('#slipItems').addEventListener('click',event=>{if(!event.target.dataset.remove)return;picked.splice(Number(event.target.dataset.remove),1);document.querySelectorAll('.odds button.selected').forEach(b=>b.classList.remove('selected'));updateSlip();});
document.querySelector('#stake').addEventListener('input',updateReturns);
function updateReturns(){const odds=picked.reduce((total,p)=>total*p.odds,1);document.querySelector('#returns').textContent=`GH₵ ${(Number(document.querySelector('#stake').value||0)*odds).toFixed(2)}`;}
document.querySelector('#placeBet').addEventListener('click',()=>{if(depositRequired){modal.classList.add('open','mandatory');modal.setAttribute('aria-hidden','false');return;}if(!picked.length)return;const toast=document.querySelector('#toast');toast.textContent='Bet placed successfully';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3000);});
const hero=document.querySelector('#matchHero');
hero.addEventListener('pointermove',event=>{const bounds=hero.getBoundingClientRect();const x=(event.clientX-bounds.left)/bounds.width-.5;const y=(event.clientY-bounds.top)/bounds.height-.5;hero.style.transform=`rotateX(${y*-4}deg) rotateY(${x*7}deg)`;});
hero.addEventListener('pointerleave',()=>hero.style.transform='');

let balance = Number(localStorage.getItem('macblissBalance') || 0);
const signupPrize = sessionStorage.getItem('macblissSignupPrize');
let depositRequired = balance <= 0 || Boolean(signupPrize);
const formatCedis = amount => `GH₵ ${Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
function updateWallet(){document.querySelector('.wallet').textContent=formatCedis(balance)}
updateWallet();
const modal=document.querySelector('#depositModal');
document.querySelector('.deposit').addEventListener('click',()=>{modal.classList.add('open');modal.setAttribute('aria-hidden','false')});
modal.querySelector('.modal-close').addEventListener('click',closeDeposit);
modal.addEventListener('click',event=>{if(event.target===modal)closeDeposit()});
function closeDeposit(){
  if (depositRequired) { showToast('Complete a deposit to continue'); return; }
  modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');
}
document.querySelectorAll('.method').forEach(method=>method.addEventListener('click',()=>{document.querySelectorAll('.method').forEach(item=>item.classList.remove('active'));method.classList.add('active');const momo=method.dataset.method==='momo';document.querySelector('#momoFields').hidden=!momo;document.querySelector('#cardFields').hidden=momo;}));
const amount=document.querySelector('#depositAmount'), depositLabel=document.querySelector('#confirmDeposit span');
amount.addEventListener('input',()=>depositLabel.textContent=Math.max(50,Number(amount.value||50)).toFixed(2));
document.querySelector('#confirmDeposit').addEventListener('click', async () => {
  const value = Number(amount.value || 0);
  if (value < 50) { showToast('Minimum deposit is GH₵ 50.00'); return; }
  const button = document.querySelector('#confirmDeposit');
  button.disabled = true;
  button.textContent = 'OPENING PAYSTACK...';
  try {
    const response = await fetch('api-paystack-init.php', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({amount: value})
    });
    const data = await response.json();
    if (!response.ok || !data.authorization_url) throw new Error(data.message || 'Could not open Paystack checkout');
    sessionStorage.setItem('macblissPaystackReference', data.reference);
    location.href = data.authorization_url;
  } catch (error) {
    showToast(error.message);
    button.disabled = false;
    button.innerHTML = 'DEPOSIT GH₵ <span>' + Math.max(50, value).toFixed(2) + '</span>';
  }
});
function showToast(text){const toast=document.querySelector('#toast');toast.textContent=text;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3000)}
updateSlip();

const paystackReference = new URLSearchParams(location.search).get('reference') || new URLSearchParams(location.search).get('trxref');
if (paystackReference) {
  verifyPaystackPayment(paystackReference);
}

async function verifyPaystackPayment(reference) {
  try {
    const response = await fetch('api-paystack-verify.php?reference=' + encodeURIComponent(reference));
    const payment = await response.json();
    if (!response.ok || !payment.success) throw new Error(payment.message || 'Payment could not be verified');
    const completedReferences = JSON.parse(localStorage.getItem('macblissPaidReferences') || '[]');
    if (!completedReferences.includes(reference)) {
      balance += Number(payment.amount);
      if (signupPrize) {
        balance += Number(signupPrize);
        sessionStorage.removeItem('macblissSignupPrize');
      }
      completedReferences.push(reference);
      localStorage.setItem('macblissPaidReferences', JSON.stringify(completedReferences));
      localStorage.setItem('macblissBalance', String(balance));
      depositRequired = false;
      updateWallet();
      showToast(signupPrize ? `${formatCedis(payment.amount)} deposited — GH₵ 300.00 bonus redeemed!` : `${formatCedis(payment.amount)} deposited successfully`);
    }
  } catch (error) {
    showToast(error.message);
  } finally {
    history.replaceState({}, '', location.pathname);
  }
}

if (signupPrize && !paystackReference) {
  const prizeModal = document.querySelector('#prizeModal');
  prizeModal.classList.add('open');
  prizeModal.setAttribute('aria-hidden','false');
  updateWallet();
  history.pushState({depositGate:true}, '', location.href);
  setTimeout(() => {
    prizeModal.classList.remove('open');
    prizeModal.setAttribute('aria-hidden','true');
    modal.classList.add('open', 'mandatory');
    modal.setAttribute('aria-hidden','false');
  }, 4000);
} else if (depositRequired) {
  history.pushState({depositGate:true}, '', location.href);
  setTimeout(() => {
    modal.classList.add('open', 'mandatory');
    modal.setAttribute('aria-hidden','false');
  }, 5000);
}
window.addEventListener('popstate', () => {
  if (depositRequired) {
    history.pushState({depositGate:true}, '', location.href);
    modal.classList.add('open', 'mandatory');
    modal.setAttribute('aria-hidden','false');
  }
});
