"""Read public JR East route status. Missing data is never treated as normal."""
import datetime,json,urllib.request,urllib.parse
from pathlib import Path
from lxml import html
ROOT=Path(__file__).parent
urls={'local':'https://traininfo.jreast.co.jp/train_info/shinetsu.aspx','express':'https://traininfo.jreast.co.jp/train_info/chyokyori.aspx'}
rows=[]
for group,url in urls.items():
 targets=[('中央本線','chuoline'),('篠ノ井線','shinonoiline')] if group=='local' else [('あずさ・かいじ・富士回遊','azusa_kaiji_fujiexcursion')]
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; Shimosuwa-Lab)'})
  with urllib.request.urlopen(req,timeout=25) as response:doc=html.fromstring(response.read().decode('utf-8'))
  for label,key in targets:
   a=doc.xpath('//a[contains(@href,"'+key+'") and contains(@class,"traininfo-routes__info")]')[0]
   p=a.xpath('.//p[contains(@class,"traininfo-routes__status")]')[0]
   rows.append({'label':label,'status':' '.join(' '.join(p.itertext()).split()),'message':' '.join(' '.join(a.itertext()).split()),'source':urllib.parse.urljoin(url,a.get('href'))})
 except Exception:
  for label,key in targets:rows.append({'label':label,'status':'取得できませんでした','message':'公式サイトでご確認ください。','source':url})
(ROOT/'status.json').write_text(json.dumps({'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'routes':rows},ensure_ascii=False,separators=(',',':')))
print('Updated route status; individual train delay minutes are not available.')
