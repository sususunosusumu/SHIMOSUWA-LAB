import json,csv,re
from pathlib import Path
import pdfplumber
import argparse
parser=argparse.ArgumentParser(description='県公式の2026年3月6日私立入試PDFを変換・総数照合')
parser.add_argument('pdf', help='20260310_press_besshi.pdf の保存先')
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
table=pdfplumber.open(args.pdf).pages[0].extract_tables()[0]
regions={'長野清泉女学院':'北信','文化学園長野':'北信','長野日本大学':'北信','長野俊英':'北信','上田西':'東信','佐久長聖':'東信','東海大学付属諏訪':'南信','伊那西':'南信','飯田女子':'南信','東京都市大学塩尻':'中信','松商学園':'中信','松本国際':'中信','松本第一':'中信','エクセラン':'中信','日本ウェルネス長野':'中信'}
records=[]; school=''
for i in range(2,len(table)-3,2):
 a,b=table[i:i+2]
 if a[0]:school=re.sub(r'\(.*?[）)]','',a[0].replace('\n',''))
 dep=a[1].replace('\n',''); num=lambda v:int((v or '0').replace(',',''))
 early={k:num(a[j])+num(b[j]) for k,j in [('applicants',5),('examinees',6),('accepted',7)]};early['capacity']=None
 late={k:num(a[j])+num(b[j]) for k,j in [('applicants',10),('examinees',11)]};late.update(capacity=None,accepted=None)
 # 県本文で一般入試なしと明記された探究創造学科のみ0を確定。
 if dep=='探究創造':late.update(applicants=0,examinees=0)
 records.append(dict(year=2026,school=school,school_id='private|'+school,department=dep,program_id='private|'+school+'|'+dep,region=regions[school],sector='private',course='全日制',annual_capacity=num(a[2]),enrolled=None,additional_accepted=None,early=early,late=late,status='private_snapshot',as_of='2026-03-06 12:00',source_id='private2026',source_page=1))
assert len(records)==21
for phase,field,total in [('early','applicants',4942),('early','examinees',4937),('early','accepted',4735),('late','applicants',4740),('late','examinees',4647)]:assert sum(r[phase][field] for r in records)==total
payload=dict(records=records,sources=[dict(id='private2026',title='令和8年度 私立全日制高校入学者選抜の状況（2026年3月6日正午時点）',url='https://www.pref.nagano.lg.jp/ken-manabi/press/documents/20260310_press_besshi.pdf',page_url='https://www.pref.nagano.lg.jp/ken-manabi/press/20260310press-2.html')],notes=['私立は2025年度実施・2026年春入学分のみ。15校21学科。ISAKジャパンは日程が異なり県資料の対象外。','前期は推薦、後期は一般。専願・併願を合計。空欄の専願・併願区分は計上なしとして集計し、県全体の5項目の総数と照合。','一般合格者数・実入学者数・選抜別募集枠は公表表にないためnull。年間最終合格者計は算出しない。','内進者を含む学校あり。3月6日時点で今後の試験日程があり数字は変更されうる。私立の地域は所在地による便宜上の分類。'])
previous=json.loads((root/'data/private-admissions.json').read_text()) if (root/'data/private-admissions.json').exists() else {}
payload['records']=sorted([r for r in previous.get('records',[]) if r['year']!=2026]+payload['records'],key=lambda r:(r['year'],r['school'],r['department']))
payload['sources']=[s for s in previous.get('sources',[]) if s['id']!='private2026']+payload['sources']
if previous.get('checks'):payload['checks']=previous['checks'];payload['notes']=previous.get('notes',payload['notes'])
(root/'data/private-admissions.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
from export_private_csv import export_private_csv
export_private_csv(root,payload)
print(len(payload['records']))
