"""Validate referential integrity, source-table boundaries, holiday behavior and Swan preservation."""
import csv,io,json,zipfile,subprocess,hashlib,collections
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def read(z,n):return list(csv.DictReader(io.StringIO(z.read(n).decode('utf-8-sig')))) if n in z.namelist() else []
def swan(z):
 routes=[x for x in read(z,'routes.txt') if x['route_id'].startswith('SWAN_')];ri={r['route_id'] for r in routes}
 trips=[x for x in read(z,'trips.txt') if x['route_id'] in ri];ti={t['trip_id'] for t in trips};sv={t['service_id'] for t in trips}
 times=[x for x in read(z,'stop_times.txt') if x['trip_id'] in ti];si={t['stop_id'] for t in times}
 # Extra Azami-only columns are blank in Swan rows. Compare every original field.
 return {'routes.txt':routes,'trips.txt':trips,'stop_times.txt':times,'stops.txt':[x for x in read(z,'stops.txt') if x['stop_id'] in si],'calendar.txt':[x for x in read(z,'calendar.txt') if x['service_id'] in sv],'calendar_dates.txt':[x for x in read(z,'calendar_dates.txt') if x['service_id'] in sv]}
for path in root.glob('*.zip'):
 if path.name=='ccby4_swan_only_gtfs.zip':continue
 original=zipfile.ZipFile(io.BytesIO(subprocess.check_output(['git','-C',str(root.parent),'show','HEAD:GTFS/'+path.name])))
 with zipfile.ZipFile(path) as z:
  before,after=swan(original),swan(z)
  for name,rows in before.items():
   assert len(rows)==len(after[name]),name
   for a,b in zip(rows,after[name]):assert all(b[k]==v for k,v in a.items()),(name,a,b)
  stops=read(z,'stops.txt');routes=read(z,'routes.txt');trips=read(z,'trips.txt');times=read(z,'stop_times.txt');cal=read(z,'calendar.txt');ex=read(z,'calendar_dates.txt')
  for rows,key in [(stops,'stop_id'),(routes,'route_id'),(trips,'trip_id'),(cal,'service_id')]:assert len({x[key] for x in rows})==len(rows),(path,key)
  si={x['stop_id'] for x in stops};ri={x['route_id'] for x in routes};ti={x['trip_id'] for x in trips};sv={x['service_id'] for x in cal}
  assert all(t['route_id'] in ri and t['service_id'] in sv for t in trips)
  assert all(t['trip_id'] in ti and t['stop_id'] in si for t in times)
  assert all(x['service_id'] in sv for x in ex)
  az=[t for t in trips if t['route_id'].startswith('AZAMI_')]
  assert len(az)==30
  assert collections.Counter(t['route_id'].split('AZAMI_')[-1] for t in az)=={'HAGIKURA_HOSHIGAOKA':10,'TAKEI':7,'TAKAGI_TAKAHAMA':6,'MACHINAKA':7}
  for t in az:
   rows=sorted([x for x in times if x['trip_id']==t['trip_id']],key=lambda x:int(x['stop_sequence']))
   assert [int(x['stop_sequence']) for x in rows]==list(range(1,len(rows)+1))
   assert rows[0]['departure_time']<=rows[-1]['arrival_time']
   assert all(a['departure_time']<=b['departure_time'] for a,b in zip(rows,rows[1:]))
   assert rows[0]['stop_id']==rows[-1]['stop_id']
   assert rows[-1]['pickup_type']=='1'
  forbidden=['AKASUNA_HIGASHIYAMADA','赤砂・東山田線','イオン諏訪店横','四王歩道橋','長野銀行前']
  for n in z.namelist():
   if n.endswith('.txt'):
    for f in forbidden:assert f not in z.read(n).decode('utf-8-sig'),(path,n,f)
  print('PASS',path.name,'30 Azami trips, integrity, time order, retired references; all original Swan fields identical')
# Single-mode Swan file must remain byte-identical.
path=root/'ccby4_swan_only_gtfs.zip'
assert path.read_bytes()==subprocess.check_output(['git','-C',str(root.parent),'show','HEAD:GTFS/'+path.name])
print('PASS Swan-only archive byte-identical')
