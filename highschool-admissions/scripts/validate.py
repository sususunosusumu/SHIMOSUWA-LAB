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
