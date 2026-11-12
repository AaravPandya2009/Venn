/* Recurring local-time demo schedules, in half-hour indexes. */
const VennPlanner = (() => {
  const makeSlots = ranges => new Set(ranges.flatMap(([day,start,end]) => Array.from({length:end-start},(_,i)=>`${day}-${start+i}`)));
  const friends = [
    {id:'alex',name:'Alex',ranges:[[0,36,44],[2,37,44],[4,36,46],[5,28,40]]},
    {id:'maya',name:'Maya',ranges:[[1,38,44],[2,38,43],[4,38,45],[5,30,42]]},
    {id:'jordan',name:'Jordan',ranges:[[0,40,46],[3,38,44],[4,40,47],[5,32,40]]},
    {id:'sam',name:'Sam',ranges:[[2,36,42],[4,39,44],[5,34,44],[6,28,36]]},
    {id:'riley',name:'Riley',ranges:[[0,12,16],[1,12,16],[3,12,16],[6,14,20]]}
  ].map(f=>({...f,slots:makeSlots(f.ranges)}));
  function migrate(data){
    const valid=(Array.isArray(data.slots)?data.slots:[]).filter(s=>typeof s==='string'&&/^[0-6]-\d+$/.test(s)&&Number(s.split('-')[1])<(data.version===2?48:24));
    return new Set(data.version===2?valid:valid.flatMap(s=>{const [d,h]=s.split('-').map(Number);return [`${d}-${h*2}`,`${d}-${h*2+1}`]}));
  }
  function findWindows(available,mode,chosen=[],people=friends){
    const wanted=people.filter(f=>chosen.includes(f.id));
    if(mode==='specific'&&!wanted.length)return [];
    const windows=[];
    for(let day=0;day<7;day++){
      let current=null;
      for(let slot=0;slot<48;slot++){
        const key=`${day}-${slot}`,online=people.filter(f=>f.slots.has(key));
        const eligible=available.has(key)&&online.length>0&&(mode!=='specific'||wanted.every(f=>f.slots.has(key)));
        const signature=online.map(f=>f.id).join(',');
        if(eligible&&current&&current.end===slot&&current.signature===signature)current.end=slot+1;
        else {current=eligible?{day,start:slot,end:slot+1,online:online.map(f=>f.id),signature}:null;if(current)windows.push(current)}
      }
    }
    return windows.sort((a,b)=>b.online.length-a.online.length||(b.end-b.start)-(a.end-a.start)||a.day-b.day||a.start-b.start);
  }
  return {friends,makeSlots,migrate,findWindows};
})();
if(typeof module!=='undefined')module.exports=VennPlanner;
