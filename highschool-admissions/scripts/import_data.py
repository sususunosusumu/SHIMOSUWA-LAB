"""pip install requests beautifulsoup4 pdfplumber; python scripts/import_data.py [PDF cache directory]"""
import csv,hashlib,json,pathlib,re,sys,datetime,unicodedata
import pdfplumber,requests
ROOT=pathlib.Path(__file__).resolve().parents[1]
CACHE=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'scripts'/'cache'
CACHE.mkdir(parents=True,exist_ok=True)
def clean(s):return re.sub(r'\s+','',s or '')
def num(s):
 s=(s or '').strip().replace(',','')
 if '\n' in s:
  parts=s.splitlines()
  if all(x.strip().isdigit() for x in parts):return sum(int(x.strip()) for x in parts)
 s=clean(s)
 return int(s) if s.isdigit() else None
records=[];sources=[];checks=[]
for era in range(3,9):
 year=2018+era; url=f'https://www.pref.nagano.lg.jp/kyoiku/koko/gyose/zenpan/tokei/ko/documents/r{era}_15'+('_1' if era==3 else '')+'.pdf'
 path=CACHE/f'{era}_entry.pdf'
 if not path.exists():
  r=requests.get(url,timeout=60);r.raise_for_status();path.write_bytes(r.content)
 sid=f'yearbook-{year}-15';sources.append(dict(id=sid,title=f'令和{era}年度 高等学校要覧 15 学校別入学状況（公立）',url=url,accessed='2026-10-24',sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
 with pdfplumber.open(path) as pdf:
  for pi,page in enumerate(pdf.pages[:4]):
   school='';dept=''; group=[]
   for row in page.extract_tables()[0][2:]:
    if len(row)!=19:raise ValueError(row)
    if any('計' in clean(x) for x in row[:3]):
     if clean(row[1])=='小計':
      expected=num(row[5]); actual=sum(x['annual_capacity'] for x in group)
      assert actual==expected,(year,pi,actual,expected)
      for key,col in [('enrolled',17),('additional_accepted',16)]:
       assert sum(x[key] or 0 for x in group)==num(row[col]),(year,pi,key,sum(x[key] or 0 for x in group),row[col])
      for stage,start in [('early',6),('late',11)]:
       for i,key in enumerate(['capacity','applicants','examinees','accepted']):
        total=sum(x[stage][key] or 0 for x in group)
        assert total==num(row[start+i]),(year,pi,stage,key,total,row[start+i])
      checks.append(dict(year=year,page=pi+1,capacity=actual,checked_fields=11))
     continue
    if row[2]:school=clean(row[2]);dept=''
    if row[3]:dept=clean(row[3])
    if num(row[5]) is None:
     if group and num(row[7]) is not None:
      last=group[-1]
      for stage,start in [('early',6),('late',11)]:
       for key,i in [('applicants',1),('examinees',2),('accepted',3)]:
        v=num(row[start+i])
        if v is not None:last[stage][key]=(last[stage][key] or 0)+v
      for key,i in [('enrolled',17),('additional_accepted',16)]:last[key]=(last[key] or 0)+(num(row[i]) or 0)
     elif group and (row[4] or row[3]) and clean(row[4] or row[3]) not in group[-1]['department']:
      last=group[-1];last['department']+='・'+clean(row[4] or row[3]);last['program_id']=last['school']+'|'+last['department']
     continue
    assert school and dept,(year,row)
    department=dept+('／'+clean(row[4]).replace('　','') if row[4] else '')
    identity=school+'|'+department
    r=dict(year=year,school=school,department=department,school_id=school,program_id=identity,region=['北信','東信','南信','中信'][pi],course='全日制',annual_capacity=num(row[5]),enrolled=num(row[17]),additional_accepted=num(row[16]) or 0,source_id=sid,source_page=pi+1,early={},late={})
    for stage,start in [('early',6),('late',11)]:
     r[stage]={key:num(row[start+i]) for i,key in enumerate(['capacity','applicants','examinees','accepted'])}
     # Blank early cells mean selection not offered, not a zero observation.
    records.append(r);group.append(r)
# Normalize typographic variants, retaining source labels for audit. No school mergers are inferred.
labels={}
for r in records:
 canonical=unicodedata.normalize('NFKC',r['department']).replace('・','')
 r['source_department']=r['department'];r['program_id']=r['school']+'|'+canonical
 labels[r['program_id']]=unicodedata.normalize('NFKC',r['department'])
for r in records:r['department']=labels[r['program_id']]
meta=dict(schema_version=1,updated='2026-10-24',years=list(range(2021,2027)),requested_start_year=1990,coverage='公立全日制・要覧の募集単位（共同募集は分割しない）',records=records,sources=sources,checks=checks,notes=['前期・後期の志願者は延べ数。実人数として合算しない。','倍率は志願者数÷募集人員を再計算。要覧掲載倍率と定義・数値が異なる場合がある。','実入学者数は5月1日現在。内進生・再募集を含む場合がある。','学科名・募集単位が変わった場合は別系列。改称や統合を自動接続しない。','地域は資料の4通学区を北信・東信・南信・中信に対応付けたもの。','定員割れは実入学者数＜年間募集定員。合否の難易度を示すものではない。'])
(ROOT/'data'/'admissions.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
with (ROOT/'data'/'admissions.csv').open('w',newline='',encoding='utf-8-sig') as f:
 fields=['year','school','department','region','course','annual_capacity','enrolled','additional_accepted','source_id','source_page']+[s+'_'+k for s in ['early','late'] for k in ['capacity','applicants','examinees','accepted']]
 w=csv.DictWriter(f,fieldnames=fields);w.writeheader()
 for r in records:w.writerow({k:r[k] if k in r else r[k.split('_')[0]][k.split('_')[1]] for k in fields})
print(f'{len(records)} rows; {len(checks)} district totals checked')
