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
 function select(data,state){const ids=active(data,state.date,state.service);return data.trains.filter(t=>ids.has(t.service)&&(state.direction==='both'||t.direction===state.direction)&&state.kinds.includes(kind(t)));}
 function stationEvents(trains,station,start,end){return trains.flatMap(t=>t.stops.filter(s=>s[0]===station).map(s=>({train:t,stop:s,minute:minutes(s[2]||s[1])}))).filter(e=>e.minute!==null&&e.minute>=start&&e.minute<=end).sort((a,b)=>a.minute-b.minute);}
 return {order,branch,colors,minutes,time,kind,via,color,routeLabel,active,stations,select,stationEvents};
})();
if(typeof module!=='undefined')module.exports=RailModel;
