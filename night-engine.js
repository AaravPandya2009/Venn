/* Pure planning rules. Confidence is a per-person, per-slot value. */
const NightEngine = (() => {
  const confidence = {definite:{label:'Definitely free',symbol:'✓',rank:3},probable:{label:'Probably free',symbol:'~',rank:2},maybe:{label:'Maybe',symbol:'?',rank:1},notice:{label:'Needs notice',symbol:'!',rank:0}};
  const games = {
    coop:{name:'Two-player co-op',min:2,max:2,duration:2},
    squad:{name:'Four-player squad',min:4,max:4,duration:2},
    team:{name:'Five-player team',min:5,max:5,duration:3},
    campaign:{name:'Tabletop / campaign',min:3,max:6,duration:4},
    custom:{name:'Custom game / hang out',min:2,max:6,duration:2}
  };
  const modes = {
    quick:{name:'Quick match',game:'custom',duration:1},cozy:{name:'Cozy co-op',game:'coop',duration:2},
    ranked:{name:'Ranked night',game:'team',duration:3},campaign:{name:'Campaign session',game:'campaign',duration:4},
    tournament:{name:'Tournament night',game:'squad',duration:4},hangout:{name:'Just hang out',game:'custom',duration:2}
  };
  function migrate(old={}) {
    const out={};
    if(old.version===3 && old.availability && typeof old.availability==='object'){
      for(const [k,v] of Object.entries(old.availability))if(validKey(k)&&confidence[v])out[k]=v;
    } else for(const k of Array.isArray(old.slots)?old.slots:[]){
      if(!validKey(k))continue;const [d,t]=k.split('-').map(Number);
      if(old.version===2)out[k]='definite';else if(t<24){out[`${d}-${t*2}`]='definite';out[`${d}-${t*2+1}`]='definite'}
    }
    return out;
  }
  function validKey(k){return typeof k==='string'&&/^[0-6]-(?:[0-9]|[1-3][0-9]|4[0-7])$/.test(k)}
  const range=(d,s,e,value='definite')=>Object.fromEntries(Array.from({length:e-s},(_,i)=>[`${d}-${s+i}`,value]));
  function demoFriends(){return [
    {id:'alex',name:'Alex',missed:0,availability:{...range(0,36,44),...range(2,36,44),...range(4,36,46),...range(5,28,40)}},
    {id:'maya',name:'Maya',missed:0,availability:{...range(1,38,44),...range(2,38,43,'probable'),...range(4,38,45),...range(5,30,42)}},
    {id:'jordan',name:'Jordan',missed:2,availability:{...range(0,40,46),...range(3,38,44),...range(4,40,47,'maybe'),...range(5,32,40)}},
    {id:'sam',name:'Sam',missed:1,availability:{...range(2,36,42),...range(4,39,44,'probable'),...range(5,34,44),...range(6,28,36)}},
    {id:'riley',name:'Riley',missed:3,availability:{...range(0,12,16),...range(1,12,16),...range(4,40,44,'notice'),...range(6,14,20)}}
  ]}
  function statusFor(availability,day,start,length){
    let worst='definite';for(let i=0;i<length;i++){const value=availability[`${day}-${start+i}`];if(!confidence[value])return null;if(confidence[value].rank<confidence[worst].rank)worst=value}return worst;
  }
  function evaluate(availability,people,settings,day,start,cancellations=[]){
    const length=Number(settings.duration),own=statusFor(availability,day,start,length);
    if(!own||(!settings.tentative&&own!=='definite'))return null;
    const attendees=people.filter(f=>!cancellations.includes(f.id)).map(f=>({...f,status:statusFor(f.availability,day,start,length)})).filter(f=>f.status&&(settings.tentative||f.status==='definite'));
    const required=settings.scope==='specific'?people.filter(f=>settings.chosen.includes(f.id)):people;
    const pool=settings.scope==='specific'?attendees.filter(f=>settings.chosen.includes(f.id)):attendees;
    const cap=Number(settings.maximum)-1;
    const sorted=[...pool].sort((a,b)=>(settings.fair?b.missed-a.missed:0)||confidence[b.status].rank-confidence[a.status].rank||a.id.localeCompare(b.id));
    const roster=sorted.slice(0,cap),count=roster.length+1;
    const all=required.length>0&&required.every(f=>roster.some(a=>a.id===f.id));
    const counts={definite:0,probable:0,maybe:0,notice:0};counts[own]++;roster.forEach(f=>counts[f.status]++);
    return {day,start,end:start+length,own,roster:roster.map(({id,name,status,missed})=>({id,name,status,missed})),standby:sorted.slice(cap).map(f=>f.name),count,counts,
      tier:all?'everyone':count>=Number(settings.minimum)?'minimum':'friend',meetsMinimum:count>=Number(settings.minimum),
      fairScore:roster.reduce((n,f)=>n+f.missed,0),conditional:counts.definite<count,requiredCount:required.length+1};
  }
  function search(availability,people,settings,{cancelled=[],cancelledWindow=null}={}){
    if(settings.scope==='specific'&&!settings.chosen.length)return [];
    const rows=[];const duration=Number(settings.duration);
    for(let day=0;day<7;day++)for(let start=0;start<=48-duration;start++){
      const excluded=cancelledWindow&&day===cancelledWindow.day&&start<cancelledWindow.end&&start+duration>cancelledWindow.start?cancelled:[];
      const r=evaluate(availability,people,settings,day,start,excluded);if(r&&r.count>1)rows.push(r);
    }
    return rows.sort((a,b)=>(settings.fair?b.fairScore-a.fairScore:0)||b.count-a.count||b.counts.definite-a.counts.definite||a.day-b.day||a.start-b.start);
  }
  function distinct(rows,limit=3){const out=[];for(const row of rows){if(out.some(r=>r.day===row.day&&r.start<row.end&&row.start<r.end))continue;out.push(row);if(out.length>=limit)break}return out}
  function visibleAvailability(availability,level,gameName){
    if(level==='none')return [];
    return Object.entries(availability).filter(([key,value])=>validKey(key)&&confidence[value]).map(([key,value])=>level==='exact'?{key,status:value,game:gameName}:{key,status:'available',...(level==='busy'?{}:{activity:'Gaming'})});
  }
  // Peer availability: no organizer, party cap, minimum attendance, or preset duration.
  function overlaps(availability,people,settings){
    const pool=settings.scope==='specific'?people.filter(f=>settings.chosen.includes(f.id)):people;
    if(!pool.length)return [];
    const rows=[];
    for(let day=0;day<7;day++){
      let current=null;
      for(let start=0;start<48;start++){
        const key=day+'-'+start,own=availability[key];
        const valid=confidence[own]&&(settings.tentative||own==='definite');
        const roster=valid?pool.filter(f=>confidence[f.availability[key]]&&(settings.tentative||f.availability[key]==='definite')).map(f=>({id:f.id,name:f.name,status:f.availability[key],missed:f.missed})):[];
        if(!roster.length){current=null;continue}
        const signature=own+'|'+roster.map(f=>f.id+':'+f.status).join('|');
        if(current&&current.signature===signature){current.end=start+1;continue}
        const counts={definite:0,probable:0,maybe:0,notice:0};counts[own]++;roster.forEach(f=>counts[f.status]++);
        current={day,start,end:start+1,own,roster,counts,count:roster.length+1,signature,all:roster.length===pool.length,fairScore:roster.reduce((n,f)=>n+f.missed,0),conditional:counts.definite!==roster.length+1};
        rows.push(current);
      }
    }
    return rows.sort((a,b)=>(settings.fair?b.fairScore-a.fairScore:0)||b.count-a.count||b.counts.definite-a.counts.definite||(b.end-b.start)-(a.end-a.start)||a.day-b.day||a.start-b.start);
  }
  return {confidence,games,modes,migrate,range,demoFriends,statusFor,evaluate,search,distinct,visibleAvailability,overlaps};
})();
if(typeof module!=='undefined')module.exports=NightEngine;
