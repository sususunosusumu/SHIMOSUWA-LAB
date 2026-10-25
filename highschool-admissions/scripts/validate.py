import csv,json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
d=json.loads((root/'data/admissions.json').read_text());ids={s['id'] for s in d['sources']};keys=set()
for r in d['records']:
 k=(r['year'],r['program_id']);assert k not in keys,k;keys.add(k)
 assert r['source_id'] in ids and 1<=r['source_page']<=4
 for v in [r['annual_capacity'],r['enrolled'],r['additional_accepted']]+list(r['early'].values())+list(r['late'].values()):assert v is None or (isinstance(v,int) and v>=0),(k,v)
assert sorted({r['year'] for r in d['records']})==d['years']
assert len(d['checks'])==24
rows=list(csv.DictReader((root/'data/admissions.csv').open(encoding='utf-8-sig')))
assert len(rows)==len(d['records'])
for a,b in zip(d['records'],rows):
 for k,v in b.items():
  expected=a[k] if k in a else a[k.split('_')[0]][k.split('_')[1]]
  assert v==('' if expected is None else str(expected)),(k,v,expected)
print(f"PASS: {len(keys)} unique records, 24 district checks, JSON/CSV consistent")
# Supplemental current-year records contain provisional capacities, never admissions results.
plans=json.loads((root/'data/current-capacity.json').read_text())
assert plans['exam_fiscal_year']==plans['admission_year']-1==2026
assert len(plans['checks'])==4
assert len({r['program_id'] for r in plans['records']})==len(plans['records'])
for r in plans['records']:
 assert r['year']==2027 and r['status']=='provisional_capacity'
 assert r['enrolled'] is None and r['additional_accepted'] is None
 assert all(r[s][k] is None for s in ['early','late'] for k in ['applicants','examinees','accepted'])
 assert r['annual_capacity']==sum(r[s]['capacity'] or 0 for s in ['early','late'])
for c in plans['checks']:
 for s in ['early','late']:
  assert sum(r[s]['capacity'] or 0 for r in plans['records'] if r['region']==c['region'])==c[s+'_capacity']
scores=json.loads((root/'data/deviation-latest.json').read_text())
assert scores['source_url'].startswith('https://www.asunaro-kk.com/')
assert len({(r['school'],r['department']) for r in scores['records']})==len(scores['records'])
assert all(0<r['value']<100 and r['department'] in ['普通','理数'] for r in scores['records'])
print(f"PASS: {len(plans['records'])} capacity-only provisional records; {len(scores['records'])} sourced latest deviation values")
