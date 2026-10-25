"""2026年度実施（2027年春入学）の仮募集枠と、提供元の参考偏差値を取得。
偏差値は普通・理数のうち元データに対応付けできた掲載値のみ。合格予測は行わない。
"""
import hashlib,json,pathlib,re,unicodedata
import requests,pdfplumber
from bs4 import BeautifulSoup
ROOT=pathlib.Path(__file__).resolve().parents[1]
URL='https://www.pref.nagano.lg.jp/kyoiku/koko/saiyo-nyuushi/shiken/ko/r9/documents/r9_yotei1_kekka.pdf'
SCORE_URL='https://www.asunaro-kk.com/hokuriku/nagano-public/'
def clean(s):return re.sub(r'\s+','',unicodedata.normalize('NFKC',s or '')).replace('ヶ','ケ')
def canon(s):return clean(s).replace('・','')
def number(s):
 t=clean(s).replace(',','');return int(t) if t.isdigit() else None
cache=ROOT/'scripts/cache';cache.mkdir(parents=True,exist_ok=True)
pdfpath=cache/'r9_yotei1_kekka.pdf'
if not pdfpath.exists():
 response=requests.get(URL,timeout=60);response.raise_for_status();pdfpath.write_bytes(response.content)
original=json.loads((ROOT/'data/admissions.json').read_text())
lookup={(clean(r['school']),canon(r['department'])):r for r in original['records']}
records=[];checks=[]
with pdfplumber.open(pdfpath) as pdf:
 for pi in range(1,5):
  school=dept='';group=[]
  for row in pdf.pages[pi].extract_tables()[0][2:]:
   if '合計' in clean(row[0]):
    for stage,col in [('early',3),('late',5)]:assert sum(r[stage]['capacity'] or 0 for r in group)==number(row[col]),(pi,stage,row)
    checks.append({'region':['北信','東信','南信','中信'][pi-1],'early_capacity':number(row[3]),'late_capacity':number(row[5])});continue
   if row[0]:school=clean(row[0]);dept=''
   if row[1]:dept=clean(row[1])
   has_capacity=number(row[3]) is not None or number(row[5]) is not None
   if not has_capacity:
    if group and (row[2] or row[1]):group[-1]['department']+='・'+clean(row[2] or row[1])
    continue
   if row[7] is None and group:
    prev=group[-1]
    for stage,col in [('early',3),('late',5)]:prev[stage]['capacity']=(prev[stage]['capacity'] or 0)+(number(row[col]) or 0)
    if row[2]:prev['department']+='・'+clean(row[2])
    prev['annual_capacity']=sum(prev[s]['capacity'] or 0 for s in ['early','late']);continue
   department=dept+('/'+clean(row[2]) if row[2] else '')
   r=dict(year=2027,school=school,school_id=school,department=department,program_id='',region=['北信','東信','南信','中信'][pi-1],course='全日制',annual_capacity=sum(number(row[col]) or 0 for col in [3,5]),enrolled=None,additional_accepted=None,status='provisional_capacity',source_id='capacity-provisional-2027',source_page=pi+1,as_of='2026-10-23')
   for stage,col in [('early',3),('late',5)]:r[stage]=dict(capacity=number(row[col]),applicants=None,examinees=None,accepted=None)
   group.append(r);records.append(r)
for r in records:
 old=lookup.get((clean(r['school']),canon(r['department'])))
 if old:r['department']=old['department'];r['program_id']=clean(old['school'])+'|'+old['program_id'].split('|',1)[1]
 else:r['program_id']=r['school']+'|'+canon(r['department'])
assert len({r['program_id'] for r in records})==len(records)
source=dict(id='capacity-provisional-2027',title='令和9年度入学志願予定数調査・募集人員の仮値（2026年度実施）',url=URL,published='2026-10-23',accessed='2026-10-25',sha256=hashlib.sha256(pdfpath.read_bytes()).hexdigest())
meta=dict(admission_year=2027,exam_fiscal_year=2026,status='provisional_capacity',checked_at='2026-10-25',note='募集枠のみを収録。前年定員と新しい募集枠から算出した仮値。正式な募集定員は2026年11月に決定予定。志願予定調査を確定志願者として収録しない。',sources=[source],records=records,checks=checks)
(ROOT/'data/current-capacity.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
response=requests.get(SCORE_URL,timeout=60);response.raise_for_status();soup=BeautifulSoup(response.content,'html.parser')
assert '2026年度' in soup.get_text()
score_records=[]
for tr in soup.select('table')[0].select('tr')[1:]:
 cells=[c.get_text(' ',strip=True) for c in tr.select('td')]
 if len(cells)!=6 or not cells[0].isdigit() or cells[3] not in ['普通','理数']:continue
 school=clean(cells[2]);department=clean(cells[3])
 if (school,department) in lookup:score_records.append(dict(school=school,department=department,value=int(cells[0])))
assert len({(r['school'],r['department']) for r in score_records})==len(score_records)
scores=dict(provider='家庭教師のあすなろ 北陸・甲信',edition='2026年度入学向け版',checked_at='2026-10-25',source_url=SCORE_URL,scope='対応付けを確認できた普通・理数の掲載値。民間の独自調査による参考値で、県公式統計ではない。',records=score_records)
(ROOT/'data/deviation-latest.json').write_text(json.dumps(scores,ensure_ascii=False,indent=2))
print(f'provisional: {len(records)} programs, {len(checks)} district totals checked; deviation: {len(score_records)} matched programs')
