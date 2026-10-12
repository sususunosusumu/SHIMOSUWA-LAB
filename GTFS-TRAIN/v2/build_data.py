"""Rebuild reference data without inventing stops, endpoints or calendar exceptions."""
import csv, io, json, zipfile, hashlib
from pathlib import Path
from collections import defaultdict, Counter
base=Path(__file__).resolve().parent
archive=base.parent/'jr_east_chuo_shinonoi_gtfs_coord_verified_clean.zip'
z=zipfile.ZipFile(archive)
def rows(name): return list(csv.DictReader(io.StringIO(z.read(name).decode('utf-8-sig'))))
stops={s['stop_id']:s['stop_name'] for s in rows('stops.txt')}
by=defaultdict(list)
for s in rows('stop_times.txt'):
 by[s['trip_id']].append([stops[s['stop_id']],s['arrival_time'],s['departure_time'],int(s['stop_sequence'])])
trips=[]
for t in rows('trips.txt'):
 ss=sorted(by[t['trip_id']],key=lambda s:s[3])
 if not ss: continue
 trips.append({'id':t['trip_id'],'number':t['trip_short_name'],'name':t['trip_headsign'],'service':t['service_id'],'direction':'up' if t['route_id'].endswith('_UP') else 'down','stops':[s[:3] for s in ss]})
counts=Counter((t['service'],t['direction'],t['number']) for t in trips)
for t in trips: t['duplicate']=counts[t['service'],t['direction'],t['number']]>1
data={'stations':list(stops.values()),'calendar':rows('calendar.txt'),'exceptions':rows('calendar_dates.txt'),'trains':trips}
(base/'data.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
print(f'{len(trips)} records; SHA256 {hashlib.sha256(archive.read_bytes()).hexdigest()}')
