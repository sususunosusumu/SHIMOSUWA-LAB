'use strict';
const $=id=>document.getElementById(id),fmt=(v,d=0)=>v==null?'—':Number(v).toLocaleString('ja-JP',{minimumFractionDigits:d,maximumFractionDigits:d});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const districts=[['北信','第1通学区（北信）'],['東信','第2通学区（東信）'],['南信','第3通学区（南信）'],['中信','第4通学区（中信）']];
const metrics={quota:['募集人数','人'],applicants:['志願者数','人'],examinees:['受検者数','人'],accepted:['合格者数','人'],enrolled:['年間実入学者数','人'],ratio:['志願倍率','倍'],fill:['年間定員充足率','%']};
const metricDashes={quota:'',applicants:'9 4',examinees:'3 4',accepted:'12 3 3 3',enrolled:'5 3',ratio:'2 3 8 3',fill:'12 3 2 3 2 3'};
const state={districts:new Set(['南信']),schools:new Set(),programs:new Set(),metrics:new Set(['quota','applicants'])};
let data,plans,deviation,programs=new Map(),resultRows=[],targets=[],deviationMap=new Map();
const examYear=admissionYear=>admissionYear-1;
const isProvisional=r=>r.status==='provisional_capacity';
const scoreKey=(school,department)=>school.replace(/ヶ/g,'ケ')+'|'+department;
const sum=(values)=>{const valid=values.filter(v=>v!=null);return valid.length?valid.reduce((a,b)=>a+b,0):null;};
const sortJa=(a,b)=>a.localeCompare(b,'ja');
function schoolCandidates(){return [...new Set(data.records.filter(r=>state.districts.has(r.region)).map(r=>r.school))].sort(sortJa);}
function programCandidates(){return [...programs.values()].filter(p=>state.schools.has(p.school)&&state.districts.has(p.region)).sort((a,b)=>sortJa(a.school,b.school)||sortJa(a.department,b.department));}
function reconcilePrograms(before){const candidates=programCandidates();state.programs=new Set(candidates.filter(p=>state.programs.has(p.program_id)||!before.has(p.program_id)).map(p=>p.program_id));}
function setDistricts(next){const oldSchools=new Set(schoolCandidates()),oldPrograms=new Set(programCandidates().map(p=>p.program_id));state.districts=new Set(next);state.schools=new Set(schoolCandidates().filter(name=>state.schools.has(name)||!oldSchools.has(name)));reconcilePrograms(oldPrograms);}
function setSchools(next){const before=new Set(programCandidates().map(p=>p.program_id));state.schools=new Set([...next].filter(name=>schoolCandidates().includes(name)));reconcilePrograms(before);}
function selectedRows(year,school=null){return data.records.filter(r=>r.year===year&&state.districts.has(r.region)&&state.schools.has(r.school)&&state.programs.has(r.program_id)&&(!school||r.school===school));}
function stageName(){return $('stage').value==='early'?'前期':$('stage').value==='late'?'後期':'前期＋後期';}
function metricLabel(key){const phase=$('stage').value;
 if(key==='quota')return phase==='both'?'年間募集定員':stageName()+' 募集枠';
 if(key==='accepted')return phase==='both'?'最終合格者計（再募集含む）':stageName()+' 合格者数';
 if(key==='ratio')return phase==='both'?'延べ志願者／年間定員（参考）':stageName()+' 志願倍率';
 if(['applicants','examinees'].includes(key))return stageName()+' '+metrics[key][0]+(phase==='both'?'（延べ）':'');
 return metrics[key][0];
}
function value(r,key,phase=$('stage').value){
 if(isProvisional(r)&&key!=='quota')return null;
 if(key==='enrolled')return r.enrolled;
 if(key==='fill')return r.annual_capacity>0&&r.enrolled!=null?r.enrolled/r.annual_capacity*100:null;
 if(key==='quota')return phase==='both'?r.annual_capacity:r[phase].capacity;
 if(key==='ratio'){const n=value(r,'applicants',phase),d=value(r,'quota',phase);return d>0&&n!=null?n/d:null;}
 const field=key==='accepted'?'accepted':key;
 if(phase==='both')return sum([r.early[field],r.late[field],...(key==='accepted'?[r.additional_accepted]:[])]);
 return r[phase][field]??null;
}
function aggregate(rows,key,phase=$('stage').value){
 if(key==='ratio'){const valid=rows.filter(r=>value(r,'quota',phase)>0&&value(r,'applicants',phase)!=null),n=sum(valid.map(r=>value(r,'applicants',phase))),d=sum(valid.map(r=>value(r,'quota',phase)));return d>0&&n!=null?n/d:null;}
 if(key==='fill'){const valid=rows.filter(r=>!isProvisional(r)&&r.enrolled!=null),n=sum(valid.map(r=>r.enrolled)),d=sum(valid.map(r=>r.annual_capacity));return d>0&&n!=null?n/d*100:null;}
 return sum(rows.map(r=>value(r,key,phase)));
}
function renderPickers(){
 $('districtList').innerHTML=districts.map(([id,name])=>`<label><input type="checkbox" data-district="${id}" ${state.districts.has(id)?'checked':''}>${name}</label>`).join('');
 $('districtCount').textContent=`${state.districts.size} / 4学区`;
 const candidates=schoolCandidates(),q=$('schoolQuery').value.trim().replace(/\s/g,'');
 $('schoolList').innerHTML=candidates.filter(name=>name.includes(q)).map(name=>`<label><input type="checkbox" data-school="${esc(name)}" ${state.schools.has(name)?'checked':''}>${esc(name)}</label>`).join('')||'<p class="caption">学校候補がありません。学区・検索条件を確認してください。</p>';
 $('schoolCount').textContent=`${state.schools.size} / ${candidates.length}校を選択`;
 const available=programCandidates();
 $('programList').innerHTML=[...state.schools].sort(sortJa).map(school=>{const ps=available.filter(p=>p.school===school);if(!ps.length)return '';return `<div class="program-group"><strong>${esc(school)}</strong><div class="program-options">`+ps.map(p=>`<label><input type="checkbox" data-program="${esc(p.program_id)}" ${state.programs.has(p.program_id)?'checked':''} aria-label="${esc(p.school+' '+p.department)}">${esc(p.department)}${scoreBadge(p)}</label>`).join('')+'</div></div>';}).join('')||'<p class="caption">学校を選ぶと、その学校の学科が表示されます。</p>';
 $('programCount').textContent=`${state.programs.size} / ${available.length}募集単位を選択`;
 renderMetrics();
}
function scoreBadge(p){const score=deviationMap.get(scoreKey(p.school,p.department));return score?`<small class="score-badge" title="${esc(deviation.provider+'・'+deviation.edition)}">参考偏差値 ${score.value}</small>`:'';}
function renderMetrics(){$('metricList').innerHTML=Object.keys(metrics).map(key=>`<label><input type="checkbox" data-metric="${key}" ${state.metrics.has(key)?'checked':''}>${esc(metricLabel(key))}</label>`).join('');}
function targetColor(i){const first=['#087d79','#c36c31','#4e68bd','#a84d7b','#708d2a','#7d59a0'];return first[i]||`hsl(${(i*137.508)%360} 62% 35%)`;}
function buildResults(){
 if($('groupMode').value==='schools')targets=[...state.schools].sort(sortJa).filter(s=>programCandidates().some(p=>p.school===s&&state.programs.has(p.program_id))).map((name,i)=>({name,school:name,color:targetColor(i)}));
 else targets=[{name:'選択対象の合計',school:null,color:targetColor(0)}];
 resultRows=targets.flatMap(target=>data.years.map(year=>{const rows=selectedRows(year,target.school);return {year,target:target.name,count:rows.length,provisional:rows.some(isProvisional),values:Object.fromEntries([...state.metrics].map(key=>[key,aggregate(rows,key)])),sourceIds:[...new Set(rows.map(r=>r.source_id))]};}));
}
function renderChart(){const keys=[...state.metrics],units=[...new Set(keys.map(key=>metrics[key][1]))];if(units.includes('人')){units.splice(units.indexOf('人'),1);units.unshift('人');}
 const series=targets.flatMap(target=>keys.map((key,mi)=>({name:target.name,key,unit:metrics[key][1],color:target.color,dash:metricDashes[key],values:data.years.map(year=>resultRows.find(r=>r.year===year&&r.target===target.name)?.values[key]??null),provisional:data.years.map(year=>resultRows.find(r=>r.year===year&&r.target===target.name)?.provisional||false)})));
 if(!series.some(s=>s.values.some(v=>v!=null))){$('chart').innerHTML='<div class="chart-empty">学区・学校・学科を選ぶと、ここに年度推移を表示します。<br>未実施の選抜など、記録のない項目は「—」として扱います。</div>';$('legend').innerHTML='';return;}
 const W=Math.max(540,Math.min(1080,$('chart').clientWidth||1080)),H=330,L=75,R=units.length>2?150:units.length>1?85:30,T=35,B=43,right=W-R;
 const maxes=units.map(unit=>Math.max(unit==='%'?100:1,...series.filter(s=>s.unit===unit).flatMap(s=>s.values.filter(v=>v!=null)))*1.1),x=i=>L+i*(right-L)/(data.years.length-1),y=(v,unit)=>H-B-v/maxes[units.indexOf(unit)]*(H-T-B),axisName=i=>i===0?'左軸':i===1?'右軸':'右外軸';
 let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="受験実施年度（入学年の前年）による年度推移。${esc(keys.map(metricLabel).join('・'))}。${units.map((u,i)=>axisName(i)+' '+u).join('、')}。同じ数値を下の表に表示。">`;
 units.forEach((unit,ui)=>{const xx=ui===0?L:right+(ui-1)*70;svg+=`<text x="${xx}" y="16" font-size="14" fill="#172f35">${axisName(ui)}：${unit}</text><line x1="${xx}" x2="${xx}" y1="${T}" y2="${H-B}" stroke="#bdcec4"/>`;for(let i=0;i<5;i++){const v=maxes[ui]*i/4,yy=y(v,unit);if(ui===0)svg+=`<line x1="${L}" x2="${right}" y1="${yy}" y2="${yy}" stroke="#e6ede7"/>`;svg+=`<text x="${xx+(ui===0?-10:10)}" y="${yy+4}" text-anchor="${ui===0?'end':'start'}" font-size="12" fill="#597174">${fmt(v,['倍','%'].includes(unit)?1:0)}</text>`;}});
 data.years.forEach((yr,i)=>svg+=`<text x="${x(i)}" y="${H-23}" text-anchor="middle" font-size="12" fill="#597174">${examYear(yr)}<tspan x="${x(i)}" dy="15">${yr===plans.admission_year?'年度・仮':'年度'}</tspan></text>`);
 const references=[];
 if(keys.includes('ratio'))references.push({unit:'倍',v:1,label:'100%＝1.00倍'});
 if(keys.includes('fill'))references.push({unit:'%',v:100,label:'充足率100%'});
 references.forEach((ref,i)=>{const yy=y(ref.v,ref.unit);svg+=`<line data-reference="${ref.unit}" x1="${L}" x2="${right}" y1="${yy}" y2="${yy}" stroke="#cc3434" stroke-width="2" stroke-dasharray="${i?'3 3':'7 4'}"/><text x="${L+5}" y="${yy-7-i*14}" font-size="12" fill="#b22222">${ref.label}（${axisName(units.indexOf(ref.unit))}）</text>`;});
 series.forEach(s=>{let segment=[];const draw=()=>{if(segment.length)svg+=`<polyline points="${segment.join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-dasharray="${s.dash}"/>`;segment=[];};
 s.values.forEach((v,i)=>{if(v==null){draw();return;}if(s.provisional[i]){draw();if(i>0&&s.values[i-1]!=null)svg+=`<line data-provisional="true" x1="${x(i-1)}" y1="${y(s.values[i-1],s.unit)}" x2="${x(i)}" y2="${y(v,s.unit)}" stroke="${s.color}" stroke-width="2" stroke-dasharray="3 5"/>`;return;}segment.push(`${x(i)},${y(v,s.unit)}`);});draw();
 s.values.forEach((v,i)=>{if(v!=null)svg+=`<circle cx="${x(i)}" cy="${y(v,s.unit)}" r="${s.provisional[i]?4:3}" fill="${s.provisional[i]?'#fff2cf':'white'}" stroke="${s.color}" stroke-width="1.5"><title>${esc(s.name+' / '+metricLabel(s.key))} / ${examYear(data.years[i])}年度実施（${data.years[i]}年春入学）${s.provisional[i]?'・募集枠の仮値':''} ${fmt(v,['倍','%'].includes(s.unit)?2:0)}${s.unit}</title></circle>`;});});svg+='</svg>';
 $('chart').innerHTML=svg;
 $('legend').innerHTML='<div class="legend-section school-legend">'+targets.map(t=>`<span><i style="background:${t.color}"></i>${esc(t.name)}</span>`).join('')+'</div><div class="legend-section">'+keys.map((key,i)=>`<span><svg width="26" height="12" aria-hidden="true"><line x1="0" x2="26" y1="6" y2="6" stroke="#26494a" stroke-width="2.5" stroke-dasharray="${metricDashes[key]}"/></svg>${esc(metricLabel(key))}（${axisName(units.indexOf(metrics[key][1]))}）</span>`).join('')+'</div><p class="caption">点線でつないだ2026年度の募集枠は仮値です。志願・合格・実入学者は未実施のため空欄にしています。</p>';
}
function renderTable(){const keys=[...state.metrics];$('tableCaption').textContent=`2020〜2026年度実施（2021〜2027年春入学） / ${stageName()} / グラフと同じ対象・集計方法`;
 $('tableHead').innerHTML='<tr><th>受験実施年度</th><th>入学年</th><th>対象</th>'+keys.map(k=>`<th>${esc(metricLabel(k))}<br>（${metrics[k][1]}）</th>`).join('')+'<th>元資料</th></tr>';
 const hasData=resultRows.some(r=>r.count>0);
 $('tableRows').innerHTML=hasData?resultRows.map(row=>`<tr><td>${examYear(row.year)}年度${row.provisional?'<span class="provisional-tag">仮募集枠のみ</span>':''}</td><td>${row.year}年春</td><td>${esc(row.target)}<small>${row.count}募集単位</small></td>`+keys.map(k=>`<td>${fmt(row.values[k],['倍','%'].includes(metrics[k][1])?2:0)}</td>`).join('')+`<td>${row.sourceIds.map(id=>{const source=data.sources.find(s=>s.id===id);return `<a href="${source.url}" target="_blank" rel="noopener" aria-label="${examYear(row.year)}年度実施の公式資料">PDF ↗</a>`;}).join(' ')||'—'}</td></tr>`).join(''):`<tr><td colspan="${keys.length+4}" style="text-align:center">対象を選択してください。</td></tr>`;
 $('download').disabled=!hasData;
}
function renderDeviation(){
 const chosen=programCandidates().filter(p=>state.programs.has(p.program_id));
 const latest=new Map();for(const p of chosen)latest.set(scoreKey(p.school,p.department),p);
 $('deviationMeta').textContent=deviation.provider+' / '+deviation.edition+' / '+deviation.checked_at+'確認。民間の参考値です。年度ごとの値や全体平均にはしません。';
 $('deviationRows').innerHTML=[...latest.values()].map(p=>{const score=deviationMap.get(scoreKey(p.school,p.department));return `<tr><td>${esc(p.school)}</td><td>${esc(p.department)}</td><td>${score?score.value:'—'}</td><td>${score?`<a href="${deviation.source_url}" target="_blank" rel="noopener">掲載元 ↗</a>`:'未収録'}</td></tr>`;}).join('')||'<tr><td colspan="4">対象を選択してください。</td></tr>';
}
function update(){renderPickers();buildResults();renderChart();renderTable();renderDeviation();
 const districtText=districts.filter(([id])=>state.districts.has(id)).map(([,label])=>label).join('・')||'学区未選択';
 $('scope').textContent=`${districtText} / ${state.schools.size}校・${state.programs.size}募集単位 / ${$('groupMode').value==='total'?'全体合計':'学校ごと'} / ${stageName()}`;
 $('explanation').textContent=$('stage').value==='both'?'前期＋後期の志願者・受検者は重複を含む延べ人数です。募集人数は年間定員、最終合格者計は再募集も含みます。実入学者・充足率は年間の値です。':'募集・志願・受検・合格・倍率は'+stageName()+'選抜の値です。実入学者・充足率は選抜区分にかかわらず年間の値です。';
 saveURL();
}
function encodeSelection(p,prefix,candidates,chosen){const omitted=candidates.filter(id=>!chosen.has(id)),included=candidates.filter(id=>chosen.has(id));const exclusion=omitted.length<included.length;p.set(prefix+'Mode',exclusion?'all':'selected');(exclusion?omitted:included).forEach(id=>p.append(prefix,id));}
function decodeSelection(p,prefix,candidates){const ids=new Set(p.getAll(prefix));return new Set(candidates.filter(id=>p.get(prefix+'Mode')==='all'?!ids.has(id):ids.has(id)));}
function serialize(){const p=new URLSearchParams({view:'explorer',districts:[...state.districts].join(','),stage:$('stage').value,group:$('groupMode').value,metrics:[...state.metrics].join(',')});encodeSelection(p,'school',schoolCandidates(),state.schools);encodeSelection(p,'program',programCandidates().map(p=>p.program_id),state.programs);return p;}
function saveURL(){history.replaceState(null,'','#'+serialize());}
function restore(p){
 if(p.get('view')==='explorer'){
  if(p.has('districts'))state.districts=new Set(p.get('districts').split(',').filter(id=>districts.some(([d])=>d===id)));
  state.schools=decodeSelection(p,'school',schoolCandidates());state.programs=decodeSelection(p,'program',programCandidates().map(p=>p.program_id));
  const keys=(p.get('metrics')||'').split(',').filter(k=>metrics[k]);state.metrics=new Set(keys.length?keys.slice(0,7):['quota','applicants']);
  if(['both','early','late'].includes(p.get('stage')))$('stage').value=p.get('stage');if(['total','schools'].includes(p.get('group')))$('groupMode').value=p.get('group');
 }else{
  const ds=p.get('tr')??p.get('region');if(ds!=null)state.districts=new Set(ds?ds.split(',').filter(id=>districts.some(([d])=>d===id)):districts.map(([d])=>d));
  const oldSchools=p.getAll('ts').length?p.getAll('ts'):p.getAll('school');state.schools=new Set(schoolCandidates().filter(s=>!oldSchools.length||oldSchools.includes(s)));
  state.programs=new Set(programCandidates().filter(pr=>!p.get('department')||pr.department===p.get('department')).map(pr=>pr.program_id));
  if(['both','early','late'].includes(p.get('stage')))$('stage').value=p.get('stage');
 }
}
function reset(){state.districts=new Set(['南信']);state.schools=new Set(schoolCandidates());state.programs=new Set(programCandidates().map(p=>p.program_id));state.metrics=new Set(['quota','applicants']);$('stage').value='both';$('groupMode').value='total';$('schoolQuery').value='';$('status').textContent='';update();}
function bulk(action){$('status').textContent='';
 if(action==='district-all')setDistricts(districts.map(([id])=>id));if(action==='district-none')setDistricts([]);
 if(action==='school-all')setSchools(schoolCandidates());if(action==='school-none')setSchools([]);
 if(action==='program-all')state.programs=new Set(programCandidates().map(p=>p.program_id));if(action==='program-none')state.programs.clear();update();
}
function csvText(){const keys=[...state.metrics],head=['受験実施年度','入学年','データ状態','選抜区分','集計方法','対象','募集単位数',...keys.map(k=>metricLabel(k)+'（'+metrics[k][1]+'）'),'出典URL'];
 const rows=resultRows.map(row=>[examYear(row.year),row.year,row.provisional?'募集枠の仮値':'実績',stageName(),$('groupMode').value==='total'?'全体合計':'学校ごと',row.target,row.count,...keys.map(k=>row.values[k]),row.sourceIds.map(id=>data.sources.find(s=>s.id===id).url).join(' ')]);
 return '\uFEFF'+[head,...rows].map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
}
function download(){const url=URL.createObjectURL(new Blob([csvText()],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='nagano-admissions-trend.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function indexData(){
 programs.clear();
 for(const r of data.records){if(r.school==='伊那弥生ヶ丘'){r.source_school=r.school;r.source_program_id=r.program_id;r.school='伊那弥生ケ丘';r.program_id=r.program_id.replace('伊那弥生ヶ丘|','伊那弥生ケ丘|');}programs.set(r.program_id,{program_id:r.program_id,school:r.school,department:r.department,region:r.region});}
}
async function init(){try{const responses=await Promise.all(['admissions.json','current-capacity.json','deviation-latest.json'].map(file=>fetch('data/'+file)));if(responses.some(r=>!r.ok))throw Error('Data load');[data,plans,deviation]=await Promise.all(responses.map(r=>r.json()));data.records.push(...plans.records);data.sources.push(...plans.sources);data.years=[...new Set([...data.years,plans.admission_year])].sort();for(const score of deviation.records)deviationMap.set(scoreKey(score.school,score.department),score);indexData();
 state.schools=new Set(schoolCandidates());state.programs=new Set(programCandidates().map(p=>p.program_id));restore(new URLSearchParams(location.hash.slice(1)));
 $('sourceList').innerHTML=data.sources.map(s=>`<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.title)} ↗</a></li>`).join('');
 $('districtList').onchange=e=>{const id=e.target.dataset.district;if(!id)return;const next=new Set(state.districts);if(e.target.checked)next.add(id);else next.delete(id);setDistricts(next);update();};
 $('schoolList').onchange=e=>{const id=e.target.dataset.school;if(!id)return;const next=new Set(state.schools);if(e.target.checked)next.add(id);else next.delete(id);setSchools(next);update();};
 $('programList').onchange=e=>{const id=e.target.dataset.program;if(!id)return;if(e.target.checked)state.programs.add(id);else state.programs.delete(id);update();};
 $('metricList').onchange=e=>{const id=e.target.dataset.metric;if(!id)return;$('status').textContent='';if(!e.target.checked&&state.metrics.size===1){$('status').textContent='表示する数字を1つ以上選んでください。';renderMetrics();return;}if(e.target.checked)state.metrics.add(id);else state.metrics.delete(id);update();};
 document.querySelectorAll('[data-bulk]').forEach(button=>button.onclick=()=>bulk(button.dataset.bulk));$('allMetrics').onclick=()=>{state.metrics=new Set(Object.keys(metrics));$('status').textContent='';update();};$('schoolQuery').oninput=renderPickers;$('stage').onchange=update;$('groupMode').onchange=update;$('reset').onclick=reset;$('download').onclick=download;window.addEventListener('resize',renderChart);update();
 }catch(e){$('error').textContent='データを読み込めませんでした。再読み込みしてください。ローカルではHTTPサーバーで開いてください。';console.error(e);}}
init();
