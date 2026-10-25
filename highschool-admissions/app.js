'use strict';
const $=id=>document.getElementById(id);
const fmt=(v,d=0)=>v==null?'—':Number(v).toLocaleString('ja-JP',{minimumFractionDigits:d,maximumFractionDigits:d});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors=['#087d79','#c36c31','#4e68bd','#a84d7b','#708d2a','#7d59a0'];
const regions=['北信','東信','南信','中信'];
const metrics={applicants:['志願者数','人'],capacity:['募集枠','人'],examinees:['受検者数','人'],accepted:['選抜合格者数','人'],annual_capacity:['年間募集定員','人'],annual_accepted:['最終合格者計（前期＋後期＋再募集）','人'],enrolled:['年間実入学者数','人'],ratio:['志願倍率','倍'],fill:['年間定員充足率','%'],under:['年間定員割れ募集単位数','件']};
let data,visible=[];
const trend={regions:new Set(['南信']),schools:new Set()},comparison={regions:new Set(['南信']),schools:new Set()};
const sum=(rs,fn)=>{const vs=rs.map(fn).filter(v=>v!=null);return vs.length?vs.reduce((a,b)=>a+b,0):null;};
function value(r,key,stage='both'){
 if(key==='annual_capacity')return r.annual_capacity;
 if(key==='annual_accepted')return sum([r.early.accepted,r.late.accepted,r.additional_accepted],x=>x);
 if(key==='enrolled')return r.enrolled;
 if(key==='fill')return r.annual_capacity>0&&r.enrolled!=null?r.enrolled/r.annual_capacity*100:null;
 if(key==='under')return r.enrolled==null?null:Number(r.enrolled<r.annual_capacity);
 if(stage==='both'){
  if(key==='capacity')return r.annual_capacity;
  if(key==='ratio'){const n=value(r,'applicants','both');return r.annual_capacity>0&&n!=null?n/r.annual_capacity:null;}
  return sum([r.early[key],r.late[key]],x=>x);
 }
 const s=r[stage];if(key==='ratio')return s.capacity>0&&s.applicants!=null?s.applicants/s.capacity:null;return s[key]??null;
}
function aggregate(rs,key,stage='both'){
 if(key==='ratio'){const eligible=rs.filter(r=>value(r,'capacity',stage)>0&&value(r,'applicants',stage)!=null),cap=sum(eligible,r=>value(r,'capacity',stage)),app=sum(eligible,r=>value(r,'applicants',stage));return cap>0&&app!=null?app/cap:null;}
 if(key==='fill'){const eligible=rs.filter(r=>r.enrolled!=null),cap=sum(eligible,r=>r.annual_capacity),n=sum(eligible,r=>r.enrolled);return cap>0&&n!=null?n/cap*100:null;}
 return sum(rs,r=>value(r,key,stage));
}
function filteredRows(state,year,department){return data.records.filter(r=>r.year===year&&state.regions.has(r.region)&&(!state.schools.size||state.schools.has(r.school))&&(!department||r.department===department));}
function trendRows(year){return filteredRows(trend,year,$('department').value);}
function comparisonRows(){return filteredRows(comparison,+$('compareYear').value,$('compareDepartment').value).filter(r=>!$('underOnly').checked||value(r,'under')===1);}
function previous(r){return data.records.find(x=>x.year===r.year-1&&x.program_id===r.program_id);}
function delta(r,key,stage=$('compareStage').value){const prev=previous(r);if(!prev)return null;const a=key==='capacityDelta'?r.annual_capacity:value(r,'applicants',stage),b=key==='capacityDelta'?prev.annual_capacity:value(prev,'applicants',stage);return a!=null&&b!=null?a-b:null;}
function sortValue(r,key){if(key==='school')return r.school;if(key.endsWith('Delta'))return delta(r,key);if(key==='shortage')return r.enrolled==null?null:Math.max(0,r.annual_capacity-r.enrolled);return value(r,key,$('compareStage').value);}
function yearLabel(y){return `${y}年度（令和${y-2018}年度・${y}年4月入学）`;}
function stageLabel(stage){return stage==='early'?'前期':stage==='late'?'後期':'前期＋後期';}
function labelMetric(k,stage=$('stage').value){
 if(stage==='both')return ({capacity:'年間募集定員',applicants:'前期＋後期 志願者数（延べ）',examinees:'前期＋後期 受検者数（延べ）',accepted:'前期＋後期 合格者数（再募集除く）',ratio:'延べ志願者／年間定員'})[k]||metrics[k][0];
 return ['capacity','applicants','examinees','accepted','ratio'].includes(k)?`${stageLabel(stage)} ${metrics[k][0]}`:metrics[k][0];
}
function metricKeys(){return ['metric','metric2','metric3'].map(id=>$(id).value).filter((k,i,a)=>k&&a.indexOf(k)===i);}
function renderPickers(kind){const t=kind==='trend',state=t?trend:comparison,list=t?'trendSchoolList':'schoolList',chips=t?'trendSchoolChips':'schoolChips',q=$(t?'query':'compareQuery').value.trim().replace(/\s/g,''),year=t?null:+$('compareYear').value;
 $(t?'trendRegions':'compareRegions').innerHTML=regions.map(region=>`<label><input type="checkbox" data-region="${region}" ${state.regions.has(region)?'checked':''}>${region}</label>`).join('');
 const candidates=[...new Set(data.records.filter(r=>(year==null||r.year===year)&&state.regions.has(r.region)&&r.school.includes(q)).map(r=>r.school))].sort((a,b)=>a.localeCompare(b,'ja'));
 $(list).innerHTML=candidates.map(name=>`<label><input type="checkbox" data-school="${esc(name)}" ${state.schools.has(name)?'checked':''}>${esc(name)}</label>`).join('')||'<p class="caption">学校候補がありません。地域・年度・検索条件を確認してください。</p>';
 $(chips).innerHTML=[...state.schools].map(name=>`<button data-remove-school="${esc(name)}">${esc(name)} ×</button>`).join('');
}
function updateTrend(){const y=+$('year').value,stage=$('stage').value,rs=trendRows(y),scope=[...trend.regions].join('・')||'地域未選択';
 $('scope').textContent=`トレンド専用：${scope} / ${trend.schools.size?trend.schools.size+'校を選択':'学校指定なし・地域全体'} / ${stageLabel(stage)} / カードは${y}年4月入学実績`;
 $('chartContext').textContent=`2021〜2026年4月入学の推移。${stage==='both'?'前期＋後期の志願・受検は重複を含む延べ人数。募集枠は年間定員を使用（前後期の枠を足さない）。倍率は延べ志願者÷年間定員で、選抜ごとの競争率とは異なります。':stageLabel(stage)+'選抜の指標を表示。'} 最終合格者計は前期・後期・再募集の合格者数で、実入学者とは異なります。`;
 ['metric','metric2','metric3'].forEach(id=>{for(const opt of $(id).options){if(opt.value)opt.textContent=labelMetric(opt.value)+'（'+metrics[opt.value][1]+'）';}});
 const stats=[[labelMetric('capacity'),aggregate(rs,'capacity',stage),'人'],[labelMetric('applicants'),aggregate(rs,'applicants',stage),'人'],['最終合格者計（再募集含む）',aggregate(rs,'annual_accepted',stage),'人'],['年間実入学者数（5月1日）',aggregate(rs,'enrolled',stage),'人']];
 $('kpis').innerHTML=stats.map(([label,v,unit])=>`<div class="kpi"><span>${label}</span><strong>${fmt(v)}<small>${unit}</small></strong></div>`).join('');renderPickers('trend');renderChart();saveURL();
}
function updateComparison(){const mode=$('compareStage').value;for(const opt of $('sort').options){if(opt.value==='ratio')opt.textContent=mode==='both'?'延べ志願／年間定員順（参考）':'倍率ランキング';if(opt.value==='applicants')opt.textContent=mode==='both'?'志願者数ランキング（前後期延べ）':'志願者数ランキング';}
 const rs=comparisonRows(),key=$('sort').value;
 visible=(comparison.schools.size?rs:[]).sort((a,b)=>{const av=sortValue(a,key),bv=sortValue(b,key);if(av==null)return bv==null?0:1;if(bv==null)return -1;return key==='school'?av.localeCompare(bv,'ja'):($('direction').value==='asc'?av-bv:bv-av)||a.program_id.localeCompare(b.program_id,'ja');});
 $('rowCount').textContent=`比較表専用：${[...comparison.regions].join('・')||'地域未選択'} / 選択 ${comparison.schools.size}校 / 表示 ${visible.length}学科・募集単位 / 順位・増減は${stageLabel($('compareStage').value)}`;
 renderPickers('comparison');renderTable();saveURL();
}
function renderTable(){const year=+$('compareYear').value,mode=$('compareStage').value,stages=mode==='both'?['early','late']:[mode],names={early:'前期選抜',late:'後期選抜'};
 $('tableContext').textContent=`比較表：${yearLabel(year)} ｜ ${mode==='both'?'前期＋後期（内訳と延べ合計）':names[mode]+'のみ'}`;
 $('tableAsOf').textContent=`選抜結果：公表済み ／ 実入学者数：${year}年5月1日現在 ／ 1番のトレンドとは独立した条件`;
 $('tableCaption').textContent=`${year}年度入学の比較表。${mode==='both'?'志願者・受検者の合計は延べ人数です。':'年間実績は選抜区分にかかわらず通年の値です。'}`;
 const combined=mode==='both'?'<th colspan="3">前期＋後期（延べ）</th>':'';
 $('tableHead').innerHTML='<tr><th rowspan="2">学校 / 学科</th><th rowspan="2">年間定員</th>'+stages.map(s=>`<th colspan="5" class="stage-group ${s}">${names[s]} のみ（人・倍）</th>`).join('')+combined+'<th colspan="3">年間実績</th><th rowspan="2">年間定員<br>前年比</th><th rowspan="2">'+stageLabel(mode)+'志願者<br>前年比</th><th rowspan="2">出典</th></tr><tr>'+stages.map(()=>'<th>募集枠</th><th>志願者</th><th>受検者</th><th>合格者</th><th>志願倍率</th>').join('')+(mode==='both'?'<th>志願者（延べ）</th><th>受検者（延べ）</th><th>延べ志願／定員※</th>':'')+'<th>最終合格者計※</th><th>実入学者</th><th>充足率</th></tr>';
 const dtext=v=>v==null?'—':`${v>0?'+':''}${fmt(v)}`;
 $('rows').innerHTML=visible.map(r=>{const source=data.sources.find(s=>s.id===r.source_id);return `<tr><td class="program"><strong>${esc(r.school)}</strong><span>${esc(r.department)}</span></td><td class="annual">${fmt(r.annual_capacity)}</td>`+stages.map(s=>`<td>${fmt(r[s].capacity)}</td><td>${fmt(r[s].applicants)}</td><td>${fmt(r[s].examinees)}</td><td>${fmt(r[s].accepted)}</td><td>${fmt(value(r,'ratio',s),2)}</td>`).join('')+(mode==='both'?`<td>${fmt(value(r,'applicants','both'))}</td><td>${fmt(value(r,'examinees','both'))}</td><td>${fmt(value(r,'ratio','both'),2)}</td>`:'')+`<td>${fmt(value(r,'annual_accepted'))}</td><td>${fmt(r.enrolled)}</td><td><span class="${value(r,'under')===1?'low':''}">${r.enrolled==null?'—':fmt(value(r,'fill'),1)+'%'}</span></td><td>${dtext(delta(r,'capacityDelta'))}</td><td>${dtext(delta(r,'applicantDelta'))}</td><td><a href="${source.url}#page=${r.source_page}" target="_blank" rel="noopener" aria-label="${esc(r.school)}の公式資料 ${r.source_page}ページ">PDF ↗</a></td></tr>`;}).join('')+(!visible.length?`<tr><td colspan="${8+stages.length*5+(mode==='both'?3:0)}" class="empty">${comparison.schools.size?'条件に該当する学科がありません。比較表の年度・地域・学科を確認してください。':'比較表の地域から、比較したい学校を選んでください。'}</td></tr>`:'');$('download').disabled=!visible.length;
}
function renderChart(){const keys=metricKeys(),units=[...new Set(keys.map(k=>metrics[k][1]))];if(units.includes('人')){units.splice(units.indexOf('人'),1);units.unshift('人');}
 let targets;
 if(trend.schools.size)targets=[...trend.schools].map(name=>({name,rows:y=>trendRows(y).filter(r=>r.school===name)}));
 else if($('trendGroup').value==='regions')targets=[...trend.regions].map(region=>({name:region+'の合計',rows:y=>trendRows(y).filter(r=>r.region===region)}));
 else targets=[{name:([...trend.regions].join('＋')||'地域未選択')+'の合計',rows:trendRows}];
 const series=targets.flatMap((t,ti)=>keys.map((k,ki)=>({name:t.name,key:k,unit:metrics[k][1],color:colors[ti],dash:['','8 4','2 4'][ki],values:data.years.map(y=>aggregate(t.rows(y),k,$('stage').value))})));
 const W=Math.max(580,Math.min(1040,$('chart').clientWidth||1040)),H=320,L=75,R=units.length>2?150:units.length>1?80:25,T=36,B=45,plotRight=W-R;
 const maxes=units.map(u=>Math.max(1,...series.filter(s=>s.unit===u).flatMap(s=>s.values.filter(v=>v!=null)))*1.1);
 const x=i=>L+i*(plotRight-L)/(data.years.length-1),y=(v,u)=>H-B-v/maxes[units.indexOf(u)]*(H-T-B);
 const axisName=i=>i===0?'左軸':i===1?'右軸':'右外軸';
 let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(keys.map(k=>labelMetric(k)).join('・'))}の年度推移。${units.map((u,i)=>axisName(i)+' '+u).join('、')}。数値表は直後。">`;
 units.forEach((u,ui)=>{const xx=ui===0?L:plotRight+(ui-1)*70,anchor=ui===0?'end':'start';svg+=`<text x="${xx}" y="15" text-anchor="${ui===0?'start':anchor}" font-size="15" fill="#172f35">${axisName(ui)}：${u}</text><line x1="${xx}" y1="${T}" x2="${xx}" y2="${H-B}" stroke="#b7ccc4"/>`;
 for(let i=0;i<5;i++){const v=maxes[ui]*i/4,yy=y(v,u);if(ui===0)svg+=`<line x1="${L}" y1="${yy}" x2="${plotRight}" y2="${yy}" stroke="#e5ece7"/>`;svg+=`<text x="${xx+(ui===0?-10:10)}" y="${yy+4}" text-anchor="${anchor}" font-size="14" fill="#597174">${fmt(v,['倍','%'].includes(u)?1:0)}</text>`;}});
 data.years.forEach((yr,i)=>svg+=`<text x="${x(i)}" y="${H-15}" text-anchor="middle" font-size="15" fill="#597174">${yr}</text>`);
 series.forEach(s=>{let segment=[];const draw=()=>{if(segment.length)svg+=`<polyline points="${segment.join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-dasharray="${s.dash}"/>`;segment=[];};s.values.forEach((v,i)=>{if(v==null){draw();return;}segment.push(`${x(i)},${y(v,s.unit)}`);});draw();s.values.forEach((v,i)=>{if(v!=null)svg+=`<circle cx="${x(i)}" cy="${y(v,s.unit)}" r="3" fill="white" stroke="${s.color}" stroke-width="1.5"><title>${esc(s.name)} / ${esc(labelMetric(s.key))} / ${data.years[i]}年度 ${fmt(v,['倍','%'].includes(s.unit)?2:0)}${s.unit}</title></circle>`;});});svg+='</svg>';
 $('chart').innerHTML=svg;
 $('legend').innerHTML=series.map(s=>`<span><svg width="27" height="12" aria-hidden="true"><line x1="0" x2="27" y1="6" y2="6" stroke="${s.color}" stroke-width="3" stroke-dasharray="${s.dash}"/></svg> ${esc(s.name)} · ${esc(labelMetric(s.key))}（${axisName(units.indexOf(s.unit))}・${s.unit}）</span>`).join('');
 $('trendTable').innerHTML=`<table><thead><tr><th>対象 / 指標 / 軸</th>${data.years.map(y=>`<th>${y}年度</th>`).join('')}</tr></thead><tbody>${series.map(s=>`<tr><td>${esc(s.name+' / '+labelMetric(s.key)+' / '+axisName(units.indexOf(s.unit)))}</td>${s.values.map(v=>`<td>${fmt(v,['倍','%'].includes(s.unit)?2:0)}${v==null?'':s.unit}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function saveURL(){const p=new URLSearchParams({view:'independent'});['year','stage','trendGroup','department','query','metric','metric2','metric3','compareYear','compareStage','compareDepartment','compareQuery','sort','direction'].forEach(k=>p.set(k,$(k).value));p.set('tr',[...trend.regions].join(','));p.set('cr',[...comparison.regions].join(','));trend.schools.forEach(name=>p.append('ts',name));comparison.schools.forEach(name=>p.append('cs',name));if($('underOnly').checked)p.set('under','1');history.replaceState(null,'','#'+p);}
function download(){const stage=$('compareStage').value,fields=['入学年度','実入学者基準日','表の選抜条件','地域','学校','学科','年間定員',...['前期','後期'].flatMap(s=>['募集枠','志願者','受検者','合格者','志願倍率'].map(k=>s+k)),'前期後期志願者（延べ）','前期後期受検者（延べ）','延べ志願者÷年間定員','最終合格者計（前期後期再募集）','年間実入学者','年間充足率%','出典URL','ページ'];
 const rows=visible.map(r=>[r.year,`${r.year}-05-01`,stageLabel(stage),r.region,r.school,r.department,r.annual_capacity,...['early','late'].flatMap(s=>[r[s].capacity,r[s].applicants,r[s].examinees,r[s].accepted,value(r,'ratio',s)]),value(r,'applicants','both'),value(r,'examinees','both'),value(r,'ratio','both'),value(r,'annual_accepted'),r.enrolled,value(r,'fill'),data.sources.find(x=>x.id===r.source_id).url,r.source_page]);
 const csv='\uFEFF'+[fields,...rows].map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`nagano-comparison-${$('compareYear').value}-${stage}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function changeSchool(kind,name,checked){const state=kind==='trend'?trend:comparison,status=$(kind==='trend'?'trendStatus':'selectionStatus');status.textContent='';if(checked&&state.schools.size>=6){status.textContent='学校は最大6校です。選択を外して追加してください。';renderPickers(kind);return;}if(checked)state.schools.add(name);else state.schools.delete(name);(kind==='trend'?updateTrend:updateComparison)();}
function bindPicker(kind){const t=kind==='trend',state=t?trend:comparison,update=t?updateTrend:updateComparison;
 $(t?'trendRegions':'compareRegions').onchange=e=>{const region=e.target.dataset.region;if(!region)return;if(e.target.checked)state.regions.add(region);else state.regions.delete(region);state.schools=new Set([...state.schools].filter(name=>data.records.some(r=>r.school===name&&state.regions.has(r.region))));update();};
 $(t?'trendSchoolList':'schoolList').onchange=e=>{if(e.target.dataset.school)changeSchool(kind,e.target.dataset.school,e.target.checked);};
 $(t?'trendSchoolChips':'schoolChips').onclick=e=>{if(e.target.dataset.removeSchool)changeSchool(kind,e.target.dataset.removeSchool,false);};
 $(t?'query':'compareQuery').oninput=()=>{renderPickers(kind);saveURL();};
}
async function init(){try{const response=await fetch('data/admissions.json');if(!response.ok)throw Error(response.status);data=await response.json();
 const options=[...data.years].reverse().map(y=>`<option value="${y}">${yearLabel(y)}</option>`).join('');$('year').innerHTML=options;$('compareYear').innerHTML=options;
 ['metric','metric2','metric3'].forEach((id,i)=>{$(id).innerHTML=(i?'<option value="">表示しない</option>':'')+Object.entries(metrics).map(([k,[name,unit]])=>`<option value="${k}">${esc(name)}（${unit}）</option>`).join('');});$('metric').value='annual_capacity';$('metric2').value='annual_accepted';$('metric3').value='enrolled';
 const departments=[...new Set(data.records.map(r=>r.department))].sort((a,b)=>a.localeCompare(b,'ja'));['department','compareDepartment'].forEach(id=>$(id).insertAdjacentHTML('beforeend',departments.map(d=>`<option>${esc(d)}</option>`).join('')));
 const p=new URLSearchParams(location.hash.slice(1));['year','stage','trendGroup','department','query','metric','metric2','metric3','compareYear','compareStage','compareDepartment','compareQuery','sort','direction'].forEach(k=>{if(p.has(k)){const old=$(k).value;$(k).value=p.get(k);if(!$(k).value&&!['query','compareQuery','department','compareDepartment','metric2','metric3'].includes(k))$(k).value=old;}});
 const validSchool=name=>data.records.some(r=>r.school===name);
 if(p.get('view')==='independent'){
  if(p.has('tr'))trend.regions=new Set(p.get('tr').split(',').filter(r=>regions.includes(r)));
  if(p.has('cr'))comparison.regions=new Set(p.get('cr').split(',').filter(r=>regions.includes(r)));
  trend.schools=new Set(p.getAll('ts').filter(validSchool).slice(0,6));comparison.schools=new Set(p.getAll('cs').filter(validSchool).slice(0,6));
 }else{
  // Older shared links become the trend's initial conditions only. Comparison starts independently.
  if(p.has('region'))trend.regions=new Set(p.get('region')?[p.get('region')].filter(r=>regions.includes(r)):regions);
  trend.schools=new Set(p.getAll('school').filter(validSchool).slice(0,6));
  trend.schools.forEach(name=>data.records.filter(r=>r.school===name).forEach(r=>trend.regions.add(r.region)));
  if(!p.has('metric2')&&$('metric').value==='applicants')$('metric2').value='capacity';
 }
 for(const state of [trend,comparison])state.schools=new Set([...state.schools].filter(name=>data.records.some(r=>r.school===name&&state.regions.has(r.region))));
 $('underOnly').checked=p.get('under')==='1';
 $('notes').innerHTML=data.notes.filter(n=>!n.includes('合算しない')).map(n=>`<li>${esc(n)}</li>`).join('')+'<li>両方表示の志願者・受検者は前期＋後期の延べ人数です。同じ人を重複して含みます。</li><li>両方の募集人数は年間定員を使用。前期の未充足分が後期へ回るため、前後期の募集枠の単純合計は使用しません。</li><li>最終合格者計＝前期＋後期＋再募集の合格者数。内進等を含む実入学者数とは異なります。再募集を除く前後期合格者数も指標で選べます。</li><li>延べ志願者÷年間定員は合算用の参考指標で、選抜ごとの競争率や合格確率ではありません。</li>';
 $('sourceList').innerHTML=data.sources.map(s=>`<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.title)} ↗</a></li>`).join('')+'<li><a href="https://www.pref.nagano.lg.jp/kyoiku/koko/saiyo-nyuushi/shiken/ko/r8/r8konyushi.html" target="_blank" rel="noopener">2026年4月入学者用・令和8年度入試情報 ↗</a></li>';
 ['year','stage','trendGroup','department','metric','metric2','metric3'].forEach(k=>$(k).onchange=updateTrend);
 ['compareYear','compareStage','compareDepartment','sort','direction','underOnly'].forEach(k=>$(k).onchange=updateComparison);
 bindPicker('trend');bindPicker('comparison');
 $('resetTrend').onclick=()=>{trend.regions=new Set(['南信']);trend.schools.clear();$('stage').value='both';$('department').value='';$('query').value='';updateTrend();};
 $('clearSchools').onclick=()=>{comparison.schools.clear();updateComparison();};$('download').onclick=download;
 window.addEventListener('resize',renderChart);updateTrend();updateComparison();
 }catch(e){$('error').textContent='データを読み込めませんでした。再読み込みしてください。ローカルではHTTPサーバーで開いてください。';console.error(e);}}
init();
