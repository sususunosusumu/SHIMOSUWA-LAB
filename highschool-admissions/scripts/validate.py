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

private=json.loads((root/'data/private-admissions.json').read_text())
private_records=private['records']
assert len(private_records)==130
assert len({(r['year'],r['program_id']) for r in private_records})==130
assert {r['year'] for r in private_records}==set(range(2021,2027))
private_sources={s['id'] for s in private['sources']}
for r in private_records:
    assert set(r.get('source_ids',[r['source_id']]))<=private_sources
    assert set(r.get('field_sources',{}).values())<=private_sources
    if r['year']<2026:
        assert r['early']['examinees'] is None and r['late']['examinees'] is None
    assert r['enrolled'] is None and r['late']['accepted'] is None
with (root/'data/private-admissions.csv').open(encoding='utf-8-sig',newline='') as f:
    exported=list(csv.DictReader(f))
assert len(exported)==len(private_records)
for row,r in zip(exported,private_records):
    assert int(row['入学年'])==r['year'] and row['学校']==r['school'] and row['学科']==r['department']
    for column,key in [('推薦志願','applicants'),('推薦受験','examinees'),('推薦合格','accepted')]:
        assert row[column]==('' if r['early'][key] is None else str(r['early'][key]))
print('PASS: 130 private school/program-year records; six years, provenance, missing outcomes and CSV consistent')
