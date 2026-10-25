'use strict';
const $=id=>document.getElementById(id);
const fmt=(v,d=0)=>v==null?'—':Number(v).toLocaleString('ja-JP',{minimumFractionDigits:d,maximumFractionDigits:d});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors=['#087d79','#c36c31','#4e68bd','#a84d7b','#708d2a','#7d59a0'];
const metrics={applicants:['志願者数','人'],capacity:['募集枠','人'],examinees:['受検者数','人'],accepted:['合格者数','人'],annual_capacity:['年間募集定員','人'],annual_accepted:['合格者計（前期・後期・再募集）','人'],enrolled:['年間実入学者数','人'],ratio:['志願倍率','倍'],fill:['年間定員充足率','%'],under:['年間定員割れ募集単位数','件']};
let data,selected=new Set(),schools=new Set(),visible=[];
const sum=(rs,fn)=>{const vs=rs.map(fn).filter(v=>v!=null);return vs.length?vs.reduce((a,b)=>a+b,0):null;};
function value(r,key,stage=$('stage').value){const s=r[stage];if(key==='annual_capacity')return r.annual_capacity;if(key==='annual_accepted')return (r.early.accepted??0)+(r.late.accepted??0)+(r.additional_accepted??0);if(key==='enrolled')return r.enrolled;if(key==='fill')return r.annual_capacity>0&&r.enrolled!=null?r.enrolled/r.annual_capacity*100:null;if(key==='under')return r.enrolled==null?null:Number(r.enrolled<r.annual_capacity);if(key==='ratio')return s.capacity>0&&s.applicants!=null?s.applicants/s.capacity:null;return s[key]??null;}
function aggregate(rs,key){if(key==='ratio'){const eligible=rs.filter(r=>value(r,'capacity')>0&&value(r,'applicants')!=null),cap=sum(eligible,r=>value(r,'capacity')),app=sum(eligible,r=>value(r,'applicants'));return cap>0&&app!=null?app/cap:null;}if(key==='fill'){const eligible=rs.filter(r=>r.enrolled!=null),cap=sum(eligible,r=>r.annual_capacity),n=sum(eligible,r=>r.enrolled);return cap>0&&n!=null?n/cap*100:null;}return sum(rs,r=>value(r,key));}
function matches(r){return (!schools.size?(!$('region').value||r.region===$('region').value):schools.has(r.school))&&(!$('department').value||r.department===$('department').value)&&r.school.includes($('query').value.trim().replace(/\s/g,''));}
function baseRows(year){return data.records.filter(r=>r.year===year&&matches(r)&&(!$('underOnly').checked||value(r,'under')===1));}
function previous(r){return data.records.find(x=>x.year===r.year-1&&x.program_id===r.program_id);}
function delta(r,key){const prev=previous(r);if(!prev)return null;const a=key==='capacityDelta'?r.annual_capacity:value(r,'applicants'),b=key==='capacityDelta'?prev.annual_capacity:value(prev,'applicants');return a!=null&&b!=null?a-b:null;}
function sortValue(r,key){if(key==='school')return r.school;if(key.endsWith('Delta'))return delta(r,key);if(key==='shortage')return r.enrolled==null?null:Math.max(0,r.annual_capacity-r.enrolled);return value(r,key);}
function yearLabel(y){return `${y}年度（令和${y-2018}年度・${y}年4月入学）`;}
function stageLabel(){return $('stage').value==='early'?'前期':'後期';}
function labelMetric(k){return ['capacity','applicants','examinees','accepted','ratio'].includes(k)?`${stageLabel()} ${metrics[k][0]}`:metrics[k][0];}
function metricKeys(){return ['metric','metric2','metric3'].map(id=>$(id).value).filter((k,i,a)=>k&&a.indexOf(k)===i);}
function schoolPicker(){const region=$('schoolRegion').value,y=+$('year').value;
 const names=[...new Set(data.records.filter(r=>r.year===y&&(!region||r.region===region)).map(r=>r.school))].sort((a,b)=>a.localeCompare(b,'ja'));
 $('schoolList').innerHTML=names.map(name=>`<label><input type="checkbox" data-school="${esc(name)}" ${schools.has(name)?'checked':''}>${esc(name)}</label>`).join('');
 $('schoolChips').innerHTML=[...schools].map(name=>`<button data-school-remove="${esc(name)}">${esc(name)} ×</button>`).join('');
}
function update(){const year=+$('year').value,rs=baseRows(year);$('compareYear').value=String(year);$('compareStage').value=$('stage').value;
 $('scope').textContent=`${yearLabel(year)} / ${schools.size?`${schools.size}校を選択中`:$('region').value||'県内すべて'} / グラフ・ランキング：${stageLabel()}選抜 / ${rs.length}募集単位`;
 $('chartContext').textContent=`対象：2021〜2026年4月入学 / 選抜指標：${stageLabel()}選抜 / 年間指標：前期・後期共通の年間実績`;
 const stats=[[`${stageLabel()} 募集枠`,aggregate(rs,'capacity'),'人'],[`${stageLabel()} 志願者数`,aggregate(rs,'applicants'),'人'],[`${stageLabel()} 志願倍率`,aggregate(rs,'ratio'),'倍'],['年間実入学者数（5月1日）',aggregate(rs,'enrolled'),'人']];
 $('kpis').innerHTML=stats.map(([label,v,unit])=>`<div class="kpi"><span>${label}</span><strong>${fmt(v,unit==='倍'?2:0)}<small>${unit}</small></strong></div>`).join('');
 const key=$('sort').value;visible=(schools.size?rs:[]).sort((a,b)=>{const av=sortValue(a,key),bv=sortValue(b,key);if(av==null)return bv==null?0:1;if(bv==null)return -1;return key==='school'?av.localeCompare(bv,'ja'):($('direction').value==='asc'?av-bv:bv-av)||a.program_id.localeCompare(b.program_id,'ja');});
 $('rowCount').textContent=`選択 ${schools.size}校 / 表示 ${visible.length}学科・募集単位 / 学科比較 ${selected.size}件`;
 renderTable();schoolPicker();
 $('chips').innerHTML=[...selected].map(id=>{const r=data.records.find(r=>r.program_id===id);return `<button data-remove="${esc(id)}">${esc(r.school+' / '+r.department)} ×</button>`;}).join('');
 renderChart();saveURL();
}
function renderTable(){const year=+$('year').value,mode=$('tableMode').value,stages=mode==='both'?['early','late']:[mode],names={early:'前期選抜',late:'後期選抜'};
 $('tableContext').textContent=`${yearLabel(year)} ｜ ${mode==='both'?'前期・後期を別々に表示':names[mode]+'のみ'}`;
 $('tableAsOf').textContent=`選抜結果：公表済み ／ 実入学者数：${year}年5月1日現在 ／ 要覧収録済み実績（2027年度は未収録）`;
 $('tableCaption').textContent=`${year}年度入学の比較表。前期・後期の人数は合算していません。`;
 const top='<tr><th rowspan="2">学科比較</th><th rowspan="2">学校 / 学科</th><th rowspan="2">年間定員</th>'+stages.map(s=>`<th colspan="5" class="stage-group ${s}">${names[s]} のみ（人・倍）</th>`).join('')+'<th colspan="3">年間実績</th><th rowspan="2">年間定員<br>前年比</th><th rowspan="2">'+stageLabel()+'志願者<br>前年比</th><th rowspan="2">出典</th></tr>';
 $('tableHead').innerHTML=top+'<tr>'+stages.map(()=>'<th>募集枠</th><th>志願者</th><th>受検者</th><th>合格者</th><th>志願倍率</th>').join('')+'<th>合格者計※</th><th>実入学者</th><th>充足率</th></tr>';
 const dtext=v=>v==null?'—':`${v>0?'+':''}${fmt(v)}`;
 $('rows').innerHTML=visible.map(r=>{const source=data.sources.find(s=>s.id===r.source_id);return `<tr><td><input type="checkbox" data-id="${esc(r.program_id)}" ${selected.has(r.program_id)?'checked':''} aria-label="${esc(r.school+' '+r.department)}を比較"></td><td class="program"><strong>${esc(r.school)}</strong><span>${esc(r.department)}</span></td><td class="annual">${fmt(r.annual_capacity)}</td>`+stages.map(s=>`<td>${fmt(r[s].capacity)}</td><td>${fmt(r[s].applicants)}</td><td>${fmt(r[s].examinees)}</td><td>${fmt(r[s].accepted)}</td><td>${fmt(value(r,'ratio',s),2)}</td>`).join('')+`<td>${fmt(value(r,'annual_accepted'))}</td><td>${fmt(r.enrolled)}</td><td><span class="${value(r,'under')===1?'low':''}">${r.enrolled==null?'—':fmt(value(r,'fill'),1)+'%'}</span></td><td>${dtext(delta(r,'capacityDelta'))}</td><td>${dtext(delta(r,'applicantDelta'))}</td><td><a href="${source.url}#page=${r.source_page}" target="_blank" rel="noopener" aria-label="${esc(r.school)}の公式資料 ${r.source_page}ページ">PDF ↗</a></td></tr>`;}).join('')+(!visible.length?`<tr><td colspan="${9+stages.length*5}" class="empty">${schools.size?'条件に該当する学科がありません。年度・学科・検索条件を確認してください。':'上の地域から、比較したい学校を選んでください。'}</td></tr>`:'');
 $('download').disabled=!visible.length;
}
function renderChart(){const keys=metricKeys(),units=[...new Set(keys.map(k=>metrics[k][1]))];if(units.includes('人')){units.splice(units.indexOf('人'),1);units.unshift('人');}
 let targets;
 if(selected.size)targets=[...selected].map(id=>{const r=data.records.find(x=>x.program_id===id);return {name:r.school+' / '+r.department,rows:y=>data.records.filter(x=>x.year===y&&x.program_id===id)};});
 else if(schools.size)targets=[...schools].map(name=>({name,rows:y=>baseRows(y).filter(r=>r.school===name)}));
 else targets=[{name:($('region').value||'県内')+'の合計（学校未選択）',rows:baseRows}];
 const series=targets.flatMap((t,ti)=>keys.map((k,ki)=>({name:t.name,key:k,unit:metrics[k][1],color:colors[ti],dash:['','8 4','2 4'][ki],values:data.years.map(y=>aggregate(t.rows(y),k))})));
 const W=1040,H=320,L=75,R=units.length>2?150:units.length>1?80:25,T=36,B=45,plotRight=W-R;
 const maxes=units.map(u=>Math.max(1,...series.filter(s=>s.unit===u).flatMap(s=>s.values.filter(v=>v!=null)))*1.1);
 const x=i=>L+i*(plotRight-L)/(data.years.length-1),y=(v,u)=>H-B-v/maxes[units.indexOf(u)]*(H-T-B);
 const axisName=i=>i===0?'左軸':i===1?'右軸':'右外軸';
 let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(keys.map(labelMetric).join('・'))}の年度推移。${units.map((u,i)=>axisName(i)+' '+u).join('、')}。数値表は直後。">`;
 units.forEach((u,ui)=>{const xx=ui===0?L:plotRight+(ui-1)*70,anchor=ui===0?'end':'start';svg+=`<text x="${xx}" y="15" text-anchor="${ui===0?'start':anchor}" font-size="15" fill="#172f35">${axisName(ui)}：${u}</text><line x1="${xx}" y1="${T}" x2="${xx}" y2="${H-B}" stroke="#b7ccc4"/>`;
 for(let i=0;i<5;i++){const v=maxes[ui]*i/4,yy=y(v,u);if(ui===0)svg+=`<line x1="${L}" y1="${yy}" x2="${plotRight}" y2="${yy}" stroke="#e5ece7"/>`;svg+=`<text x="${xx+(ui===0?-10:10)}" y="${yy+4}" text-anchor="${anchor}" font-size="14" fill="#597174">${fmt(v,['倍','%'].includes(u)?1:0)}</text>`;}});
 data.years.forEach((yr,i)=>svg+=`<text x="${x(i)}" y="${H-15}" text-anchor="middle" font-size="15" fill="#597174">${yr}</text>`);
 series.forEach(s=>{let segment=[];const draw=()=>{if(segment.length)svg+=`<polyline points="${segment.join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-dasharray="${s.dash}"/>`;segment=[];};s.values.forEach((v,i)=>{if(v==null){draw();return;}segment.push(`${x(i)},${y(v,s.unit)}`);});draw();s.values.forEach((v,i)=>{if(v!=null)svg+=`<circle cx="${x(i)}" cy="${y(v,s.unit)}" r="3" fill="white" stroke="${s.color}" stroke-width="1.5"><title>${esc(s.name)} / ${esc(labelMetric(s.key))} / ${data.years[i]}年度 ${fmt(v,['倍','%'].includes(s.unit)?2:0)}${s.unit}</title></circle>`;});});svg+='</svg>';
 $('chart').innerHTML=svg;
 $('legend').innerHTML=series.map(s=>`<span><svg width="27" height="12" aria-hidden="true"><line x1="0" x2="27" y1="6" y2="6" stroke="${s.color}" stroke-width="3" stroke-dasharray="${s.dash}"/></svg> ${esc(s.name)} · ${esc(labelMetric(s.key))}（${axisName(units.indexOf(s.unit))}・${s.unit}）</span>`).join('');
 $('trendTable').innerHTML=`<table><thead><tr><th>対象 / 指標 / 軸</th>${data.years.map(y=>`<th>${y}年度</th>`).join('')}</tr></thead><tbody>${series.map(s=>`<tr><td>${esc(s.name+' / '+labelMetric(s.key)+' / '+axisName(units.indexOf(s.unit)))}</td>${s.values.map(v=>`<td>${fmt(v,['倍','%'].includes(s.unit)?2:0)}${v==null?'':s.unit}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function saveURL(){const p=new URLSearchParams();['year','region','stage','query','department','metric','metric2','metric3','sort','direction','tableMode','schoolRegion'].forEach(k=>{if($(k).value)p.set(k,$(k).value);});if($('underOnly').checked)p.set('under','1');schools.forEach(s=>p.append('school',s));selected.forEach(id=>p.append('compare',id));history.replaceState(null,'','#'+p);}
function download(){const fields=['入学年度','実入学者基準日','地域','学校','学科','年間定員',...['前期','後期'].flatMap(s=>['募集枠','志願者','受検者','合格者','志願倍率'].map(k=>s+k)),'合格者計（前期後期再募集）','年間実入学者','年間充足率%','出典URL','ページ'];
 const rows=visible.map(r=>[r.year,`${r.year}-05-01`,r.region,r.school,r.department,r.annual_capacity,...['early','late'].flatMap(s=>[r[s].capacity,r[s].applicants,r[s].examinees,r[s].accepted,value(r,'ratio',s)]),value(r,'annual_accepted'),r.enrolled,value(r,'fill'),data.sources.find(x=>x.id===r.source_id).url,r.source_page]);
 const csv='\uFEFF'+[fields,...rows].map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`nagano-${$('year').value}-early-late.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function changeSchools(name,checked){$('selectionStatus').textContent='';if(checked&&schools.size>=6){$('selectionStatus').textContent='学校は最大6校です。選択を外して追加してください。';schoolPicker();return;}if(checked)schools.add(name);else schools.delete(name);selected=new Set([...selected].filter(id=>data.records.some(r=>r.program_id===id&&schools.has(r.school))));update();}
async function init(){try{const response=await fetch('data/admissions.json');if(!response.ok)throw Error(response.status);data=await response.json();
 const options=[...data.years].reverse().map(y=>`<option value="${y}">${yearLabel(y)}</option>`).join('');$('year').innerHTML=options;$('compareYear').innerHTML=options;
 ['metric','metric2','metric3'].forEach((id,i)=>{$(id).innerHTML=(i?'<option value="">表示しない</option>':'')+Object.entries(metrics).map(([k,[name,unit]])=>`<option value="${k}">${esc(name)}（${unit}）</option>`).join('');});$('metric').value='capacity';$('metric2').value='applicants';$('metric3').value='ratio';
 const departments=[...new Set(data.records.map(r=>r.department))].sort((a,b)=>a.localeCompare(b,'ja'));$('department').insertAdjacentHTML('beforeend',departments.map(d=>`<option>${esc(d)}</option>`).join(''));
 const p=new URLSearchParams(location.hash.slice(1));['year','region','stage','query','department','metric','metric2','metric3','sort','direction','tableMode','schoolRegion'].forEach(k=>{if(p.has(k)){const old=$(k).value;$(k).value=p.get(k);if(!$(k).value&&!['query','region','schoolRegion','metric2','metric3'].includes(k))$(k).value=old;}});
 if(!p.has('metric2')&&$('metric').value==='applicants')$('metric2').value='capacity';
 if(p.has('region')&&!p.has('schoolRegion'))$('schoolRegion').value=$('region').value;
 schools=new Set(p.getAll('school').filter(name=>data.records.some(r=>r.school===name)).slice(0,6));selected=new Set(p.getAll('compare').filter(id=>data.records.some(r=>r.program_id===id)).slice(0,6));selected.forEach(id=>{const r=data.records.find(r=>r.program_id===id);if(schools.size<6)schools.add(r.school);});$('underOnly').checked=p.get('under')==='1';
 $('notes').innerHTML=data.notes.map(n=>`<li>${esc(n)}</li>`).join('')+'<li>※合格者計＝前期＋後期＋再募集の合格者数。内進等を含む実入学者数とは異なります。</li>';
 $('sourceList').innerHTML=data.sources.map(s=>`<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.title)} ↗</a></li>`).join('')+'<li><a href="https://www.pref.nagano.lg.jp/kyoiku/koko/saiyo-nyuushi/shiken/ko/r8/r8konyushi.html" target="_blank" rel="noopener">2026年4月入学者用・令和8年度入試情報 ↗</a></li>';
 ['year','stage','department','metric','metric2','metric3','sort','direction','underOnly','tableMode'].forEach(k=>$(k).addEventListener('change',update));
 $('region').onchange=()=>{$('schoolRegion').value=$('region').value;update();};$('schoolRegion').onchange=()=>{schoolPicker();saveURL();};$('compareStage').onchange=()=>{$('stage').value=$('compareStage').value;update();};$('compareYear').onchange=()=>{$('year').value=$('compareYear').value;update();};$('query').oninput=update;
 $('schoolList').onchange=e=>{if(e.target.dataset.school)changeSchools(e.target.dataset.school,e.target.checked);};$('schoolChips').onclick=e=>{if(e.target.dataset.schoolRemove)changeSchools(e.target.dataset.schoolRemove,false);};$('clearSchools').onclick=()=>{schools.clear();selected.clear();update();};
 $('rows').onchange=e=>{const id=e.target.dataset.id;if(!id)return;if(e.target.checked){if(selected.size>=6){e.target.checked=false;$('selectionStatus').textContent='学科の比較は最大6件です。';return;}selected.add(id);}else selected.delete(id);update();};
 $('chips').onclick=e=>{const id=e.target.dataset.remove;if(id){selected.delete(id);update();}};$('reset').onclick=()=>{['query','department'].forEach(k=>$(k).value='');$('region').value='南信';$('schoolRegion').value='南信';$('underOnly').checked=false;schools.clear();selected.clear();update();};$('download').onclick=download;update();
 }catch(e){$('error').textContent='データを読み込めませんでした。再読み込みしてください。ローカルではHTTPサーバーで開いてください。';console.error(e);}}
init();
