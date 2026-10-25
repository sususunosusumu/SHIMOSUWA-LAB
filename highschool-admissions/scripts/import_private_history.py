import json,re,unicodedata
from pathlib import Path
import pdfplumber
import argparse,requests
parser=argparse.ArgumentParser(description='私立の2021〜2025年春入学資料を取り込み、県総数と照合')
parser.add_argument('--cache',default=str(Path(__file__).parent/'cache/private-history'))
args=parser.parse_args()
root=Path(__file__).resolve().parents[1];cache=Path(args.cache);cache.mkdir(parents=True,exist_ok=True)
manifest=json.load(open(Path(__file__).with_name('private-history-sources.json')))
for m in manifest:
 m['path']=str(cache/m['path'])
 if not Path(m['path']).exists():
  response=requests.get(m['url'],timeout=60);response.raise_for_status();Path(m['path']).write_bytes(response.content)
payload=json.load(open(root/'data/private-admissions.json'));payload['records']=[r for r in payload['records'] if r['year']==2026];payload['sources']=[s for s in payload['sources'] if s['id']=='private2026']
regions={r['school']:r['region'] for r in payload['records']};regions['長野女子']='北信'
clean=lambda s:unicodedata.normalize('NFKC',re.sub(r'\s','',s or ''))
def nums(s):return [int(v.replace(',','')) for v in re.findall(r'\d[\d,]*',s or '')]
def num(s):
 v=nums(s);return v[0] if v else None
def total(vs):return sum(v for v in vs if v is not None) if any(v is not None for v in vs) else None
def source(m,kind,year=None):
 y=year or m['year'];sid=f'private{y}-{kind}';o=dict(id=sid,title=f'{y}年春入学・私立 {kind} / '+m['title'],url=m['url']);payload['sources'].append(o);return sid
# source configuration; 2023推薦は翌年資料の前年欄で再確認。
configs=[(2021,'2021_1.pdf',1,4,6),(2022,'2022_4.pdf',0,4,6),(2023,'2024_7.pdf',0,6,9),(2024,'2024_7.pdf',0,4,7),(2025,'2025_11.pdf',0,4,5)]
records=[];checks=[]
for year,file,page,ac,cc in configs:
 m=next(m for m in manifest if m['path'].endswith(file));sid=source(m,'推薦志願・合格'+('（前年欄）' if year==2023 else ''),year)
 table=pdfplumber.open(cache/file).pages[page].extract_tables()[0];school=dep=None;yearrows=[]
 for a in table:
  schooltext=clean(a[0])
  if schooltext=='合計':
   expected=[num(a[ac]),num(a[cc])];break
  if schooltext in regions:school=schooltext
  elif schooltext:continue
  if not school:continue
  if clean(a[1]):dep=clean(a[1])
  if dep=='計' or not dep:continue
  if year>=2024 and school=='長野女子':continue
  if year==2022 and dep in ['マンガ・イラスト','環境福祉']:continue
  key=(school,dep)
  r=next((r for r in yearrows if (r['school'],r['department'])==key),None)
  if not r:
   r=dict(year=year,school=school,school_id='private|'+school,department=dep,program_id='private|'+school+'|'+dep,region=regions[school],sector='private',course='全日制',annual_capacity=num(a[2]),enrolled=None,additional_accepted=None,early=dict(capacity=None,applicants=None,examinees=None,accepted=None),late=dict(capacity=None,applicants=None,examinees=None,accepted=None),status='private_snapshot',source_id=sid,source_ids=[sid],source_page=page+1,as_of=f'{year}年推薦・一般の各公表時点',field_sources={'early.applicants':sid,'early.accepted':sid,'annual_capacity':sid});yearrows.append(r)
  app=total(nums(a[ac]));acc=num(a[cc])
  r['early']['applicants']=total([r['early']['applicants'],app]);r['early']['accepted']=total([r['early']['accepted'],acc])
 # 2023は前年欄に対応する学科別年間定員を当年高校要覧で照合。ウェルネスは定員定義が違うため年間定員を未収録にする。
 if year==2023:
  cm=next(m for m in manifest if m['year']==2023);csid=source(cm,'年間定員（高校要覧）',year)
  mapping={'長野清泉':'長野清泉女学院','文化長野':'文化学園長野','長野日大':'長野日本大学','東海大諏訪':'東海大学付属諏訪','東京都市大塩尻':'東京都市大学塩尻'};school2='';caps={}
  for a in pdfplumber.open(cm['path']).pages[0].extract_tables()[0][3:]:
   if clean(a[0])=='合計':break
   if clean(a[0]):school2=mapping.get(clean(a[0]),clean(a[0]))
   caps[(school2,clean(a[1]))]=num(a[2])
  for r in yearrows:
   r['annual_capacity']=caps.get((r['school'],r['department'])) if r['school']!='日本ウェルネス長野' else None
   r['field_sources']['annual_capacity']=csid;r['source_ids'].append(csid)
 # red correction: 621 is the corrected value; 705 is struck through. parser num() takes the first.
 got=[sum(r['early'][k] or 0 for r in yearrows) for k in ['applicants','accepted']]
 assert got==expected,(year,got,expected)
 checks.append(dict(year=year,phase='early',applicants=got[0],accepted=got[1],source_id=sid))
 records.extend(yearrows)
# 一般は2023の前年欄を2024資料から採用（当年欄との年度を混同しない）。
for year,file,page,appcol,capcol in [(2021,'2021_0.pdf',1,3,2),(2022,'2022_3.pdf',0,3,2),(2023,'2024_6.pdf',0,5,None),(2024,'2025_9.pdf',0,5,None),(2025,'2025_9.pdf',0,3,2)]:
 m=next(m for m in manifest if m['path'].endswith(file));sid=source(m,'一般志願'+('（前年欄）' if capcol is None else ''),year)
 tables=pdfplumber.open(cache/file).pages[page].extract_tables();t=tables[0];school=None;dep=None;expected=None
 # 2021一般は12列。翌年と同じ志願者列3だが空結合列あり。ヘッダで調整。
 for a in t:
  txt=clean(a[0])
  if txt=='合計':expected=num(a[appcol]);break
  if txt in regions:school=txt
  elif txt:continue
  if not school:continue
  if clean(a[1]):dep=clean(a[1])
  if not dep or dep=='計':continue
  r=next((r for r in records if r['year']==year and r['school']==school and clean(r['department'])==dep),None)
  if not r:continue
  r['late']['applicants']=num(a[appcol]);r['field_sources']['late.applicants']=sid;r['source_ids'].append(sid)
  # 複数学科の共同募集枠は学科別に割り振らない。単独学科の学校のみ取り込む。
  same=[x for x in records if x['year']==year and x['school']==school]
  if capcol is not None and len(same)==1:r['late']['capacity']=num(a[capcol]);r['field_sources']['late.capacity']=sid
 for r in records:
  if r['year']==year and r['department']=='探究創造':r['late']['applicants']=0;r['field_sources']['late.applicants']=sid;r['source_ids'].append(sid)
 got=sum(r['late']['applicants'] or 0 for r in records if r['year']==year)
 assert got==expected,(year,got,expected,[(r['school'],r['department'],r['late']['applicants']) for r in records if r['year']==year])
 checks.append(dict(year=year,phase='late',applicants=got,source_id=sid))
# 2025一般の共同集計は個別学科の人数に見せず、全構成学科を選んだ集計時だけ使用。
for school,deps,n in [('松商学園',['普通','商業'],125),('エクセラン',['普通','美術','福祉'],15)]:
 group=dict(id=f'2025|{school}|late',program_ids=['private|'+school+'|'+d for d in deps],applicants=n)
 for r in records:
  if r['year']==2025 and r['school']==school and r['department'] in deps:r['late']['applicants']=None;r['late']['applicant_group']=group
payload['records']=sorted(records+payload['records'],key=lambda r:(r['year'],r['school'],r['department']));payload['checks']=checks
payload['notes']=['2020〜2025年度実施・2021〜2026年春入学の私立全日制。各年の公表時点の値。年末確定実績ではない。','2023推薦・一般、2024一般は翌年資料の前年欄から収録。2024一般は伊那西34人を含む3,550人に更新。2022一般は伊那西受付前につき未収録。','2025推薦合格は2026年再掲の訂正値5,053人。旧値5,137人を使用しない。','過年度の推薦資料には一般入試や特別入試が含まれる学校があり、公表資料の区分に従う。私立の推薦と一般の実施方式は年度で異なる。','2021〜2025年春入学の受験者・一般合格・実入学は学校学科別の対象資料に欄がないためnull。第1学年生徒数を実入学者数に代用しない。','2023年間定員は高校要覧の第1学年募集定員を照合。日本ウェルネス長野は入試資料30人と要覧80人で定義差があるため、この年の年間定員はnull。','共同募集の一般枠は学科に割り振らない。2024一般の前年欄には一般募集枠の正確な人数がないため取り込まない。','長野女子の募集停止後の年度、松本国際の廃止学科は入試実績行を作らない。ISAKジャパンは推薦・一般の県資料対象外。']
(root/'data/private-admissions.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
print('CHECKS',checks);print('RECORDS',len(payload['records']))

from export_private_csv import export_private_csv
export_private_csv(root,payload)
