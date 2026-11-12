const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const palette={Black:['#292b30','#fff','#e4e4e7'],'Gray/white':['#d4d6dc','#25272d','#eff0f3'],Red:['#c44848','#fff','#f9e6e6'],Blue:['#336bce','#fff','#e4edfc'],Green:['#287b59','#fff','#e1f2e9'],Purple:['#7155d9','#fff','#ede9fa'],Yellow:['#e5bb39','#29240f','#fbf3d9'],Orange:['#dc8136','#25180b','#fbeada']};
const $=s=>document.querySelector(s);
const time=t=>{const h=Math.floor(t/2)%24;return `${h%12||12}:${t%2?'30':'00'} ${h<12?'AM':'PM'}${t===48?' (next day)':''}`};
let saved={};try{saved=JSON.parse(localStorage.getItem('venn-availability')||'{}')||{}}catch{}
const availability=NightEngine.migrate(saved);
let theme=saved.theme==='dark'?'dark':'light',color=Object.hasOwn(palette,saved.color)?saved.color:'Purple',brush='definite';
function persist(){try{localStorage.setItem('venn-availability',JSON.stringify({version:3,availability,theme,color}));$('#save-status').textContent='Saved on this device'}catch{$('#save-status').textContent='Storage unavailable — changes are temporary'}}
const calendar=$('#calendar');const corner=document.createElement('div');corner.className='day-heading';calendar.append(corner);
days.forEach(day=>{const el=document.createElement('div');el.className='day-heading';el.textContent=day.slice(0,3).toUpperCase();calendar.append(el)});
for(let t=0;t<48;t++){const label=document.createElement('div');label.className='time-label';label.textContent=time(t);calendar.append(label);for(let d=0;d<7;d++){const b=document.createElement('button');b.className='slot';b.dataset.key=`${d}-${t}`;b.dataset.label=`${days[d]}, ${time(t)} to ${time(t+1)}`;calendar.append(b)}}
const slots=[...calendar.querySelectorAll('.slot')];
function update(){
 slots.forEach(b=>{const c=availability[b.dataset.key],def=NightEngine.confidence[c];b.setAttribute('aria-pressed',!!def);b.dataset.confidence=c||'';b.textContent=def?.symbol||'';b.setAttribute('aria-label',b.dataset.label+': '+(def?.label||'Unavailable'));b.title=def?.label||'Unavailable'});
 const keys=Object.keys(availability);$('#hours').textContent=keys.length/2;const counts=days.map((_,i)=>keys.filter(k=>k.startsWith(i+'-')).length/2);
 $('#summary').textContent=keys.length?`${keys.filter(k=>availability[k]==='definite').length/2} definite hours · ${counts.filter(Boolean).length} days with room to play.`:'Select a few times to find your overlap.';
 $('#day-summary').replaceChildren(...counts.map((n,i)=>{const row=document.createElement('div');row.className='day-row';row.innerHTML=`<span>${days[i].slice(0,3)}</span><span class="bar"><i style="width:${n/24*100}%"></i></span><span>${n}h</span>`;return row}));persist();window.dispatchEvent(new Event('venn-availability'));
}
function applySlot(b,value){if(value==='erase')delete availability[b.dataset.key];else availability[b.dataset.key]=value;update()}
function nextValue(b){return brush==='erase'||availability[b.dataset.key]===brush?'erase':brush}
let painting=false,paintValue='definite',suppressClick=false;
calendar.addEventListener('pointerdown',e=>{const b=e.target.closest('.slot');if(!b||e.pointerType==='touch'||e.button!==0)return;e.preventDefault();painting=true;suppressClick=true;paintValue=nextValue(b);b.focus();applySlot(b,paintValue)});
calendar.addEventListener('pointerover',e=>{const b=e.target.closest('.slot');if(painting&&b)applySlot(b,paintValue)});
window.addEventListener('pointerup',()=>{painting=false;setTimeout(()=>suppressClick=false,0)});window.addEventListener('blur',()=>{painting=false;suppressClick=false});
calendar.addEventListener('click',e=>{const b=e.target.closest('.slot');if(b&&!suppressClick)applySlot(b,nextValue(b))});
calendar.addEventListener('keydown',e=>{const b=e.target.closest('.slot');const delta={ArrowRight:1,ArrowLeft:-1,ArrowDown:7,ArrowUp:-7}[e.key];if(b&&delta){e.preventDefault();slots[Math.max(0,Math.min(slots.length-1,slots.indexOf(b)+delta))].focus()}});
$('#confidence-brush').onchange=e=>brush=e.target.value;
$('#clear').onclick=()=>{Object.keys(availability).forEach(k=>delete availability[k]);update()};
Object.entries(palette).forEach(([name,p])=>{const b=document.createElement('button');b.className='swatch';b.style.background=p[0];b.title=name;b.setAttribute('aria-label',name);b.dataset.color=name;b.onclick=()=>{color=name;appearance()};$('#colors').append(b)});
function appearance(){document.documentElement.dataset.theme=theme;const p=palette[color],darkBlack=color==='Black'&&theme==='dark';document.documentElement.style.setProperty('--accent',darkBlack?'#c6c8cf':p[0]);document.documentElement.style.setProperty('--on-accent',darkBlack?'#202228':p[1]);document.documentElement.style.setProperty('--soft',theme==='dark'?'#343540':p[2]);document.querySelectorAll('.swatch').forEach(b=>b.setAttribute('aria-pressed',b.dataset.color===color));$('#light').setAttribute('aria-pressed',theme==='light');$('#dark').setAttribute('aria-pressed',theme==='dark');persist()}
$('#light').onclick=()=>{theme='light';appearance()};$('#dark').onclick=()=>{theme='dark';appearance()};
$('#zone').textContent=Intl.DateTimeFormat().resolvedOptions().timeZone.replaceAll('_',' ');update();appearance();
requestAnimationFrame(()=>{const row=slots[16*7];$('.calendar-scroll').scrollTop=row.offsetTop-calendar.offsetTop-44});
window.VennUI={availability,update,days,time};
