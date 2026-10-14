'use strict';
const $=id=>document.getElementById(id);
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=value=>typeof value==='number'?(Number.isInteger(value)?String(value):value.toFixed(1)):escapeHTML(value);
const signed=value=>(value>0?'+':'')+value.toFixed(1);
const prefs=Object.keys(DATA.years['2026']).filter(n=>n!=='全国平均').sort((a,b)=>DATA.years['2026'][a].code.localeCompare(DATA.years['2026'][b].code));
const metros=['東京都','大阪府','福岡県','京都府'];
const peers=prefs.filter(n=>n!=='長野県'&&Math.abs(DATA.population[n]/DATA.population['長野県']-1)<=.2);
const subjects={2024:['国語','数学'],2025:['国語','数学','理科'],2026:['国語','数学','英語４技能','英語３技能']};
const subjectChoices=['全教科合計','国語','数学','理科','社会','英語４技能','英語３技能'];
function selectedRegions(){let group=$('group').value;return ['全国平均','長野県',...(group==='all'?prefs:group==='metro'?metros:group==='peer'?peers:[...metros,...peers])].filter((n,i,a)=>a.indexOf(n)===i);}
function options(values,labels){return values.map(v=>`<option value="${escapeHTML(v)}">${escapeHTML(labels?labels(v):v)}</option>`).join('');}
function source(r){return `<details class="details"><summary>出典・詳細</summary><p><a href="${escapeHTML(r.source)}" target="_blank" rel="noopener">公式集計ファイル ↗</a><br>${escapeHTML(r.sheet)} / ${escapeHTML(r.cell||r.cells)}${r.question?`<br>設問 ${escapeHTML(r.question)}：${escapeHTML(r.text)}<br>${escapeHTML(r.definition)}<br>割合：${r.parts.map(fmt).join(' + ')}％${r.counts?`<br>回答人数：${r.counts.join(' + ')} / 母数 ${r.n.toLocaleString('ja-JP')}`:''}`:''}</p></details>`;}
function delta(r,b){return r&&b&&typeof r.value==='number'&&typeof b.value==='number'?r.value-b.value:null;}
function setAcademicOptions(){const previous=$('subject').value; $('subject').innerHTML=options(subjectChoices,v=>v==='全教科合計'?v+'・一覧':v==='理科'?v+'（2025年度・IRT）':v==='社会'?v+'（この調査では対象外）':v.startsWith('英語')?v+'（2026年度・IRT）':v); if(subjectChoices.includes(previous))$('subject').value=previous;}
function setQuestionOptions(id){const old=$(id).value,qs=DATA.years[$('year').value]['長野県'].questions;$(id).innerHTML=options(Object.keys(DATA.metrics).filter(k=>qs[k]),k=>DATA.metrics[k].label);if(qs[old])$(id).value=old;}
function barChart(rows,title,irt=false,total=false){
 const width=860,left=110,right=80,top=40,rowHeight=30,height=top+rows.length*rowHeight+50;
 const min=irt?350:0,max=irt?650:total?200:100,x=v=>left+(v-min)/(max-min)*(width-left-right);
 let svg=`<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHTML(title)}"><title>${escapeHTML(title)}</title>`;
 for(let tick=min;tick<=max;tick+=irt||total?50:20)svg+=`<line x1="${x(tick)}" x2="${x(tick)}" y1="25" y2="${height-35}" stroke="#dbe4dd"/><text x="${x(tick)}" y="${height-12}" text-anchor="middle">${tick}</text>`;
 rows.forEach(([name,r],i)=>{const cy=top+i*rowHeight,color=name==='長野県'?'#16624e':'#91b3a5';svg+=`<text x="${left-12}" y="${cy+5}" text-anchor="end">${escapeHTML(name)}</text>`;if(typeof r.value==='number')svg+=`<rect x="${x(min)}" y="${cy-7}" width="${Math.max(0,x(r.value)-x(min))}" height="16" rx="4" fill="${color}"/>`;else{const [a,b]=r.value.split('～').map(v=>v.trim());if(a&&b){svg+=`<line x1="${x(Number(a))}" x2="${x(Number(b))}" y1="${cy}" y2="${cy}" stroke="${color}" stroke-width="8"/>`;}else{const bound=x(Number(a||b)),direction=a?1:-1,end=bound+direction*20;svg+=`<path d="M ${bound} ${cy-6} V ${cy+6} M ${bound} ${cy} H ${end} l ${-direction*6} -4 M ${end} ${cy} l ${-direction*6} 4" fill="none" stroke="${color}" stroke-width="2"/>`;}}svg+=`<text x="${width-right+12}" y="${cy+5}">${fmt(r.value)}</text>`;});
 return `<h3>${escapeHTML(title)}</h3>${irt?'<p class="tiny">県は平均IRTスコアの公表幅、全国は集計ファイルの公表値。横軸は350〜650。片側が開いた公表幅は境界と矢印で表示。幅を点数に変換していません。</p>':total?'<p class="tiny">国語正答率＋数学正答率を各100点相当として足した参考値（0〜200）。公式の総得点・個人の平均総点ではありません。2025・2026年度は全教科合計ではなく2教科のみです。</p>':'<p class="tiny">平均正答率（％）、横軸は0〜100。</p>'}${svg}</svg>`;
}
function restoreAcademicTable(){const header=$('regionRows').closest('table').querySelector('thead');header.innerHTML='<tr><th>地域</th><th id="metricTitle">指標</th><th>全国との差</th><th>集計対象</th><th>出典・検算情報</th></tr>';}
function renderAllSubjects(){const year=$('year').value,rs=DATA.years[year],all=year==='2024',columns=subjects[year],national=rs['全国平均'].academic,base=national['国語'].value+national['数学'].value;
 $('availability').innerHTML=`<strong>${year}年度・全教科の一覧と合計。</strong><br>${all?'実施教科は国語・数学の2教科。両教科の正答率を足し、各100点相当・合計200点相当の参考値として表示します。':'全教科の合計は算出できません。国語・数学は正答率、理科・英語はIRT尺度で、直接足すと意味のない値になるためです。国語＋数学だけの参考合計を別に表示します。'}<br>公式の総得点・個人の平均総点ではありません。科目ごとに集計生徒が異なり、公表値の丸めも含みます。${year==='2026'?'<br>英語は4技能と参考の3技能を併記し、2教科として数えたり合算したりしません。4技能の全国と県は集計対象が異なります。':''}`;
 $('regionRows').closest('table').querySelector('thead').innerHTML=`<tr><th>地域</th>${columns.map(s=>`<th>${s}<br>${s==='理科'||s.startsWith('英語')?'IRTスコア':'正答率（％）'}</th>`).join('')}<th>全教科合計<br>参考値</th>${all?'':'<th>国語＋数学のみ<br>参考合計（200点相当）</th>'}<th>2教科合計の<br>全国との差（点相当）</th><th>計算・出典</th></tr>`;
 const chartRows=[];
 $('regionRows').innerHTML=selectedRegions().map(name=>{const a=rs[name].academic,sum=Number((a['国語'].value+a['数学'].value).toFixed(1));chartRows.push([name,{value:sum}]);return `<tr class="${name==='長野県'?'highlight':''}"><td><b>${name}</b></td>${columns.map(s=>`<td>${fmt(a[s].value)}</td>`).join('')}<td>${all?`<strong>${fmt(sum)}</strong> / 200点相当`:'算出不可（尺度が異なる）'}</td>${all?'':`<td><strong>${fmt(sum)}</strong> / 200点相当</td>`}<td>${signed(sum-base)}</td><td><p class="tiny">国語 ${fmt(a['国語'].value)} ＋ 数学 ${fmt(a['数学'].value)} ＝ ${fmt(sum)}。正答率の合計で、正答数の合計ではありません。</p>${columns.map(s=>`<span class="details">${s}</span>${source(a[s])}`).join('')}</td></tr>`;}).join('');
 $('dataBars').innerHTML=barChart(chartRows,`${year}年度 国語＋数学の参考合計`,false,true);
}
function renderAcademic(){const y=$('year').value,s=$('subject').value,rs=DATA.years[y],b=rs['全国平均'].academic[s],irt=s==='理科'||s.startsWith('英語');
 if(s==='全教科合計'){renderAllSubjects();return;}
 restoreAcademicTable();
 if(!b){
  const social=s==='社会';
  const reason=social?'社会は全国学力・学習状況調査の教科調査に含まれていません。2024〜2026年度の都道府県別成績・全国平均は存在しないため、数値を表示しません。':`${y}年度の中学校では${s.startsWith('英語')?'英語':s}の教科調査を実施していません。掲載している3年度では${s==='理科'?'2025年度に理科（CBT・IRT）':'2026年度に英語（CBT・IRT）'}を実施しています。`;
  const availableYear=s==='理科'?'2025':'2026';
  $('metricTitle').textContent=s+'：調査対象外';
  $('availability').innerHTML=`<strong>${y}年度 ${s}：調査対象外</strong><br>${reason}${social?'':`<br><button class="pill" id="availableSubjectYear">${availableYear}年度の${s}を見る</button>`}`;
  $('regionRows').innerHTML=selectedRegions().map(n=>`<tr class="${n==='長野県'?'highlight':''}"><td><b>${n}</b></td><td>調査対象外</td><td>—</td><td class="details">教科調査を実施していません</td><td><a href="https://www.nier.go.jp/${y.slice(2)}chousakekkahoukoku/" target="_blank" rel="noopener">公式の調査資料 ↗</a></td></tr>`).join('');
  $('dataBars').innerHTML=`<h3>${y}年度 ${s}</h3><p>${reason}</p>${social?'<p class="tiny">別の調査で社会を掲載する場合は、対象学年・調査範囲・尺度が異なるため、この全国調査と区別する必要があります。</p>':''}`;
  if(!social)$('availableSubjectYear').addEventListener('click',()=>{$('year').value=availableYear;$('year').dispatchEvent(new Event('change'));});
  return;
 }
 $('metricTitle').textContent=`${s}：${irt?'平均IRTスコア':'平均正答率（％）'}`;
 $('availability').innerHTML=`<strong>${y}年度・全国と47都道府県の実数値を収録。</strong> ${irt?'県の平均は公表幅をそのまま表示。幅の中点や順位は作成しません。':'県は整数、全国は小数1桁の公表値。差は公表値同士の差（pt）です。'}${s==='英語４技能'?'<br>全国は国公私立の当日実施抽出校、県は公立の当日・期間内実施合算。対象が異なるため全国との差は表示しません。':''}`;
 $('regionRows').innerHTML=selectedRegions().map(n=>{const r=rs[n].academic[s],d=s==='英語４技能'?null:delta(r,b);return `<tr class="${n==='長野県'?'highlight':''}"><td><b>${n}</b></td><td><strong>${fmt(r.value)}</strong> ${r.unit}${r.bands?`<details class="details"><summary>IRTバンド分布</summary><p>バンド1〜5の割合（％）：${r.bands.map(fmt).join(' / ')}<br>同一年度・同一技能内で比較。</p></details>`:''}</td><td>${d===null?'幅・対象のため算出しない':signed(d)+' pt'}</td><td class="details">${r.scope}<br>集計生徒数 ${r.n.toLocaleString('ja-JP')}人</td><td>${source(r)}</td></tr>`;}).join('');
 $('dataBars').innerHTML=barChart(selectedRegions().map(n=>[n,rs[n].academic[s]]),`${y}年度 ${s}`,irt);
}
function renderQuestions(){const y=$('year').value,key=$('questionMetric').value,rs=DATA.years[y],b=rs['全国平均'].questions[key];
 $('questionDefinition').innerHTML=`<strong>${DATA.metrics[key].label}</strong> / ${y}年度、公立中学校3年生<br>${escapeHTML(b.text)}<br>${escapeHTML(b.definition)}。無回答・その他を含む公表母数のまま。${key==='ict'?'2024年度は「ほぼ毎日」の区分が1つ、2025・2026年度は2つです。':''}`;
 $('questionRows').innerHTML=selectedRegions().map(n=>{const r=rs[n].questions[key];return `<tr class="${n==='長野県'?'highlight':''}"><td><b>${n}</b></td><td>${fmt(r.value)}％</td><td>${signed(delta(r,b))}</td><td>${source(r)}</td></tr>`;}).join('');
}
function correlation(points){if(points.length<3)return null;const n=points.length,mx=points.reduce((a,p)=>a+p.x,0)/n,my=points.reduce((a,p)=>a+p.y,0)/n;let xx=0,yy=0,xy=0;points.forEach(p=>{xx+=(p.x-mx)**2;yy+=(p.y-my)**2;xy+=(p.x-mx)*(p.y-my);});if(xx===0||yy===0)return null;return {n,r:xy/Math.sqrt(xx*yy),slope:xy/xx,intercept:my-xy/xx*mx};}
function pointsFor(key,subject){const rs=DATA.years[$('year').value];return prefs.flatMap(name=>{const q=rs[name].questions[key],a=rs[name].academic[subject];return q&&a&&typeof a.value==='number'?[{name,x:q.value,y:a.value,q,a}]:[];});}
function scatterChart(points,stats,xlabel,ylabel){const W=860,H=470,L=75,R=35,T=35,B=80;
 const xmin=Math.max(0,Math.floor(Math.min(...points.map(p=>p.x))-2)),xmax=Math.min(100,Math.ceil(Math.max(...points.map(p=>p.x))+2)),ymin=Math.max(0,Math.floor(Math.min(...points.map(p=>p.y))-2)),ymax=Math.min(100,Math.ceil(Math.max(...points.map(p=>p.y))+2));
 const x=v=>L+(v-xmin)/(xmax-xmin)*(W-L-R),y=v=>H-B-(v-ymin)/(ymax-ymin)*(H-T-B);
 let svg=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHTML(xlabel+'と'+ylabel+'の47都道府県散布図')}" ><title>${escapeHTML(xlabel+'と'+ylabel)}</title><defs><clipPath id="plotClip"><rect x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}"/></clipPath></defs>`;
 for(let i=0;i<=5;i++){let a=xmin+(xmax-xmin)*i/5,b=ymin+(ymax-ymin)*i/5;svg+=`<line x1="${x(a)}" x2="${x(a)}" y1="${T}" y2="${H-B}" stroke="#dbe4dd"/><text x="${x(a)}" y="${H-B+24}" text-anchor="middle">${fmt(a)}</text><line x1="${L}" x2="${W-R}" y1="${y(b)}" y2="${y(b)}" stroke="#dbe4dd"/><text x="${L-12}" y="${y(b)+4}" text-anchor="end">${fmt(b)}</text>`;}
 if(stats)svg+=`<line clip-path="url(#plotClip)" x1="${x(xmin)}" y1="${y(stats.intercept+stats.slope*xmin)}" x2="${x(xmax)}" y2="${y(stats.intercept+stats.slope*xmax)}" stroke="#bd7940" stroke-width="2"/>`;
 points.filter(p=>p.name!=='長野県').concat(points.filter(p=>p.name==='長野県')).forEach(p=>{svg+=`<circle class="${p.name==='長野県'?'nagano':'dot'}" cx="${x(p.x)}" cy="${y(p.y)}" r="${p.name==='長野県'?7:4.5}" tabindex="0" role="img" aria-label="${p.name}：X ${fmt(p.x)}％、Y ${fmt(p.y)}％"><title>${p.name}：${xlabel} ${fmt(p.x)}％ / ${ylabel} ${fmt(p.y)}％</title></circle>`;if(p.name==='長野県')svg+=`<text x="${x(p.x)+10}" y="${y(p.y)-9}" class="nagano">長野県</text>`;});
 return svg+`<text x="${(W+L-R)/2}" y="${H-20}" text-anchor="middle">${escapeHTML(xlabel)}（％）</text><text transform="translate(20 ${(H-B+T)/2}) rotate(-90)" text-anchor="middle">${escapeHTML(ylabel)}：平均正答率（％）</text></svg><p class="tiny">差が見えるよう軸の範囲を拡大しています（X ${xmin}〜${xmax}％、Y ${ymin}〜${ymax}％）。</p>`;
}
function renderCorrelation(){const key=$('corrX').value,s=$('corrY').value,points=pointsFor(key,s),stats=correlation(points);$('corrStats').innerHTML=stats?`<span class="eyeb">${$('year').value}年度 / PEARSON</span><p class="metric">r = ${stats.r.toFixed(3)} <span class="tiny">n = ${stats.n}都道府県 / 重みなし</span></p>`:'<p>相関を計算できるデータが不足しています。</p>';$('scatter').innerHTML=points.length?scatterChart(points,stats,DATA.metrics[key].label,s):'';$('scatterRows').innerHTML=points.map(p=>`<tr class="${p.name==='長野県'?'highlight':''}"><td>${p.name}</td><td>${fmt(p.x)}</td><td>${fmt(p.y)}</td><td>${source(p.q)}</td><td>${source(p.a)}</td></tr>`).join('');}
function renderCards(){const year=$('year').value,rs=DATA.years[year],n=rs['長野県'],b=rs['全国平均'];const mq=n.questions.mathLike,bq=b.questions.mathLike,study=n.questions.study,bs=b.questions.study,agency=n.questions.agency,ba=b.questions.agency,sw=n.questions.selfWorth,bw=b.questions.selfWorth;const r1=correlation(pointsFor('mathLike','数学')),r2=correlation(pointsFor('study','数学'));
 const cards=[
 ['全国との差を見る',`長野の数学は${fmt(n.academic['数学'].value)}％`,`${year}年度の全国（公立）は${fmt(b.academic['数学'].value)}％。公表値の差は${signed(delta(n.academic['数学'],b.academic['数学']))}pt。県の値は整数に丸められており、小さな差の解釈に注意。`,source(n.academic['数学'])],
 ['意欲と成績',`数学が好き：${fmt(mq.value)}％`,`全国は${fmt(bq.value)}％（差${signed(delta(mq,bq))}pt）。47県で数学正答率との相関 r=${r1.r.toFixed(3)}。好意度が成績を上げるという因果関係は、この集計では証明できません。`,source(mq)],
 ['時間区分を確認',`平日1時間以上：${fmt(study.value)}％`,`全国は${fmt(bs.value)}％（差${signed(delta(study,bs))}pt）。数学正答率との県単位相関 r=${r2.r.toFixed(3)}。塾などを含む自己申告で、学習の質や家庭背景を調整していません。`,source(study)],
 ['主体性の一側面',`自分から取り組む：${fmt(agency.value)}％`,`全国は${fmt(ba.value)}％（差${signed(delta(agency,ba))}pt）。授業での自己申告の肯定回答です。「主体性」全体を1つの設問で測った値とは考えません。`,source(agency)],
 ['自己認識',`自分によいところ：${fmt(sw.value)}％`,`全国は${fmt(bw.value)}％（差${signed(delta(sw,bw))}pt）。自己肯定感に関わる1設問であり、心理尺度全体や診断結果ではありません。`,source(sw)],
 ['経年の読み方','正答率の上昇＝学力向上？','2024〜2026年度の国語・数学は問題が異なります。全国との差を年度ごとに見ることはできますが、同じ尺度で能力の変化を測った系列ではありません。','<a href="#trend">3年度の実数値と全国との差へ</a>']];
 $('cards').innerHTML=cards.map(([tag,title,body,src])=>`<article class="card"><span class="kicker">${year}年度 / ${tag}</span><h3>${title}</h3><p>${body}</p><span class="badge">観察・因果は未検証</span><div style="margin-top:12px">${src}</div></article>`).join('');
}
const trendQuestions=['mathLike','jpLike','study','agency','selfWorth','selfRegulation','review','discussion','ict','consult','breakfast','dream','mathUseful','jpUseful'];
function renderTrend(){const name=$('trendRegion').value,key=$('trendMetric').value,academic=key.startsWith('a:'),metric=academic?key.slice(2):key;
 const rows=['2024','2025','2026'].map(year=>{const rs=DATA.years[year],field=academic?'academic':'questions',r=rs[name][field][metric],b=rs['全国平均'][field][metric];return {year,r,b,d:delta(r,b)};});
 const textSame=!academic&&new Set(rows.map(p=>p.r.text)).size===1;
 $('trendNote').innerHTML=academic?'国語・数学は問題・難易度が毎年異なります。下の図は<strong>各年度の全国との差</strong>であり、等化された学力の推移ではありません。正答率そのものの上昇を能力向上と断定しません。':`3年度の${textSame?'質問文は同一':'質問文には違いがあります'}。回答割合（％）を表示し、別の生徒集団・調査条件の違いを踏まえて読みます。${metric==='ict'?'「週3回以上」の範囲を揃えていますが、2025年度から「ほぼ毎日」の区分が2つとなり選択肢構成が変わっています。':''}`;
 $('trendRows').innerHTML=rows.map(p=>`<tr><td>${p.year}</td><td>${fmt(p.r.value)}％${!academic?`<br><small>設問${escapeHTML(p.r.question)}</small>`:''}</td><td>${fmt(p.b.value)}％</td><td>${signed(p.d)}</td><td>${source(p.r)}${source(p.b)}</td></tr>`).join('');
 const values=rows.flatMap(p=>academic?[p.d]:[p.r.value,p.b.value]),low=Math.floor(Math.min(0,...values)-1),high=academic?Math.ceil(Math.max(0,...values)+1):100,W=860,H=280,L=65,R=35,T=30,B=55,x=i=>L+100+i*(W-L-R-200)/2,y=v=>H-B-(v-low)/(high-low)*(H-T-B);
 let svg=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${name}の3年度比較"><title>${name} ${academic?metric:DATA.metrics[metric].label}の年度比較</title>`;
 for(let i=0;i<=4;i++){const v=low+(high-low)*i/4;svg+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="#dbe4dd"/><text x="${L-12}" y="${y(v)+4}" text-anchor="end">${fmt(v)}</text>`;}
 rows.forEach((p,i)=>{const v=academic?p.d:p.r.value;svg+=`<circle cx="${x(i)}" cy="${y(v)}" r="7" fill="#16624e"/><text x="${x(i)}" y="${y(v)-12}" text-anchor="middle">${academic?signed(v):fmt(v)}</text><text x="${x(i)}" y="${H-20}" text-anchor="middle">${p.year}年度</text>`;if(!academic)svg+=`<circle cx="${x(i)}" cy="${y(p.b.value)}" r="5" fill="#bd7940"/><text x="${x(i)+20}" y="${y(p.b.value)+18}">${fmt(p.b.value)}</text>`;});
 $('trendChart').innerHTML=`<h3>${name} / ${academic?metric+'：全国との差（pt）':DATA.metrics[metric].label+'：回答割合（％）'}</h3>${svg}</svg><p class="tiny">濃緑：${name}${academic?' / 0は各年度の全国平均':' / 茶：全国（公立）'}。年度間を結ぶ線は描かず、各年度の観察値を表示。</p>`;
}
function render(){renderAcademic();renderQuestions();renderCorrelation();renderCards();}
setAcademicOptions();setQuestionOptions('questionMetric');setQuestionOptions('corrX');$('corrX').value='mathLike';
$('year').addEventListener('change',()=>{setAcademicOptions();setQuestionOptions('questionMetric');setQuestionOptions('corrX');render();});$('subject').addEventListener('change',renderAcademic);$('group').addEventListener('change',()=>{renderAcademic();renderQuestions();});$('questionMetric').addEventListener('change',renderQuestions);['corrX','corrY'].forEach(id=>$(id).addEventListener('change',renderCorrelation));
$('trendRegion').innerHTML=options(prefs);$('trendRegion').value='長野県';$('trendMetric').innerHTML=options(['a:国語','a:数学',...trendQuestions],k=>k.startsWith('a:')?k.slice(2)+'：全国との差':DATA.metrics[k].label);$('trendMetric').value='a:数学';['trendRegion','trendMetric'].forEach(id=>$(id).addEventListener('change',renderTrend));
$('population').innerHTML=['長野県',...peers].map(n=>`${n}：${DATA.population[n].toLocaleString('ja-JP')}人（長野との差${signed((DATA.population[n]/DATA.population['長野県']-1)*100)}％）`).join('<br>');
render();renderTrend();
