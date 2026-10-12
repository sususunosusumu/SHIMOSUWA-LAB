"""Refresh October 2026 official train pages; never infer operation dates."""
import json,re,urllib.request,concurrent.futures,datetime
from pathlib import Path
root=Path(__file__).parent
old=json.loads((root.parent/'train/schedule.json').read_text())
def load(t):
 html=urllib.request.urlopen(t['source'],timeout=25).read().decode('utf-8')
 dates=set()
 for caption,body in re.findall(r'<caption>(\d{4}年\d+月)</caption>(.*?)</table>',html,re.S):
  year,month=map(int,re.findall(r'\d+',caption))
  for d in re.findall(r'<td class="ok">\s*<span[^>]*>\s*(\d+)',body):dates.add(f'{year:04}-{month:02}-{int(d):02}')
 stops=[]
 for row in re.findall(r'<tr class="time">(.*?)</tr>',html,re.S):
  name=re.search(r'<a[^>]+>([^<]+)</a>',row)
  if not name:continue
  ar=re.search(r'(\d+:\d+)\s*着',row);de=re.search(r'(\d+:\d+)\s*発',row)
  if ar or de:stops.append([name[1],ar[1] if ar else None,de[1] if de else None,''])
 sh=[s for s in stops if s[0]=='下諏訪']
 if not sh or sh[0][2]!=t['departure'] or not dates:raise ValueError('verification mismatch '+t['number'])
 return {**t,'stops':stops,'days':''.join('1' if d in dates else '0' for d in old['dates'])}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:trains=list(pool.map(load,old['trains']))
(root/'rail.json').write_text(json.dumps({**old,'trains':trains,'retrieved':'2026-10-12','validFrom':'2026-10-01'},ensure_ascii=False))
print('Verified',len(trains),'official pages, full stops and operation calendars')
