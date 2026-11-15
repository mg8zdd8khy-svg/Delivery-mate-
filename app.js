const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'}).format(Number(n)||0);
const num=n=>Number(n)||0;
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const defaults={profiles:[],fuel:5.85,thresholds:{great:2.5,ok:1.5},orders:[],days:{},active:null};
let state=load(),tab='work',selectedDate=today(),appFilter='Wszystkie',formPlatform='Glovo';
function load(){
  try{
    const saved=JSON.parse(localStorage.getItem('deliverymate-data')||'{}');
    const merged={...structuredClone(defaults),...saved};
    // Remove only the old demo vehicles shipped with the previous build; user-created profiles remain.
    if(merged.active && !Number.isFinite(Number(merged.active.lastOdometer))) merged.active.lastOdometer=merged.orders.filter(o=>o.date===merged.active.date).reduce((s,o)=>s+num(o.km),0);
    if(merged.active && !merged.active.thresholds) merged.active.thresholds={...merged.thresholds};
    if(Array.isArray(merged.profiles)) merged.profiles=merged.profiles.filter(p=>!(['pcx','fiesta','bike'].includes(p.id)&&['Honda PCX 125','Ford Fiesta MK6','Rower'].includes(p.name)));
    return merged;
  }catch{return structuredClone(defaults)}
}
function save(){localStorage.setItem('deliverymate-data',JSON.stringify(state))}
function dayOrders(date=selectedDate){return state.orders.filter(o=>o.date===date)}
function totals(list){return list.reduce((a,o)=>({gross:a.gross+num(o.amount),km:a.km+num(o.km),fuel:a.fuel+num(o.fuel),net:a.net+num(o.amount)-num(o.fuel)}),{gross:0,km:0,fuel:0,net:0})}
function thresholdsFor(o){return o.thresholds||state.thresholds}
function score(o){const per=o.km>0?(o.amount-o.fuel)/o.km:0,th=thresholdsFor(o);return per>=th.great?['🔥 SUPER ZAMÓWIENIE','good']:per>=th.ok?['👌 MOŻE BYĆ','mid']:['😕 SŁABO','bad']}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function dateLabel(d){return new Date(d+'T12:00:00').toLocaleDateString('pl-PL',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
function header(kicker,title,sub=''){return `<div class="eyebrow">${kicker}</div><h1 class="page-title">${title}</h1>${sub?`<div class="sub">${sub}</div>`:''}`}
function metric(label,value,note=''){return `<div class="metric"><div class="metric-label">${label}</div><div class="metric-value">${value}</div>${note?`<div class="metric-note">${note}</div>`:''}</div>`}
function dayHero(t){return `<div class="card hero"><div class="hero-label">ZAROBEK NA CZYSTO</div><div class="hero-value">${money(t.net)}</div><div class="hero-foot"><span>Przychód ${money(t.gross)}</span><span>${t.km.toFixed(1)} km</span></div></div>`}
function render(){
 document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
 ({work:renderWork,daily:renderDaily,monthly:renderMonthly,apps:renderApps,profile:renderProfile,install:renderInstall})[tab]();
}
function renderWork(){
 let d=state.active?.date||selectedDate,os=dayOrders(d),t=totals(os),active=state.active&&state.active.date===d,closed=!!state.days[d]?.closed;
 let goal=active?state.active.goal:0,percent=goal?Math.min(100,t[(state.active.goalType==='net'?'net':'gross')]/goal*100):0;
 $('#app').innerHTML=header('PANEL KIEROWCY',active?'Dzień pracy':'Gotowy na trasę',dateLabel(d))+
 `<div class="row" style="margin-top:16px"><div class="field" style="flex:1;margin:0"><label>Data pracy</label><input type="date" id="workDate" value="${d}" ${active?'disabled':''}></div><span class="pill">${closed?'ZAMKNIĘTY':active?'W TRAKCIE':'NIEAKTYWNY'}</span></div>`+
 dayHero(t)+`<div class="metrics">${metric('ZAMÓWIENIA',os.length,'Zapisane kursy')}${metric('ŚREDNIO / KM',t.km?money(t.net/t.km):'—','Po kosztach')}${metric('KOSZT PALIWA',money(t.fuel))}${metric('LICZNIK',active?`${num(state.active.lastOdometer).toFixed(1)} km`:'—','Ostatni odczyt')}</div>`+
 (active?`<div class="card"><div class="row"><div><div class="metric-label">POJAZD</div><b>${esc(state.active.vehicleName)}</b></div><div style="text-align:right"><div class="metric-label">CEL DNIA</div><b>${money(goal)}</b></div></div><div class="progress"><span style="width:${percent}%"></span></div><div class="hero-foot"><span>${percent.toFixed(0)}% realizacji</span><span>${state.active.goalType==='net'?'Cel na czysto':'Cel przed kosztami'}</span></div><div class="list-meta">Spalanie: ${state.active.consumption} l/100 km · Paliwo: ${money(state.active.fuelPrice)}/l</div></div>`:'')+
 (closed?`<div class="notice">Ten dzień jest zamknięty. Nie można już dodawać do niego zamówień.</div>`:active?`<button class="btn" id="addOrder">＋ DODAJ ZAMÓWIENIE</button><button class="btn secondary" id="closeDay">ZAKOŃCZ DZIEŃ</button>`:`<button class="btn" id="startDay" ${state.profiles.length?'':'disabled'}>ROZPOCZNIJ DZIEŃ</button>${state.profiles.length?'':'<div class="notice">Najpierw dodaj swój pojazd w zakładce Profil → Pojazdy.</div>'}`)+
 `<div class="section-head"><h2>Zamówienia z tego dnia</h2><span class="pill">${os.length} kursów</span></div><div class="card">${os.length?os.slice().reverse().map(orderRow).join(''):'<div class="empty">Brak zamówień. Dodaj pierwszy kurs, aby rozpocząć statystyki.</div>'}</div><button class="btn ghost" id="installInfo">＋ ZAINSTALUJ DELIVERYMATE NA IPHONIE</button>`;
 $('#workDate').onchange=e=>{selectedDate=e.target.value||today();render()};
 $('#startDay')?.addEventListener('click',openStart);$('#addOrder')?.addEventListener('click',openOrder);$('#closeDay')?.addEventListener('click',closeDay);$('#installInfo')?.addEventListener('click',()=>{tab='install';render()});
}
function orderRow(o){
 let [label]=score(o);return `<div class="list-item"><div><div class="list-title">${esc(o.platform)} · ${money(o.amount)}</div><div class="list-meta">${num(o.km).toFixed(1)} km · licznik ${num(o.odometer).toFixed(1)} km · ${new Date(o.created).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})} · ${label}</div></div><div class="amount">${money(o.amount-o.fuel)}<div class="list-meta">na czysto</div></div></div>`;
}
function modal(content){
 $('#modalRoot').innerHTML=`<div class="modal-backdrop" id="backdrop"><section class="modal"><button class="modal-x" id="modalClose" aria-label="Zamknij">×</button>${content}</section></div>`;
 $('#modalClose').onclick=closeModal;$('#backdrop').onclick=e=>{if(e.target.id==='backdrop')closeModal()};
}
function closeModal(){$('#modalRoot').innerHTML=''}
function openStart(){
 const d=selectedDate;let vehicle=state.profiles[0];
 const choices=state.profiles.map(p=>`<div class="choice ${p.id===vehicle.id?'selected':''}" data-vehicle="${p.id}"><span class="emoji">${p.emoji}</span><b>${esc(p.name)}</b><small>${p.type==='bicycle'?'Bez paliwa':`${p.consumption} l/100 km`}</small></div>`).join('');
 modal(`<h2>Rozpocznij dzień</h2><p class="sub">Ustaw pojazd, licznik i parametry dzisiejszej pracy.</p><div class="vehicle-grid" id="vehicleChoices">${choices}</div><div class="field"><label>Stan licznika na początku dnia (km)</label><input id="startOdometer" type="number" min="0" step="0.1" placeholder="np. 125430"></div><div class="field"><label>Cel zarobkowy (zł)</label><input id="goalInput" type="number" min="0" step="10" placeholder="np. 300"></div><div class="field"><label>Rodzaj celu</label><select id="goalType"><option value="net">Na czysto (po kosztach)</option><option value="gross">Przed kosztami (przychód)</option></select></div><div class="field"><label>Cena paliwa (zł/l)</label><input id="fuelInput" type="number" min="0" step="0.01" value="${state.fuel}"></div><div class="row"><div class="field"><label>MOŻE BYĆ od (zł/km)</label><input id="thresholdOk" type="number" min="0" step=".1" value="${state.thresholds.ok}"></div><div class="field"><label>SUPER od (zł/km)</label><input id="thresholdGreat" type="number" min="0" step=".1" value="${state.thresholds.great}"></div></div><button class="btn" id="confirmStart">ROZPOCZNIJ DZIEŃ</button>`);
 $('#vehicleChoices').onclick=e=>{let c=e.target.closest('[data-vehicle]');if(!c)return;vehicle=state.profiles.find(p=>p.id===c.dataset.vehicle);document.querySelectorAll('.choice').forEach(x=>x.classList.toggle('selected',x===c))};
 $('#confirmStart').onclick=()=>{
  const start=num($('#startOdometer').value),fuelPrice=vehicle.type==='bicycle'?0:num($('#fuelInput').value),ok=num($('#thresholdOk').value),great=num($('#thresholdGreat').value);
  if(!$('#startOdometer').value.trim()||start<0){alert('Wpisz początkowy stan licznika.');return}
  if(great<ok){alert('Próg SUPER musi być równy lub wyższy niż MOŻE BYĆ.');return}
  state.fuel=num($('#fuelInput').value);
  state.active={date:d,vehicleId:vehicle.id,vehicleName:vehicle.name,vehicleType:vehicle.type,consumption:vehicle.type==='bicycle'?0:num(vehicle.consumption),fuelPrice,goal:num($('#goalInput').value),goalType:$('#goalType').value,thresholds:{ok,great},startOdometer:start,lastOdometer:start};
  save();closeModal();render();
 };
}
function openOrder(){
 formPlatform='Glovo';const a=state.active;
 modal(`<h2>Dodaj zamówienie</h2><p class="sub">Wpisz zarobek i aktualny, łączny stan licznika po kursie.</p><div class="platform-grid" id="platformChoices">${[['Glovo','🟢'],['Uber Eats','🟢'],['Pyszne.pl','🔴']].map(([n,e])=>`<div class="choice ${n===formPlatform?'selected':''}" data-platform="${n}"><span class="emoji">${e}</span><b>${n}</b></div>`).join('')}</div><div class="field"><label>Zarobek z zamówienia (zł)</label><input id="orderAmount" type="number" min="0" step="0.01" placeholder="np. 18.50"></div><div class="field"><label>Aktualny stan licznika po kursie (km)</label><input id="orderOdometer" type="number" min="${num(a.lastOdometer)}" step="0.1" placeholder="np. ${num(a.lastOdometer)+8}"></div><div class="notice">Ostatni odczyt: ${num(a.lastOdometer).toFixed(1)} km. Wpisz wartość całkowitą z licznika, nie dystans samego zamówienia.</div><button class="btn" id="saveOrder">ZAPISZ ZAMÓWIENIE</button>`);
 $('#platformChoices').onclick=e=>{let c=e.target.closest('[data-platform]');if(!c)return;formPlatform=c.dataset.platform;document.querySelectorAll('#platformChoices .choice').forEach(x=>x.classList.toggle('selected',x===c))};
 $('#saveOrder').onclick=()=>{
  const amount=num($('#orderAmount').value),odometer=num($('#orderOdometer').value),km=+(odometer-num(a.lastOdometer)).toFixed(2);
  if(amount<=0||!$('#orderOdometer').value.trim()){alert('Wpisz zarobek i stan licznika.');return}
  if(km<=0){alert('Nowy stan licznika musi być wyższy od poprzedniego odczytu.');return}
  const fuel=km*num(a.consumption)/100*num(a.fuelPrice);
  const o={id:crypto.randomUUID(),date:a.date,platform:formPlatform,amount,km,odometer,fuel,rate:a.consumption,fuelPrice:a.fuelPrice,thresholds:{...a.thresholds},created:new Date().toISOString()};
  state.orders.push(o);a.lastOdometer=odometer;save();closeModal();
  const [label,cls]=score(o),per=(amount-fuel)/km;
  modal(`<div style="text-align:center;padding:14px 0"><div style="font-size:45px">${label.split(' ')[0]}</div><div class="eyebrow">ZAMÓWIENIE ZAPISANE</div><h2 class="${cls}" style="margin-top:8px">${label.slice(3)}</h2><div class="hero-value">${money(amount-fuel)}</div><p class="sub">Zarobek po kosztach z tego kursu</p></div><div class="metrics">${metric('PLATFORMA',esc(formPlatform))}${metric('ZAROBEK / KM',money(per))}${metric('DYSTANS',km.toFixed(1)+' km')}${metric('PALIWO',money(fuel))}</div><button class="btn" id="doneOrder">WRÓĆ DO DNIA PRACY</button>`);
  $('#doneOrder').onclick=()=>{closeModal();render()};
 };
}
function closeDay(){
 const os=dayOrders(),t=totals(os),vehicle=state.active.vehicleName;
 state.days[selectedDate]={closed:true,summary:{...t,count:os.length,vehicle,ratings:os.reduce((a,o)=>{let s=score(o)[0];a[s]=(a[s]||0)+1;return a},{})}};
 state.active=null;save();
 modal(`<div class="eyebrow">PODSUMOWANIE DNIA</div><h2>Dobra robota!</h2><p class="sub">${dateLabel(selectedDate)}</p><div class="hero"><div class="hero-label">ZAROBEK NA CZYSTO</div><div class="hero-value">${money(t.net)}</div></div><div class="metrics">${metric('PRZYCHÓD',money(t.gross))}${metric('KILOMETRY',t.km.toFixed(1)+' km')}${metric('PALIWO',money(t.fuel))}${metric('ZAMÓWIENIA',os.length)}${metric('POJAZD',esc(vehicle))}</div><div class="sub" style="margin:14px 0">${Object.entries(state.days[selectedDate].summary.ratings).map(([k,v])=>`${k}: ${v}`).join(' · ')||'Brak ocenionych zamówień'}</div><button class="btn" id="summaryDone">ZAMKNIJ PODSUMOWANIE</button>`);
 $('#summaryDone').onclick=()=>{closeModal();render()};
}
function renderDaily(){
 const os=dayOrders(),t=totals(os);
 $('#app').innerHTML=header('HISTORIA','Statystyki dzienne','Przeglądaj swoje wyniki dzień po dniu.')+`<div class="field"><label>Wybierz dzień</label><input type="date" id="dailyDate" value="${selectedDate}"></div>`+dayHero(t)+`<div class="metrics">${metric('PRZYCHÓD',money(t.gross))}${metric('NA CZYSTO',money(t.net))}${metric('KILOMETRY',t.km.toFixed(1)+' km')}${metric('ZAMÓWIENIA',os.length)}</div><div class="section-head"><h2>Kursy</h2><span class="pill">${os.length} łącznie</span></div><div class="card">${os.length?os.slice().reverse().map(orderRow).join(''):'<div class="empty">Brak danych dla wybranego dnia.</div>'}</div>`;
 $('#dailyDate').onchange=e=>{selectedDate=e.target.value;render()};
}
function renderMonthly(){
 const month=selectedDate.slice(0,7),os=state.orders.filter(o=>o.date.startsWith(month)),t=totals(os),days=[...new Set(os.map(o=>o.date))].length;
 $('#app').innerHTML=header('PODSUMOWANIE','Wyniki miesięczne','Wszystkie platformy razem, bez ukrywania kosztów.')+`<div class="field"><label>Wybierz miesiąc</label><input type="month" id="monthPick" value="${month}"></div>`+dayHero(t)+`<div class="metrics">${metric('PRZYCHÓD',money(t.gross))}${metric('NA CZYSTO',money(t.net))}${metric('KILOMETRY',t.km.toFixed(1)+' km')}${metric('AKTYWNE DNI',days)}</div><div class="section-head"><h2>Platformy</h2></div><div class="card">${['Glovo','Uber Eats','Pyszne.pl'].map(p=>{let x=totals(os.filter(o=>o.platform===p));return `<div class="list-item"><div><div class="list-title">${p}</div><div class="list-meta">${x.km.toFixed(1)} km · ${money(x.gross)} przychodu</div></div><div class="amount">${money(x.net)}<div class="list-meta">na czysto</div></div></div>`}).join('')}</div><div class="section-head"><h2>Ostatnie kursy</h2></div><div class="card">${os.length?os.slice().reverse().slice(0,12).map(orderRow).join(''):'<div class="empty">Brak danych w tym miesiącu.</div>'}</div>`;
 $('#monthPick').onchange=e=>{selectedDate=e.target.value+'-01';render()};
}
function renderApps(){
 const os=state.orders.filter(o=>appFilter==='Wszystkie'||o.platform===appFilter),t=totals(os);
 $('#app').innerHTML=header('ANALITYKA','Aplikacje','Porównuj platformy i sprawdzaj, gdzie zarabiasz najlepiej.')+`<div class="tabswitch" id="appFilters">${['Wszystkie','Glovo','Uber Eats','Pyszne.pl'].map(p=>`<button class="${p===appFilter?'active':''}" data-app="${p}">${p==='Wszystkie'?'Łącznie':p}</button>`).join('')}</div>`+dayHero(t)+`<div class="metrics">${metric('PRZYCHÓD',money(t.gross))}${metric('NA CZYSTO',money(t.net))}${metric('KILOMETRY',t.km.toFixed(1)+' km')}${metric('KURSY',os.length)}</div><div class="card">${os.length?os.slice().reverse().map(orderRow).join(''):'<div class="empty">Nie ma jeszcze zamówień dla tego wyboru.</div>'}</div>`;
 $('#appFilters').onclick=e=>{let b=e.target.closest('[data-app]');if(b){appFilter=b.dataset.app;render()}};
}
function renderProfile(){
 $('#app').innerHTML=header('USTAWIENIA','Twój profil','Pojazdy, paliwo i progi opłacalności.')+`<div class="section-head"><h2>Pojazdy</h2><button class="small-btn" id="addVehicle">＋ Dodaj pojazd</button></div><div class="card">${state.profiles.length?state.profiles.map(p=>`<div class="list-item"><div><div class="list-title">${p.emoji} ${esc(p.name)}</div><div class="list-meta">${p.type==='bicycle'?'Rower · bez paliwa':`${p.consumption} l / 100 km`}</div></div><div class="row compact"><button class="small-btn" data-edit="${p.id}">Edytuj</button><button class="small-btn danger-text" data-delete="${p.id}">Usuń</button></div></div>`).join(''):'<div class="empty">Nie dodano jeszcze żadnego pojazdu.</div>'}</div><div class="card"><h2 style="font-size:16px;margin-top:0">Domyślne ustawienia</h2><div class="field"><label>Domyślna cena paliwa (zł/l)</label><input id="profileFuel" type="number" min="0" step="0.01" value="${state.fuel}"></div><h2 style="font-size:16px">Progi opłacalności</h2><div class="row"><div class="field"><label>MOŻE BYĆ od (zł/km)</label><input id="thresholdOk" type="number" min="0" step="0.1" value="${state.thresholds.ok}"></div><div class="field"><label>SUPER od (zł/km)</label><input id="thresholdGreat" type="number" min="0" step="0.1" value="${state.thresholds.great}"></div></div><button class="btn" id="saveProfile">ZAPISZ USTAWIENIA</button></div><button class="btn secondary" id="installFromProfile">Jak dodać aplikację do iPhone’a</button><button class="btn ghost" id="exportData">Eksportuj kopię danych (JSON)</button><button class="btn danger" id="resetData">Usuń wszystkie dane</button>`;
 $('#saveProfile').onclick=()=>{const ok=num($('#thresholdOk').value),great=num($('#thresholdGreat').value);if(great<ok){alert('Próg SUPER musi być równy lub wyższy niż MOŻE BYĆ.');return}state.fuel=num($('#profileFuel').value);state.thresholds={ok,great};save();alert('Ustawienia zapisane.');render()};
 $('#addVehicle').onclick=()=>vehicleModal();
 document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>vehicleModal(state.profiles.find(x=>x.id===b.dataset.edit)));
 document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{const p=state.profiles.find(x=>x.id===b.dataset.delete);if(confirm(`Usunąć pojazd „${p.name}”? Zapisane kursy i historia pozostaną bez zmian.`)){state.profiles=state.profiles.filter(x=>x.id!==p.id);save();render()}});
 $('#installFromProfile').onclick=()=>{tab='install';render()};
 $('#exportData').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='deliverymate-backup.json';a.click();URL.revokeObjectURL(url)};
 $('#resetData').onclick=()=>{if(confirm('Na pewno usunąć wszystkie zamówienia i ustawienia?')){state=structuredClone(defaults);save();render()}};
}
function vehicleModal(p=null){
 const isEdit=!!p;let type=p?.type||'scooter';
 modal(`<h2>${isEdit?'Edytuj pojazd':'Dodaj pojazd'}</h2><div class="vehicle-type" id="vehicleTypes">${[['scooter','🛵','Skuter'],['car','🚗','Samochód'],['bicycle','🚲','Rower']].map(([v,e,l])=>`<button type="button" class="choice ${type===v?'selected':''}" data-type="${v}"><span class="emoji">${e}</span><b>${l}</b></button>`).join('')}</div><div class="field"><label>Nazwa pojazdu</label><input id="vehicleName" maxlength="40" value="${esc(p?.name||'')}" placeholder="np. Honda PCX 125"></div><div class="field" id="consumptionField" ${type==='bicycle'?'hidden':''}><label>Spalanie (l/100 km)</label><input id="vehicleConsumption" type="number" min="0" step="0.1" value="${p?.consumption??''}" placeholder="np. 2.5"></div><button class="btn" id="saveVehicle">${isEdit?'ZAPISZ ZMIANY':'DODAJ POJAZD'}</button>`);
 $('#vehicleTypes').onclick=e=>{const b=e.target.closest('[data-type]');if(!b)return;type=b.dataset.type;document.querySelectorAll('#vehicleTypes .choice').forEach(x=>x.classList.toggle('selected',x===b));$('#consumptionField').hidden=type==='bicycle'};
 $('#saveVehicle').onclick=()=>{const name=$('#vehicleName').value.trim(),cons=num($('#vehicleConsumption').value);if(!name){alert('Podaj nazwę pojazdu.');return}if(type!=='bicycle'&&cons<=0){alert('Podaj spalanie większe od zera.');return}const emoji={scooter:'🛵',car:'🚗',bicycle:'🚲'}[type];if(isEdit)Object.assign(p,{name,type,emoji,consumption:type==='bicycle'?0:cons});else state.profiles.push({id:crypto.randomUUID(),name,type,emoji,consumption:type==='bicycle'?0:cons});save();closeModal();render()};
}
function renderInstall(){
 $('#app').innerHTML=header('POMOC','Dodaj do ekranu głównego','DeliveryMate może działać na iPhonie jak aplikacja — bez App Store.')+`<div class="card hero"><img class="install-logo" src="assets/icon-512.png" alt="Logo DeliveryMate"><div class="eyebrow">DELIVERYMATE</div><h2 style="font-size:22px;margin:7px 0">YOUR DELIVERY.<br>YOUR NUMBERS.</h2><p class="sub">Dodaj ikonę na ekran główny, aby uruchamiać aplikację jednym dotknięciem.</p></div><div class="install-step"><span class="step-no">1</span><div><b>Otwórz DeliveryMate w Safari</b><p>Na iPhonie otwórz link do aplikacji w Safari. Nie używaj Chrome ani widoku przeglądarki w komunikatorze.</p></div></div><div class="install-step"><span class="step-no">2</span><div><b>Naciśnij przycisk Udostępnij</b><p>To ikona kwadratu ze strzałką skierowaną do góry na pasku Safari.</p></div></div><div class="install-step"><span class="step-no">3</span><div><b>Wybierz „Dodaj do ekranu głównego”</b><p>Przewiń listę opcji i dotknij „Dodaj do ekranu głównego”.</p></div></div><div class="install-step"><span class="step-no">4</span><div><b>Potwierdź przyciskiem „Dodaj”</b><p>Ikona pojawi się na ekranie iPhone’a.</p></div></div><div class="notice"><b>Ważne:</b> instalacja wymaga HTTPS (np. GitHub Pages). Dane są przechowywane lokalnie na tym urządzeniu — regularnie eksportuj kopię zapasową.</div><button class="btn secondary" id="backHome">WRÓĆ DO APLIKACJI</button>`;
 $('#backHome').onclick=()=>{tab='work';render()};
}
function showWelcome(){
 if(localStorage.getItem('deliverymate-welcomed')==='1')return;
 const overlay=document.createElement('div');overlay.className='welcome-screen';overlay.innerHTML=`<img src="assets/icon-512.png" class="welcome-logo" alt="DeliveryMate"><div class="welcome-brand">Delivery<span>Mate</span></div><div class="welcome-tag">YOUR DELIVERY. YOUR NUMBERS.</div><p>Każdy kilometr przybliża Cię do celu.</p><div class="welcome-clock" id="welcomeClock"></div><button class="btn" id="welcomeGo">GOTOWY</button>`;
 document.body.appendChild(overlay);
 const update=()=>{const el=$('#welcomeClock');if(el)el.textContent=new Date().toLocaleString('pl-PL',{weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})};
 update();const clock=setInterval(update,15000);
 $('#welcomeGo').onclick=()=>{localStorage.setItem('deliverymate-welcomed','1');clearInterval(clock);overlay.classList.add('welcome-hide');setTimeout(()=>overlay.remove(),350)};
}
$('#profileShortcut').onclick=()=>{tab='profile';render()};
$('#installShortcut').onclick=()=>{tab='install';render()};
document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});
if('serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
render();showWelcome();
