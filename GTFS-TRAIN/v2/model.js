'use strict';
const RailModel = (() => {
 const order=['松本','南松本','平田','村井','広丘','塩尻','みどり湖','岡谷','下諏訪','上諏訪','茅野','青柳','すずらんの里','富士見','信濃境','小淵沢'];
 const branch=['小野','信濃川島','辰野','川岸'];
 const colors={local:'#167166',azusa:'#704ab2',freight:'#af571b',other:'#416b99'};
 function minutes(t){if(!/^\d{2,}:\d{2}(:\d{2})?$/.test(t||''))return null;const [h,m,s=0]=t.split(':').map(Number);return m<60&&s<60?h*60+m+s/60:null;}
 function time(m){if(m===null||!Number.isFinite(m))return '未収録';return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(Math.floor(m%60)).padStart(2,'0')}`;}
 function kind(t){if(t.kind && colors[t.kind])return t.kind;if(/貨物/.test(t.name))return 'freight';if(/あずさ/.test(t.name))return 'azusa';if(t.name==='普通')return 'local';return 'other';}
 function via(t){return t.stops.some(s=>branch.includes(s[0]))?'tatsuno':t.stops.some(s=>s[0]==='みどり湖')?'midori':'unknown';}
 function color(t){return via(t)==='tatsuno'?(kind(t)==='azusa'?'#af287a':kind(t)==='local'?'#007e9a':colors[kind(t)]):colors[kind(t)];}
 function routeLabel(t){return via(t)==='tatsuno'?'辰野経由':via(t)==='midori'?'みどり湖経由':'経由未確認';}
 function active(data,date,override='auto'){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return new Set();
  const ymd=date.replaceAll('-',''),day=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date(date+'T12:00:00+09:00').getUTCDay()];
  const ids=new Set(data.calendar.filter(c=>ymd>=c.start_date&&ymd<=c.end_date&&(override==='auto'?c[day]==='1':c.service_id===override)).map(c=>c.service_id));
  if(override==='auto') for(const e of data.exceptions){if(e.date===ymd){if(e.exception_type==='1')ids.add(e.service_id);else if(e.exception_type==='2')ids.delete(e.service_id);}}
  return ids;
 }
 function stations(range,route){let list=[...order];if(route==='tatsuno')list.splice(6,1,...branch);if(route==='both')list.splice(7,0,...branch);const bounds={suwa:['岡谷','茅野'],wide:['塩尻','富士見'],full:['松本','小淵沢']}[range];return list.slice(list.indexOf(bounds[0]),list.indexOf(bounds[1])+1);}
 function temporary(t){if(typeof t.temporary==='boolean')return t.temporary;return /^[89]\d{3}[A-Z]*$/.test(t.number||'');}
 function select(data,state){const ids=active(data,state.date,state.service);return data.trains.filter(t=>ids.has(t.service)&&(state.direction==='both'||t.direction===state.direction)&&kind(t)!=='freight'&&state.kinds.includes(kind(t))&&(state.includeTemporary!==false||!temporary(t)));}
 function stationEvents(trains,station,start,end){return trains.flatMap(t=>t.stops.filter(s=>s[0]===station).map(s=>({train:t,stop:s,minute:minutes(s[2]||s[1])}))).filter(e=>e.minute!==null&&e.minute>=start&&e.minute<=end).sort((a,b)=>a.minute-b.minute);}
 function connections(trains,origin,destination,start,end,minWait=5){
  if(origin===destination)return [];const results=[],seen=new Set();
  function add(legs){const key=legs.map(l=>l.train.id+':'+l.from+':'+l.to).join('|');if(seen.has(key))return;seen.add(key);results.push({legs,departure:legs[0].departure,arrival:legs.at(-1).arrival,wait:legs.length===2?legs[1].departure-legs[0].arrival:0});}
  for(const t of trains){const oi=t.stops.findIndex(s=>s[0]===origin);if(oi<0)continue;const dep=minutes(t.stops[oi][2]||t.stops[oi][1]);if(dep===null||dep<start||dep>end)continue;const di=t.stops.findIndex((s,i)=>i>oi&&s[0]===destination);if(di>=0){add([{train:t,from:oi,to:di,departure:dep,arrival:minutes(t.stops[di][1]||t.stops[di][2])}]);continue;}
   for(let ti=oi+1;ti<t.stops.length;ti++){const transfer=t.stops[ti][0],arr=minutes(t.stops[ti][1]||t.stops[ti][2]);if(arr===null)continue;
    for(const u of trains){if(u.id===t.id||u.number===t.number||u.direction!==t.direction)continue;const ui=u.stops.findIndex(s=>s[0]===transfer);if(ui<0)continue;const ud=u.stops.findIndex((s,i)=>i>ui&&s[0]===destination);if(ud<0)continue;const next=minutes(u.stops[ui][2]||u.stops[ui][1]);if(next===null||next<arr+minWait||next>arr+120)continue;
     const path=t.stops.slice(oi,ti+1).map(s=>s[0]);if(u.stops.slice(ui+1,ud+1).some(s=>path.includes(s[0])))continue;
     add([{train:t,from:oi,to:ti,departure:dep,arrival:arr},{train:u,from:ui,to:ud,departure:next,arrival:minutes(u.stops[ud][1]||u.stops[ud][2])}]);
    }
   }
  }
  return results.filter(r=>r.arrival!==null&&r.arrival>=r.departure).sort((a,b)=>a.departure-b.departure||a.arrival-b.arrival||a.legs.length-b.legs.length).slice(0,30);
 }
 return {order,branch,colors,minutes,time,kind,via,color,routeLabel,connections,active,stations,temporary,select,stationEvents};
})();
if(typeof module!=='undefined')module.exports=RailModel;
