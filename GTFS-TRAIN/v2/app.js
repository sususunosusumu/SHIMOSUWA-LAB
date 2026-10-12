'use strict';
const $=id=>document.getElementById(id), M=RailModel;
let data, sources, selected=null, mode='table', playing=null, simulated=false, clockMinute=300;
const state={station:'松本',direction:'both',service:'auto',range:'full',route:'midori',zoom:'1',height:'48',start:'05:00',end:'23:59',kinds:['local','azusa']};
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function nowMinute(){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date()).split(':').map(Number);return parts[0]*60+parts[1];}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const direction=t=>t.direction==='up'?'東京方面':'松本方面';
const endLabel=t=>`${t.stops[0][0]} → ${t.stops.at(-1)[0]}（収録区間）`;
function save(){try{localStorage.setItem('shimosuwa-rail-v2',JSON.stringify({...state,mode,layoutVersion:2}));}catch{}}
function span(){return [M.minutes(state.start),M.minutes(state.end)];}
function validSpan(){const [a,b]=span();return a!==null&&b!==null&&a<b;}
function trains(){return M.select(data,state);}
function button(t){return `<button class="train-button" style="--color:${M.colors[M.kind(t)]}" data-train="${esc(t.id)}">${esc(t.number)} <small>${esc(t.name)} · ${direction(t)}${t.duplicate?' · 複数記録':''}</small></button>`;}
function markerTime(){return simulated?clockMinute:(state.date===today()?nowMinute():null);}
function render(){if(!data)return;save();document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));$('play').disabled=mode!=='diagram';$('view').setAttribute('aria-label',{table:'時刻表',timeline:'駅別タイムライン',diagram:'駅間ダイヤグラム'}[mode]);
 if(!validSpan()||!state.date){$('status').textContent='運転日と時間範囲を確認してください。終了時刻は開始時刻より後に指定します。';$('view').innerHTML='<p class="empty">有効な表示条件を指定してください。</p>';return;}
 const ts=trains(),[a,b]=span(),events=M.stationEvents(ts,state.station,a,b);
 const coverage=state.date.replaceAll('-','');
 $('status').textContent=`${state.station} · ${state.date} · ${events.length}件の停車記録（参考）${state.service!=='auto'?' · 曜日データを手動指定':''}${coverage<'20260501'||coverage>'20270331'?' · データの収録期間外です':''}${state.kinds.includes('freight')?' · 貨物の時刻は未収録です':''}`;
 $('help').textContent=mode==='diagram'?'線・列車番号を選択して詳細を表示。赤線＝本日の現在時刻、橙線＝再生時刻。駅間の線は収録時刻を結ぶ参考線です。':mode==='timeline'?'選択駅の停車記録を時刻順に表示します。通過列車は時刻がないため表示しません。':'列車番号・時刻を選択して詳細を表示。— は非停車・別経路・欠損のいずれかで、通過を確定する記号ではありません。';
 if(mode==='table')renderTable(ts,a,b);else if(mode==='timeline')renderTimeline(events);else renderDiagram(ts,a,b);
 renderDetail();
}
function renderTable(ts,a,b){const ss=M.stations(state.range,state.route);const list=ts.filter(t=>t.stops.some(s=>ss.includes(s[0])&&M.minutes(s[2]||s[1])>=a&&M.minutes(s[2]||s[1])<=b)).sort((x,y)=>(M.minutes(x.stops.find(s=>s[0]===state.station)?.[2])??M.minutes(x.stops[0][2]))-(M.minutes(y.stops.find(s=>s[0]===state.station)?.[2])??M.minutes(y.stops[0][2])));
 if(!list.length){$('view').innerHTML='<p class="empty">この条件に該当する停車記録はありません。</p>';return;}
 $('view').innerHTML=`<table><thead><tr><th>駅 / 発時刻</th>${list.map(t=>`<th class="${t.id===selected?'selected':''}">${button(t)}</th>`).join('')}</tr></thead><tbody>${ss.map(st=>`<tr><th class="${st===state.station?'station-selected':''}">${esc(st)}</th>${list.map(t=>{const s=t.stops.find(s=>s[0]===st);return `<td class="${t.id===selected?'selected':''} ${st===state.station?'station-selected':''}">${s?`<button data-minute="${M.minutes(s[2]||s[1])}" data-train="${esc(t.id)}">${M.time(M.minutes(s[2]||s[1]))}</button>`:'—'}</td>`;}).join('')}</tr>`).join('')}</tbody></table>`;
}
function renderTimeline(events){let mark=false;const now=markerTime(),next=now===null?null:events.find(e=>e.minute>=now);
 const rows=events.map(e=>{let before='';if(now!==null&&!mark&&e.minute>=now){mark=true;before=`<div class="time-marker" id="timeMarker">${simulated?'再生':'現在'} ${M.time(now)}</div>`;}const remain=now!==null&&e.minute>=now?`${Math.ceil(e.minute-now)}分後（予定・未確認）`:'';return before+`<article class="${e.train.id===selected?'selected':''}" style="--color:${M.colors[M.kind(e.train)]}" data-minute="${e.minute}"><time>${M.time(e.minute)}</time><div>${button(e.train)}<small>${esc(endLabel(e.train))}</small><small>${e===next?'次の停車記録 · ':''}${remain}</small></div></article>`;}).join('');
 $('view').innerHTML=`<div class="timeline">${rows||'<p class="empty">この駅の停車記録はありません。</p>'}${now!==null&&!mark?`<div id="timeMarker" class="time-marker">${simulated?'再生':'現在'} ${M.time(now)} · 以降の記録はありません</div>`:''}</div>`;
}
function renderDiagram(ts,a,b){const ss=M.stations(state.range,state.route),h=Number(state.height),w=Math.max(900,$('view').clientWidth)*Number(state.zoom),H=ss.length*h+140,x=m=>110+(m-a)/(b-a)*(w-140),y=st=>110+ss.indexOf(st)*h;
 const branchOther=state.route==='midori'?M.branch:['みどり湖'];
 const relevant=ts.filter(t=>!t.stops.some(s=>branchOther.includes(s[0]))&&t.stops.filter(s=>ss.includes(s[0])).length>=2);
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${H}" role="img" aria-label="駅と時刻を結ぶ参考ダイヤグラム"><defs><clipPath id="plot"><rect x="110" y="90" width="${w-140}" height="${H-120}"/></clipPath></defs>`;
 for(let m=Math.ceil(a/30)*30;m<=b;m+=30)svg+=`<line x1="${x(m)}" x2="${x(m)}" y1="90" y2="${H-30}" stroke="#e1eae5"/><text class="axis-time" transform="translate(${x(m)+4} 78) rotate(-90)" text-anchor="start">${M.time(m)}</text>`;
 ss.forEach(st=>svg+=`<line x1="110" x2="${w-30}" y1="${y(st)}" y2="${y(st)}" stroke="${st===state.station?'#cba548':'#dce7e1'}"/><text x="100" y="${y(st)+4}" text-anchor="end" font-weight="${st===state.station?'700':'400'}">${esc(st)}</text>`);
 svg+='<g clip-path="url(#plot)">';
 relevant.sort((x,y)=>Number(x.id===selected)-Number(y.id===selected)).forEach(t=>{const points=t.stops.filter(s=>ss.includes(s[0])&&M.minutes(s[2]||s[1])!==null);const p=points.map(s=>`${x(M.minutes(s[2]||s[1]))},${y(s[0])}`).join(' ');const c=M.colors[M.kind(t)],sel=t.id===selected;svg+=`<polyline points="${p}" fill="none" stroke="transparent" stroke-width="14" tabindex="0" role="button" class="train-path" aria-label="${esc(t.number+' '+t.name+' '+direction(t))}" data-train="${esc(t.id)}"><title>${esc(t.number+' '+t.name+' '+endLabel(t))}</title></polyline><polyline points="${p}" fill="none" stroke="${c}" stroke-width="${sel?5:1.8}" opacity="${selected&&!sel?.25:1}" pointer-events="none"/>`;
 if(sel)points.forEach(s=>svg+=`<circle cx="${x(M.minutes(s[2]||s[1]))}" cy="${y(s[0])}" r="4" fill="${c}" pointer-events="none"/>`);
 });
 const now=state.date===today()?nowMinute():null;if(now!==null)svg+=`<line id="realTimeLine" x1="${x(now)}" x2="${x(now)}" y1="90" y2="${H-30}" stroke="#c53f38" stroke-width="2"/><text x="${x(now)+5}" y="102" fill="#c53f38">現在 ${M.time(now)}</text>`;
 if(simulated)svg+=`<line id="timeMarker" x1="${x(clockMinute)}" x2="${x(clockMinute)}" y1="90" y2="${H-30}" stroke="#cf8116" stroke-width="3"/><text x="${x(clockMinute)+5}" y="${H-36}" fill="#a76610">再生 ${M.time(clockMinute)}</text>`;
 svg+='</g></svg>';
 $('view').innerHTML=`<p class="diagram-caption">${ss[0]}〜${ss.at(-1)} · ${state.route==='midori'?'みどり湖':'辰野'}経由 · 縦軸は駅順（距離ではありません）。通過時刻・現在位置は未収録。</p>${svg}<div class="diagram-caption">表示中の列車記録：${relevant.filter(t=>t.stops.some(s=>ss.includes(s[0])&&M.minutes(s[2]||s[1])>=a&&M.minutes(s[2]||s[1])<=b)).map(button).join(' ')||'該当記録なし'}</div>`;
}
function renderDetail(){const t=data.trains.find(t=>t.id===selected);if(!t){$('detail').innerHTML='<h2>列車詳細</h2><p>列車番号・時刻・ダイヤの線から選択できます。</p>';return;}
 const visible=trains().some(x=>x.id===t.id);
 $('detail').innerHTML=`<span class="badge">参考情報 · 公式未照合</span><h2>${esc(t.number)}<br>${esc(t.name)}</h2><p>${direction(t)} · ${esc(t.service)}<br>${visible?'':'現在のフィルターでは非表示です。'}</p><p><strong>始発・終着：未確認</strong><br>収録区間：${esc(endLabel(t))}</p><p>${t.duplicate?'同じ列車番号の複数記録があります。実運転・接続関係は未確認です。':''}運転日は元GTFSの曜日設定による参考判定です。祝日・臨時運転は未検証。</p><button id="toDiagram">この列車をダイヤで見る</button><h3>収録された停車駅</h3><table class="detail-table"><thead><tr><th>駅</th><th>着</th><th>発</th></tr></thead><tbody>${t.stops.map(s=>`<tr class="${s[0]===state.station?'selected':''}"><td>${esc(s[0])}</td><td>${M.time(M.minutes(s[1]))}</td><td>${M.time(M.minutes(s[2]))}</td></tr>`).join('')}</tbody></table><p>未収録の通過駅・通過時刻は補完していません。元データは到着・発車が同時刻の場合があり、停車時間は未確認です。</p><small>記録ID：${esc(t.id)}<br>データ版：${esc(sources.feedVersion)}<br>確認日：${esc(sources.updated)}</small>`;
 $('toDiagram').onclick=()=>{const available=t.stops.filter(s=>M.order.includes(s[0])||M.branch.includes(s[0]));if(available.length){state.range='full';state.route=t.stops.some(s=>M.branch.includes(s[0]))?'tatsuno':'midori';const min=M.minutes(available[0][2]||available[0][1]),max=M.minutes(available.at(-1)[2]||available.at(-1)[1]);state.start=M.time(Math.max(0,min-30));state.end=M.time(Math.min(1439,Math.max(min+30,max+30)));sync();}mode='diagram';render();};
}
function sync(){for(const k of ['station','date','direction','service','range','route','zoom','height','start','end'])$(k).value=state[k];document.querySelectorAll('#filters input').forEach(e=>e.checked=state.kinds.includes(e.value));}
function stop(){clearInterval(playing);playing=null;$('play').textContent='時間再生';}
function current(){stop();simulated=false;const n=nowMinute();clockMinute=n;$('cursor').value=n;$('clock').textContent=M.time(n);render();if(mode==='timeline')$('timeMarker')?.scrollIntoView({block:'nearest'});else if(mode==='diagram'){const [a,b]=span();$('view').scrollLeft=Math.max(0,110+(n-a)/(b-a)*(Math.max(900,$('view').clientWidth)*Number(state.zoom)-140)-$('view').clientWidth/2);}else{const cells=[...$('view').querySelectorAll('[data-minute]')].filter(e=>Number(e.dataset.minute)>=n).sort((a,b)=>Number(a.dataset.minute)-Number(b.dataset.minute));cells[0]?.scrollIntoView({block:'nearest',inline:'center'});}}
async function init(){try{const results=await Promise.all(['data.json','sources.json'].map(async path=>{const r=await fetch(path);if(!r.ok)throw Error(path);return r.json();}));[data,sources]=results;
 state.date=today();try{const saved=JSON.parse(localStorage.getItem('shimosuwa-rail-v2')||'null');if(saved){if(saved.layoutVersion!==2){saved.station='松本';saved.range='full';}for(const k of ['station','direction','service','range','route','zoom','height','start','end'])if(typeof saved[k]==='string')state[k]=saved[k];if(Array.isArray(saved.kinds))state.kinds=saved.kinds.filter(k=>M.colors[k]);if(['table','timeline','diagram'].includes(saved.mode))mode=saved.mode;}}catch{}
 const stationList=[...M.order,...M.branch];if(!stationList.includes(state.station))state.station='松本';$('station').innerHTML=stationList.map(s=>`<option>${esc(s)}</option>`).join('');sync();for(const k of ['direction','service','range','route','zoom','height'])if(!$(k).value){state[k]={direction:'both',service:'auto',range:'full',route:'midori',zoom:'1',height:'48'}[k];}sync();
 $('sourceInfo').innerHTML=`<p>更新・調査日：${esc(sources.updated)} ／ データ版：${esc(sources.feedVersion)}<br>GTFS上の収録期間：${esc(sources.coverageStart)}〜${esc(sources.coverageEnd)}（有効性を保証する期間ではありません）</p><p>${esc(sources.description)}</p><p>${esc(sources.revision.october)} 公式に確認できた改正日は${esc(sources.revision.confirmedDate)}です。2026年10月版の公式時刻表は閲覧可能ですが、自動取得・全列車の照合・運転日の反映は未実装です。</p><ul>${sources.limitations.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><ul>${sources.links.map(s=>`<li><a target="_blank" rel="noopener" href="${esc(s.url)}">${esc(s.label)}</a></li>`).join('')}</ul>`;
 for(const k of ['station','date','direction','service','range','route','zoom','height','start','end'])$(k).addEventListener('change',()=>{state[k]=$(k).value;stop();render();});
 $('filters').addEventListener('change',()=>{state.kinds=[...document.querySelectorAll('#filters input:checked')].map(e=>e.value);render();});document.querySelectorAll('[data-mode]').forEach(e=>e.onclick=()=>{stop();mode=e.dataset.mode;render();});
 $('view').addEventListener('click',e=>{const el=e.target.closest('[data-train]');if(el){selected=el.dataset.train;render();}});$('view').addEventListener('keydown',e=>{if(e.target.matches('.train-path')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();selected=e.target.dataset.train;render();}});
 $('clear').onclick=()=>{selected=null;render();};$('now').onclick=current;
 $('cursor').oninput=()=>{stop();simulated=true;clockMinute=Number($('cursor').value);$('clock').textContent=M.time(clockMinute);render();};
 $('play').onclick=()=>{if(playing){stop();return;}if(!validSpan())return;const [a,b]=span();simulated=true;if(clockMinute<a||clockMinute>=b)clockMinute=a;$('play').textContent='一時停止';playing=setInterval(()=>{clockMinute=Math.min(b,clockMinute+1);$('cursor').value=clockMinute;$('clock').textContent=M.time(clockMinute);render();if(clockMinute>=b)stop();},300);render();};
 render();setInterval(()=>{if(!simulated&&state.date===today()&&mode!=='table')render();},30000);
 }catch(err){$('status').textContent='データを読み込めませんでした。ページを再読み込みしてください。';$('view').innerHTML='<p class="empty error">開発版のデータ取得に失敗しました。</p>';console.error(err);}}
init();
