"""Run: python3 band-history-v2/validate.py [path/to/data.json]. No dependencies."""
import json, sys
from pathlib import Path
p=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).with_name('data.json')
d=json.loads(p.read_text(encoding='utf-8'))
keys=('schools','conductors','works','events','sources','performances')
ids={k:{x['id'] for x in d[k]} for k in keys}
for k in keys:
 assert len(ids[k])==len(d[k]),f'Duplicate ID in {k}'
assert d['defaultSchoolId'] in ids['schools']
for k in keys:
 for x in d[k]:
  for s in x.get('sourceIds',[]):assert s in ids['sources'],(k,x['id'],s)
for r in d['performances']:
 assert r['schoolId'] in ids['schools']
 assert r['eventId'] in ids['events']
 assert not r['conductorId'] or r['conductorId'] in ids['conductors']
 assert r['status'] in ('確認済み','一部確認','未確認')
 assert r['sourceIds'],r['id']
 assert r['recommendation'] in (True,False,None)
 for p in r['pieces']:assert not p['workId'] or p['workId'] in ids['works']
for s in d['sources']:assert s['url'].startswith('https://')
for c in d['conductors']:
 assert c['schoolId'] in ids['schools']
 for a in c['appointments']:
  assert a.get('sourceIds'),'Appointment requires published evidence'
print('PASS: unique IDs, references, source URLs, default school, evidence for appointments')
print(', '.join(f'{k}: {len(d[k])}' for k in keys))
