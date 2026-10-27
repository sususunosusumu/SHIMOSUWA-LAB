"""Rebuild only Azami rows; retain each archive's Swan rows verbatim as field values."""
import csv,io,json,zipfile,hashlib,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
src=json.loads((ROOT/'data/azami-202610.json').read_text())
raw=json.loads((ROOT.parent/'GIS/shimosuwa_azami_bus_stops_raw.json').read_text())
old=json.loads((ROOT.parent/'commute/data.json').read_text())
holidays=set(old['holidays'])
names=list(dict.fromkeys(r['stop'] for t in src['tables'] for r in t['rows']))
# The municipal GIS export is dated 2024-09-05. Do not promote it to Oct-2026 surveyed positions.
provided=json.loads((ROOT/'data/stop-coordinates.json').read_text())
coordinates=provided['stops']
municipal=json.loads((ROOT/'data/municipal-stop-coordinates.json').read_text())
audit=[]
for i,name in enumerate(names,1):
 alias={'下諏訪向陽高校':'下諏訪町向陽高校','AQUA未来':'ＡＱＵＡ未来','ゆたん歩ﾟ':'ゆたん歩゜','北小校庭入口':'北小学校入口'}.get(name,name)
 points=[{'uid':x['uid'],'lat':x['latitude'],'lon':x['longitude']} for x in raw['items'] if x['stop_name']==alias]
 audit.append(dict(stop_id=f'AZAMI_S{i:04}',stop_name=name,status='existing_gis_position_unverified_202610' if points else 'position_unverified',reference_points=points))
for stop in audit:
 if stop['stop_name'] in coordinates:
  stop.update(status='user_google_maps_20261027',coordinates=coordinates[stop['stop_name']],coordinate_source=provided['source'],coordinate_date=provided['providedDate'],map_points=[coordinates[stop['stop_name']]])
 elif stop['stop_name'] in municipal['stops']:
  points=municipal['stops'][stop['stop_name']]
  stop.update(status='official_kml_existing_representative',coordinates=points[0],map_points=points,coordinate_source=municipal['source'],coordinate_date=municipal['documentDate'],position_note='公式既存点・移設および方向別乗り場は未確認。時刻表は名称単位で共通。')
(ROOT/'data/stop-location-audit.json').write_text(json.dumps({'gisPublished':'2024-09-05','gisUrl':'https://www2.wagmap.jp/shimosuwa/OpenDataDetail?lid=20&mids=20','note':'PDF路線図は模式図。10停留所は利用者提供座標。残る69停留所は町公式KMLの既存点を採用。方向別乗り場・改正後の移設有無は未検証。既存GIS点の平均化や測地系変換、新規座標の推定を行わない。','stops':audit},ensure_ascii=False,indent=2)+'\n')
ids={x['stop_name']:x['stop_id'] for x in audit}
def decode(b):return list(csv.DictReader(io.StringIO(b.decode('utf-8-sig'))))
def encode(rows,fields=None):
 out=io.StringIO(newline='');fields=fields or list(dict.fromkeys(k for r in rows for k in r));w=csv.DictWriter(out,fieldnames=fields,lineterminator='\n');w.writeheader();w.writerows(rows);return out.getvalue().encode()
archives=['ccby4_azami_all_routes_gtfs.zip','ccby4_shimosuwa_suwa_all_routes_gtfs.zip','shimosuwa_azami_swan_merged_gtfs_v6.zip']
for file in archives:
 with zipfile.ZipFile(io.BytesIO(subprocess.check_output(['git','-C',str(ROOT.parent),'show','HEAD:GTFS/'+file]))) as z: contents={n:z.read(n) for n in z.namelist()}
 pref='AZAMI_' if file.startswith('shimosuwa_') else ''
 oldrows={n:decode(contents[n]) for n in ['routes.txt','trips.txt','stops.txt','stop_times.txt','calendar.txt','calendar_dates.txt'] if n in contents}
 swroutes=[r for r in oldrows['routes.txt'] if r['route_id'].startswith('SWAN_')];sr={r['route_id'] for r in swroutes}
 swtrips=[r for r in oldrows['trips.txt'] if r['route_id'] in sr];ti={r['trip_id'] for r in swtrips};sv={r['service_id'] for r in swtrips}
 swtimes=[r for r in oldrows['stop_times.txt'] if r['trip_id'] in ti];si={r['stop_id'] for r in swtimes}
 swstops=[r for r in oldrows['stops.txt'] if r['stop_id'] in si];swcal=[r for r in oldrows['calendar.txt'] if r['service_id'] in sv];swdates=[r for r in oldrows.get('calendar_dates.txt',[]) if r['service_id'] in sv]
 agency=next(r['agency_id'] for r in oldrows['routes.txt'] if r['route_id'].startswith('AZAMI_'))
 routes=[];trips=[];times=[];seen=set()
 for t in src['tables']:
  rid=pref+'AZAMI_'+t['key']
  if rid not in seen:routes.append(dict(route_id=rid,agency_id=agency,route_short_name=t['name'],route_long_name='あざみ号 '+t['name'],route_type='3'));seen.add(rid)
  for col,(n,service) in enumerate(zip(t['numbers'],t['services'])):
   trip_id=rid+f'_{n:02}'
   trips.append(dict(route_id=rid,service_id='AZAMI_'+{'daily':'DAILY','weekday':'WKD','holiday':'WEEKEND'}[service],trip_id=trip_id,trip_headsign=f'{t["name"]} {n}便（{t["direction"]}）',trip_short_name=str(n)))
   rows=[r for r in t['rows'] if r['times'][col]]
   for seq,r in enumerate(rows,1):
    tm=r['times'][col].zfill(5)+':00'
    times.append(dict(trip_id=trip_id,arrival_time=tm,departure_time=tm,stop_id=ids[r['stop']],stop_sequence=str(seq),pickup_type='1' if seq==len(rows) else '0',drop_off_type='1' if seq==1 else '0'))
 stops=[dict(stop_id=x['stop_id'],stop_name=x['stop_name'],stop_lat=str(x['coordinates']['lat']) if 'coordinates' in x else '',stop_lon=str(x['coordinates']['lon']) if 'coordinates' in x else '',location_source=x['status'],source_points=str(len(x.get('map_points',[]))),location_points=json.dumps(x.get('map_points',[]),separators=(',',':'))) for x in audit]
 cal=[]
 for service,days in [('DAILY',[1]*7),('WKD',[1]*5+[0,0]),('WEEKEND',[0]*5+[1,1])]:
  cal.append(dict(service_id='AZAMI_'+service,**dict(zip(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'],map(str,days))),start_date='20261020',end_date='20270331'))
 dates=[]
 import datetime
 for d in sorted(holidays):
  if '2026-10-20'<=d<='2027-03-31' and datetime.date.fromisoformat(d).weekday()<5:
   for service,typ in [('WKD','2'),('WEEKEND','1')]:dates.append(dict(service_id='AZAMI_'+service,date=d.replace('-',''),exception_type=typ))
 for name,rows in [('routes.txt',routes+swroutes),('trips.txt',trips+swtrips),('stops.txt',stops+swstops),('stop_times.txt',times+swtimes),('calendar.txt',cal+swcal),('calendar_dates.txt',dates+swdates)]:contents[name]=encode(rows)
 contents['README.txt']='あざみ号: 2026-10-20改正、PDF pp.5-9全30便。10停留所は利用者提供座標、69停留所は町公式KMLの既存点を収録。複数点のある名称は先頭の公式点を名称共通の代表点とし、全点をlocation_pointsに保存。方向別の乗り場・改正後の移設有無・道路形状は未確認。スワンバスの既存行は変更していません。\n'.encode()
 with zipfile.ZipFile(ROOT/file,'w',zipfile.ZIP_DEFLATED) as z:
  for n,b in contents.items():z.writestr(n,b)
 print(file,len(routes),len(trips),len(stops),len(times))
# Other app carries an independent copy of Takei schedule.
t=next(t for t in src['tables'] if t['key']=='TAKEI');school=next(r for r in t['rows'] if r['stop']=='下諏訪向陽高校')
old['verified']='2026-10-27';old['busValidFrom']='2026-10-20';old['bus']=[dict(name=f'武居線 {n}便',service=t['services'][i],station=t['rows'][0]['times'][i].zfill(5),school=school['times'][i].zfill(5),**{'return':t['rows'][-1]['times'][i].zfill(5)}) for i,n in enumerate(t['numbers'])]
old['busSource']='https://www.town.shimosuwa.lg.jp/www/contents/1001000000461/index.html';old['notes']='2026年10月20日改正。添付PDF6ページの武居線全7便を転記。高校の時刻はPDF記載の単一時刻を使用。'
(ROOT.parent/'commute/data.json').write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n')
