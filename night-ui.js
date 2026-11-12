(() => {
 const E=NightEngine,U=window.VennUI,host=document.querySelector('.planner');
 let stored={};try{stored=JSON.parse(localStorage.getItem('venn-planning-v3')||'{}')||{}}catch{}
 const settings={scope:stored.settings?.scope==='specific'?'specific':'overall',chosen:Array.isArray(stored.settings?.chosen)?stored.settings.chosen:[],tentative:stored.settings?.tentative!==false,fair:stored.settings?.fair===true};
 const friends=E.demoFriends(),privacy=stored.privacy&&typeof stored.privacy==='object'?stored.privacy:{};
 let friendOverrides=stored.friendOverrides||{};
 settings.chosen=settings.chosen.filter(id=>friends.some(f=>f.id===id));
 for(const f of friends){const value=friendOverrides[f.id];if(E.confidence[value])Object.keys(f.availability).forEach(k=>f.availability[k]=value);const n=stored.history?.[f.id];if(Number.isInteger(n)&&n>=0&&n<=99)f.missed=n}
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e};
 const option=(text,value)=>new Option(text,value);
 host.innerHTML='<div class="planner-heading"><div><div class="section-kicker">02 / FIND YOUR OVERLAP</div><h2 id="planner-title">When can we play?</h2><p>See when you and your friends are free. Pick a time together.</p></div><span class="repeat-badge">Demo friends</span></div>'+
 '<div class="planner-modes" aria-label="Availability view"><button id="overall">1. Best overall time</button><button id="specific">2. Choose specific friends</button></div><div id="friend-choices" class="friend-choices"></div>'+
 '<div class="night-switches"><label><input id="night-tentative" type="checkbox"> Include tentative availability</label><label><input id="night-fair" type="checkbox"> Prioritize friends I haven’t played with lately</label></div>'+
 '<p class="help">Times update from everyone’s availability. Probable, maybe, and needs-notice times still need a check with your friends.</p>'+
 '<p id="match-status" role="status" aria-live="polite"></p><div id="overlap-results" class="matches"></div><div id="partial-overlaps"></div>'+
 '<div class="demo-notice"><span>Try it with five sample friends in your local timezone. These are availability estimates, not live online status. Preferences save on this device.</span><button id="demo-times">Add demo times to my week</button></div>'+
 '<details class="night-details"><summary>Demo friends, confidence & history</summary><p class="help">Edit sample confidence and how often you haven’t played together to try the recommendations.</p><div id="demo-friends"></div></details>'+
 '<details class="night-details"><summary>Who can see my availability?</summary><p class="help">Sharing preview only until real accounts are connected. Nothing is shared with other people. Private is the default.</p><div class="night-fields"><label>Friend group<select id="sharing-group"><option value="all">All demo friends</option><option value="squad">Squad: Alex, Maya, Jordan</option><option value="casual">Casual: Sam, Riley</option></select></label><label>Visibility<select id="sharing-level"><option value="none">Private</option><option value="busy">Free / busy only</option><option value="gaming">Gaming times only</option><option value="exact">Exact times & confidence</option></select></label></div><button id="sharing-apply" class="secondary-button">Apply to group</button><div id="sharing-friends"></div><label class="preview-label">Preview as<select id="sharing-viewer"></select></label><div id="sharing-preview" class="sharing-preview"></div></details>';
 const q=s=>document.querySelector(s);
 function save(){try{localStorage.setItem('venn-planning-v3',JSON.stringify({...stored,settings,privacy,friendOverrides,history:Object.fromEntries(friends.map(f=>[f.id,f.missed]))}))}catch{q('#match-status').textContent='Storage unavailable. Preferences are temporary.'}}
 for(const [id,key] of [['#night-tentative','tentative'],['#night-fair','fair']]){q(id).checked=settings[key];q(id).onchange=()=>{settings[key]=q(id).checked;changed()}}
 ['overall','specific'].forEach(scope=>q('#'+scope).onclick=()=>{settings.scope=scope;changed()});
 friends.forEach(f=>{const label=el('label',undefined,'friend-choice'),input=el('input');input.type='checkbox';input.checked=settings.chosen.includes(f.id);input.onchange=()=>{settings.chosen=input.checked?[...new Set([...settings.chosen,f.id])]:settings.chosen.filter(id=>id!==f.id);changed()};label.append(input,el('span',f.name));q('#friend-choices').append(label)});
 q('#demo-times').onclick=()=>{const demo={...E.range(0,12,16),...E.range(2,36,44),...E.range(4,36,47),...E.range(5,28,44),...E.range(6,14,20)};for(const [k,v] of Object.entries(demo))if(!U.availability[k])U.availability[k]=v;U.update()};
 function card(r,index,partial=false){
   const node=el('article',undefined,'match-card'+(!index&&!partial?' best':''));
   node.append(el('div',partial?'SOME SELECTED FRIENDS':!index?(settings.fair?'CATCH UP WITH FRIENDS':'BEST OVERLAP'):'ANOTHER TIME','match-tag'),
     el('h3',U.days[r.day]+' · '+U.time(r.start)+'–'+U.time(r.end)),
     el('p',(r.end-r.start)/2+' '+(r.end-r.start===2?'hour':'hours')+' together · '+r.roster.length+' '+(r.roster.length===1?'friend':'friends')));
   const list=el('div',undefined,'attendee-list');list.append(el('span','You · '+E.confidence[r.own].label,'person-chip'));
   r.roster.forEach(f=>list.append(el('span',f.name+' · '+E.confidence[f.status].label,'person-chip')));node.append(list);
   const reason=[settings.fair?'Prioritizes friends you haven’t played with lately, using demo history.':'Ranked by most friends, then definite availability, then the longest overlap.','Everyone shown is available for the whole time range.'];
   if(r.conditional)reason.push('Tentative availability: check with these friends before relying on this time.');
   if(partial){const missing=friends.filter(f=>settings.chosen.includes(f.id)&&!r.roster.some(p=>p.id===f.id));reason.push('Not available: '+missing.map(f=>f.name).join(', ')+'.')}
   const details=el('details',undefined,'why');details.append(el('summary','Why this time?'),el('p',reason.join(' ')));node.append(details);return node;
 }
 function render(){
   q('#overall').setAttribute('aria-pressed',settings.scope==='overall');q('#specific').setAttribute('aria-pressed',settings.scope==='specific');q('#friend-choices').hidden=settings.scope!=='specific';
   const results=E.overlaps(U.availability,friends,settings),specific=settings.scope==='specific';
   const primary=specific?results.filter(r=>r.all):results;
   q('#match-status').textContent=specific&&!settings.chosen.length?'Choose at least one friend.':!Object.keys(U.availability).length?'Mark your free time in Schedule, or add demo times to try it.':!results.length?'No one is available with you at these times. Try adding availability or including tentative times.':specific&&!primary.length?'No shared time with all selected friends. You can still play with some of them below.':specific?'Times when you and every selected friend are available.':'Your best times to play, based on who’s available with you.';
   q('#overlap-results').replaceChildren(...E.distinct(primary,6).map((r,i)=>card(r,i)));
   const partial=q('#partial-overlaps');partial.replaceChildren();
   if(specific&&results.some(r=>!r.all)){partial.append(el('h3','When some selected friends are free'),el('p','These times don’t include everyone you selected.','help'));const grid=el('div',undefined,'matches');E.distinct(results.filter(r=>!r.all),3).forEach((r,i)=>grid.append(card(r,i,true)));partial.append(grid)}
   renderPreview();
 }
 function renderDemo(){q('#demo-friends').replaceChildren();friends.forEach(f=>{const row=el('div',undefined,'demo-friend');row.append(el('strong',f.name));const label=el('label','Demo confidence');const select=el('select');select.add(option('Mixed sample confidence','mixed'));Object.entries(E.confidence).forEach(([id,c])=>select.add(option(c.label,id)));select.value=friendOverrides[f.id]||'mixed';select.onchange=()=>{if(select.value==='mixed'){delete friendOverrides[f.id];f.availability=E.demoFriends().find(p=>p.id===f.id).availability}else{friendOverrides[f.id]=select.value;Object.keys(f.availability).forEach(k=>f.availability[k]=select.value)}renderDemo();changed()};label.append(select);const historyLabel=el('label','Times we haven’t played together (demo)');const input=el('input');input.type='number';input.min=0;input.max=99;input.value=f.missed;input.onchange=()=>{f.missed=Math.max(0,Math.min(99,Math.round(Number(input.value)||0)));input.value=f.missed;changed()};historyLabel.append(input);const times=el('details');times.append(el('summary','View sample times'));const text=el('p',Object.entries(f.availability).map(([k,c])=>{const[d,t]=k.split('-').map(Number);return `${U.days[d].slice(0,3)} ${U.time(t)} (${E.confidence[c].label})`}).join(' / '));times.append(text);row.append(label,historyLabel,times);q('#demo-friends').append(row)})}
 const sharingOptions=[['none','Private'],['busy','Free / busy only'],['gaming','Gaming times only'],['exact','Times & confidence']];
 function renderSharing(){q('#sharing-friends').replaceChildren();friends.forEach(f=>{const row=el('label',f.name,'sharing-row');const select=el('select');sharingOptions.forEach(([v,t])=>select.add(option(t,v)));select.value=sharingOptions.some(([v])=>v===privacy[f.id])?privacy[f.id]:'none';select.onchange=()=>{privacy[f.id]=select.value;save();renderPreview()};row.append(select);q('#sharing-friends').append(row)})}
 friends.forEach(f=>q('#sharing-viewer').add(option(f.name,f.id)));q('#sharing-viewer').onchange=renderPreview;
 q('#sharing-apply').onclick=()=>{const group=q('#sharing-group').value,ids=group==='all'?friends.map(f=>f.id):group==='squad'?['alex','maya','jordan']:['sam','riley'];ids.forEach(id=>privacy[id]=q('#sharing-level').value);save();renderSharing();renderPreview()};
 function renderPreview(){const box=q('#sharing-preview');box.replaceChildren();const id=q('#sharing-viewer').value,level=privacy[id]||'none';if(level==='none'){box.append(el('p','This friend cannot see your availability in this preview.'));return}const visible=E.visibleAvailability(U.availability,level);box.append(el('p',level==='exact'?'Exact times and confidence are visible.':'Only available times are visible. Confidence is hidden.'));if(!visible.length)box.append(el('p','No available times selected.'));const list=el('ul');visible.sort((a,b)=>{const[ad,at]=a.key.split('-').map(Number),[bd,bt]=b.key.split('-').map(Number);return ad-bd||at-bt}).forEach(v=>{const[d,t]=v.key.split('-').map(Number);list.append(el('li',`${U.days[d]} ${U.time(t)}–${U.time(t+1)} · ${E.confidence[v.status]?.label||'Available'}${v.activity?' · Gaming':''}`))});box.append(list)}

 function changed(){save();render()}
 window.addEventListener('venn-availability',render);renderDemo();renderSharing();render();
})();
