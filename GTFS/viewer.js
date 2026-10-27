'use strict';
const GTFS_ZIP='shimosuwa_azami_swan_merged_gtfs_v6.zip';
let map,data={},markers=[],currentFilter='both',selectedStop=null,tripLine=null;
const el=id=>document.getElementById(id);
function csvParse(text){const rows=[];let row=[],cur='',q=false;for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'){if(q&&n==='"'){cur+='"';i++;}else q=!q;}else if(c===','&&!q){row.push(cur);cur='';}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&n==='\n')i++;row.push(cur);if(row.some(x=>x!==''))rows.push(row);row=[];cur='';}else cur+=c;}if(cur!==''||row.length){row.push(cur);rows.push(row);}const head=rows.shift().map(h=>h.replace(/^\uFEFF/,''));return rows.map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]??''])));}
function timeKey(v){return v?v.split(':').reduce((n,x,i)=>n+Number(x)*[3600,60,1][i],0):999999;}
function stopSystem(s){return s.stop_id.startsWith('AZAMI_')?'azami':'swan';}
function validStop(s){return (String(s.location_source||'').startsWith('real_json')||s.location_source==='user_google_maps_20261027')&&s.stop_lat&&s.stop_lon&&Number.isFinite(+s.stop_lat)&&Number.isFinite(+s.stop_lon);}
function clearTripLine(){if(tripLine){map.removeLayer(tripLine);tripLine=null;}}
function running(trip){return BusCalendar.active(trip,el('travelDate').value,data.calendar,data.exceptions);}
function routeMatches(trip){return !el('routeFilter').value||trip.route_id===el('routeFilter').value;}
async function load(){
 map=L.map('map').setView([36.075,138.092],13);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
 const res=await fetch(GTFS_ZIP,{cache:'no-store'});if(!res.ok)throw Error('時刻表データを取得できませんでした。');
 const zip=await JSZip.loadAsync(await res.arrayBuffer());
 async function read(n){const f=zip.file(n);return f?csvParse(await f.async('string')):[];}
 [data.stops,data.routes,data.trips,data.times,data.calendar,data.exceptions]=await Promise.all(['stops.txt','routes.txt','trips.txt','stop_times.txt','calendar.txt','calendar_dates.txt'].map(read));
 data.stopById=Object.fromEntries(data.stops.map(x=>[x.stop_id,x]));data.tripById=Object.fromEntries(data.trips.map(x=>[x.trip_id,x]));data.routeById=Object.fromEntries(data.routes.map(x=>[x.route_id,x]));data.timesByStop={};data.timesByTrip={};
 for(const t of data.times){(data.timesByStop[t.stop_id]??=[]).push(t);(data.timesByTrip[t.trip_id]??=[]).push(t);}
 Object.values(data.timesByTrip).forEach(a=>a.sort((x,y)=>+x.stop_sequence-+y.stop_sequence));
 for(const r of data.routes){const o=document.createElement('option');o.value=r.route_id;o.textContent=r.route_long_name||r.route_short_name;el('routeFilter').append(o);}
 map.fitBounds([[36.056,138.076],[36.103,138.112]],{padding:[20,20]});renderMarkers();
}
function renderMarkers(){
 if(!data.stops)return;
 markers.forEach(m=>map.removeLayer(m));markers=[];clearTripLine();selectedStop=null;el('tripCard').hidden=true;el('departures').replaceChildren();
 const q=el('search').value.trim();
 const shown=data.stops.filter(s=>currentFilter==='both'||stopSystem(s)===currentFilter).filter(s=>!q||s.stop_name.includes(q)).filter(s=>(data.timesByStop[s.stop_id]||[]).some(t=>routeMatches(data.tripById[t.trip_id])));
 const box=el('stopList');box.replaceChildren();
 for(const s of shown){
  const button=document.createElement('button');button.className='stop-choice';button.textContent=s.stop_name+'（'+(stopSystem(s)==='azami'?(validStop(s)?'あざみ号・提供座標':'あざみ号・位置確認中'):'スワンバス')+'）';button.onclick=()=>selectStop(s);box.append(button);
  if(!validStop(s))continue;
  const icon=L.divIcon({className:'',html:`<div style="width:18px;height:18px;border-radius:50%;background:${stopSystem(s)==='azami'?'#2563eb':'#059669'};border:2px solid white"></div>`,iconSize:[18,18],iconAnchor:[9,9]});
  const marker=L.marker([+s.stop_lat,+s.stop_lon],{icon,title:s.stop_name,alt:s.stop_name}).addTo(map).bindTooltip(s.stop_name+(stopSystem(s)==='azami'?'（利用者提供のGoogle Maps座標）':''));marker.on('click',()=>selectStop(s));markers.push(marker);
 }
 el('selectedTitle').textContent=`停留所：${shown.length}件（地図表示 ${markers.length}件）`;
 el('summary').textContent='一覧または地図から停留所を選択してください。';
 if(q&&markers.length)map.fitBounds(L.featureGroup(markers).getBounds().pad(0.2));
}
function selectStop(s){
 selectedStop=s;clearTripLine();el('tripCard').hidden=true;
 el('selectedTitle').textContent=s.stop_name+'（'+(stopSystem(s)==='azami'?'あざみ号':'スワンバス')+'）';
 const list=(data.timesByStop[s.stop_id]||[]).filter(t=>t.pickup_type!=='1'&&running(data.tripById[t.trip_id])&&routeMatches(data.tripById[t.trip_id])).sort((a,b)=>timeKey(a.departure_time)-timeKey(b.departure_time));
 el('summary').textContent=el('travelDate').value+` の発車 ${list.length}件。時刻を選ぶと全行程を表示します。`;
 const box=el('departures');box.replaceChildren();
 if(!list.length)box.textContent='この日の運行便はありません。収録期間は2026年10月20日〜2027年3月31日です。';
 for(const t of list){const trip=data.tripById[t.trip_id];const b=document.createElement('button');b.textContent=t.departure_time.slice(0,5)+' '+trip.trip_headsign+' ／ '+BusCalendar.label(trip.service_id);b.onclick=()=>showTrip(t.trip_id);box.append(b);}
}
function showTrip(id){
 const trip=data.tripById[id],arr=data.timesByTrip[id]||[];el('tripCard').hidden=false;
 el('tripTitle').textContent=trip.trip_headsign+' ／ '+BusCalendar.label(trip.service_id);
 const box=el('tripStops');box.replaceChildren();const points=[];
 for(const t of arr){const s=data.stopById[t.stop_id];const row=document.createElement('div');row.className='stopline';row.textContent=t.departure_time.slice(0,5)+'　'+s.stop_name+(t.pickup_type==='1'?'（到着・降車のみ）':'');box.append(row);if(validStop(s))points.push([+s.stop_lat,+s.stop_lon]);}
 clearTripLine();
 if(!trip.route_id.startsWith('AZAMI_')&&points.length>=2){tripLine=L.polyline(points,{color:'#111827',weight:4,opacity:.65}).addTo(map);map.fitBounds(tripLine.getBounds().pad(0.2));}
 if(trip.route_id.startsWith('AZAMI_')){const p=document.createElement('p');p.className='small';p.textContent='運行経路はPDF路線図でご確認ください。提供座標の停留所は地図に表示しています。未確認の道路形状や停留所座標は描いていません。';box.append(p);}
}
el('travelDate').value=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date());
el('travelDate').addEventListener('change',()=>selectedStop?selectStop(selectedStop):renderMarkers());
el('routeFilter').addEventListener('change',renderMarkers);el('search').addEventListener('input',renderMarkers);
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');currentFilter=b.dataset.filter;el('routeFilter').value='';renderMarkers();});
load().catch(e=>{el('summary').textContent=e.message;console.error(e);});
