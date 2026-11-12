const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const palette={Black:['#292b30','#ffffff','#e4e4e7'], 'Gray/white':['#d4d6dc','#25272d','#eff0f3'],Red:['#c44848','#ffffff','#f9e6e6'],Blue:['#336bce','#ffffff','#e4edfc'],Green:['#287b59','#ffffff','#e1f2e9'],Purple:['#7155d9','#ffffff','#ede9fa'],Yellow:['#e5bb39','#29240f','#fbf3d9'],Orange:['#dc8136','#25180b','#fbeada']};
let saved={};try{saved=JSON.parse(localStorage.getItem('venn-availability')||'{}')||{}}catch{}
let selected=VennPlanner.migrate(saved), theme=saved.theme==='dark'?'dark':'light', color=Object.hasOwn(palette,saved.color)?saved.color:'Purple';
const $=s=>document.querySelector(s), calendar=$('#calendar');
const time=t=>{const h=Math.floor(t/2)%24;return `${h%12||12}:${t%2?'30':'00'} ${h<12?'AM':'PM'}`};
calendar.append(document.createElement('div'));
days.forEach(day=>{const el=document.createElement('div');el.className='day-heading';el.textContent=day.slice(0,3).toUpperCase();calendar.append(el)});
for(let hour=0;hour<48;hour++){const label=document.createElement('div');label.className='time-label';label.textContent=time(hour);calendar.append(label);for(let day=0;day<7;day++){const b=document.createElement('button');b.className='slot';b.dataset.key=`${day}-${hour}`;b.setAttribute('aria-label',`${days[day]}, ${time(hour)} to ${time((hour+1)%48)}`);b.setAttribute('aria-pressed',selected.has(b.dataset.key));b.textContent='✓';calendar.append(b)}}
const slots=[...document.querySelectorAll('.slot')];
function persist(){try{localStorage.setItem('venn-availability',JSON.stringify({version:2,slots:[...selected],theme,color}));$('#save-status').textContent='Saved on this device'}catch{$('#save-status').textContent='Storage unavailable — changes are temporary'}}
function update(){slots.forEach(b=>b.setAttribute('aria-pressed',selected.has(b.dataset.key)));$('#hours').textContent=selected.size/2;const counts=days.map((_,i)=>[...selected].filter(s=>s.startsWith(i+'-')).length/2);const active=counts.filter(Boolean).length;$('#summary').textContent=active?`${active} ${active===1?'day':'days'} with room for your next session.`:'A little room for a great game.';$('#day-summary').replaceChildren(...counts.map((n,i)=>{const row=document.createElement('div');row.className='day-row';row.innerHTML=`<span>${days[i].slice(0,3)}</span><span class="bar"><i style="width:${n/24*100}%"></i></span><span>${n}h</span>`;return row}));persist();renderPlanner()}
function toggle(b,value=!selected.has(b.dataset.key)){value?selected.add(b.dataset.key):selected.delete(b.dataset.key);update()}
let painting=false,paintValue=false,painted=false;
calendar.addEventListener('pointerdown',e=>{const b=e.target.closest('.slot');if(!b||e.pointerType==='touch'||e.button!==0)return;e.preventDefault();b.focus();painting=true;painted=true;paintValue=!selected.has(b.dataset.key);toggle(b,paintValue)});
calendar.addEventListener('pointerover',e=>{const b=e.target.closest('.slot');if(painting&&b)toggle(b,paintValue)});
window.addEventListener('pointerup',()=>{painting=false;setTimeout(()=>painted=false,0)});window.addEventListener('blur',()=>{painting=false;painted=false});
calendar.addEventListener('click',e=>{const b=e.target.closest('.slot');if(b&&!painted)toggle(b)});
calendar.addEventListener('keydown',e=>{const b=e.target.closest('.slot');if(!b)return;const index=slots.indexOf(b);const delta={ArrowRight:1,ArrowLeft:-1,ArrowDown:7,ArrowUp:-7}[e.key];if(delta){e.preventDefault();slots[Math.max(0,Math.min(slots.length-1,index+delta))].focus()}});
$('#clear').onclick=()=>{selected.clear();update()};
Object.entries(palette).forEach(([name,p])=>{const b=document.createElement('button');b.className='swatch';b.style.background=p[0];b.title=name;b.setAttribute('aria-label',name);b.dataset.color=name;b.onclick=()=>{color=name;appearance()};$('#colors').append(b)});
function appearance(){document.documentElement.dataset.theme=theme;let p=palette[color];const accent=color==='Black'&&theme==='dark'?'#c6c8cf':p[0];document.documentElement.style.setProperty('--accent',accent);document.documentElement.style.setProperty('--on-accent',color==='Black'&&theme==='dark'?'#202228':p[1]);document.documentElement.style.setProperty('--soft',theme==='dark'?'#343540':p[2]);document.querySelectorAll('.swatch').forEach(b=>b.setAttribute('aria-pressed',b.dataset.color===color));$('#light').setAttribute('aria-pressed',theme==='light');$('#dark').setAttribute('aria-pressed',theme==='dark');persist()}
$('#light').onclick=()=>{theme='light';appearance()};$('#dark').onclick=()=>{theme='dark';appearance()};
initPlanner();
$('#zone').textContent=Intl.DateTimeFormat().resolvedOptions().timeZone.replaceAll('_',' ');update();appearance();
requestAnimationFrame(()=>{const row=slots[16*7];$('.calendar-scroll').scrollTop=row.offsetTop-calendar.offsetTop-44});

function initPlanner(){
  window.vennMode='overall';window.vennChosen=new Set();
  $('#friend-choices').replaceChildren(...VennPlanner.friends.map(f=>{
    const label=document.createElement('label');label.className='friend-choice';
    const input=document.createElement('input');input.type='checkbox';input.value=f.id;
    input.onchange=()=>{input.checked?window.vennChosen.add(f.id):window.vennChosen.delete(f.id);renderPlanner()};
    const name=document.createElement('span');name.textContent=f.name;label.append(input);label.append(name);return label;
  }));
  ['overall','specific'].forEach(mode=>$('#'+mode).onclick=()=>{window.vennMode=mode;renderPlanner()});
  $('#demo-times').onclick=()=>{VennPlanner.makeSlots([[2,36,44],[4,36,46],[5,28,44]]).forEach(s=>selected.add(s));update()};
  $('#sample-schedules').replaceChildren(...VennPlanner.friends.map(f=>{const row=document.createElement('p');row.textContent=f.name+' · '+f.ranges.map(([d,s,e])=>`${days[d].slice(0,3)} ${time(s)}–${time(e)}`).join(' / ');return row}));
}
function renderPlanner(){
  const mode=window.vennMode;
  ['overall','specific'].forEach(m=>$('#'+m).setAttribute('aria-pressed',m===mode));
  $('#friend-choices').hidden=mode!=='specific';
  $('#match-rule').textContent=mode==='overall'?'Your availability + the most friends. Ties favor longer sessions, then earlier in the week.':'Choose one or more friends. Every selected friend must be available with you; other available friends are shown too.';
  const matches=VennPlanner.findWindows(selected,mode,[...window.vennChosen]);
  let message='';
  if(mode==='specific'&&!window.vennChosen.size)message='Choose at least one friend to find a time together.';
  else if(!selected.size)message='Select your availability above, or add demo times to try the planner.';
  else if(!matches.length)message=mode==='specific'?'No shared time with all selected friends. Try different friends or add more availability.':'No one is available during your selected times. Try adding another time.';
  $('#match-status').textContent=message||`${matches.length} matching ${matches.length===1?'window':'windows'} found. Showing ${Math.min(matches.length,6)} best options.`;
  $('#matches').replaceChildren(...matches.slice(0,6).map((w,i)=>{
    const card=document.createElement('article');card.className='match-card'+(!i?' best':'');
    const tag=document.createElement('div');tag.className='match-tag';tag.textContent=i?'ANOTHER GOOD TIME':mode==='overall'?'BEST OVERALL TIME':'BEST TIME FOR YOUR GROUP';
    const title=document.createElement('h3');title.textContent=`${days[w.day]} · ${time(w.start)}–${w.end===48?'12:00 AM (next day)':time(w.end)}`;
    const duration=document.createElement('p');duration.textContent=`${(w.end-w.start)/2} hr · You + ${w.online.length} ${w.online.length===1?'friend':'friends'}`;
    const names=document.createElement('div');names.className='online-list';names.textContent='Available: You, '+w.online.map(id=>VennPlanner.friends.find(f=>f.id===id).name).join(', ');
    card.append(tag);card.append(title);card.append(duration);card.append(names);return card;
  }));
}
