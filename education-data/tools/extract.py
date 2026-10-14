import json,pathlib,re,warnings,openpyxl,math
warnings.filterwarnings('ignore',category=UserWarning,module='openpyxl')
BASE=pathlib.Path(__file__).resolve().parents[1]
manifest=json.load(open(BASE/'.source-cache/manifest.json'))
metrics=[
 ('mathLike','数学が好き','数学の勉強は好きですか',2),
 ('jpLike','国語が好き','国語の勉強は好きですか',2),
 ('englishLike','英語が好き','英語の勉強は好きですか',2),
 ('scienceLike','理科が好き','理科の勉強は好きですか',2),
 ('study','平日1時間以上の学習','学校の授業時間以外に、普段（月曜日から金曜日）、１日当たりどれくらいの時間、勉強',3),
 ('agency','課題に自分から取り組む','課題の解決に向けて、自分で考え、自分から取り組んで',2),
 ('selfWorth','自分によいところがある','自分には、よいところがあると思いますか',2),
 ('selfRegulation','学び方を考え、工夫する','自分で学び方を考え、工夫することはできていますか',2),
 ('review','見直しを次の学習につなげる','次の学習につなげることができていますか',2),
 ('discussion','話し合いで考えを深める','自分の考えを深めたり、新たな考え方に気付いたり',2),
 ('ict','授業でICTを週3回以上使う','PC・タブレットなどのICT機器を、どの程度使用しましたか',0),
 ('ictOrganize','ICTで情報を整理できる','情報を整理する（図、表、グラフ、思考ツールなどを使ってまとめる）',2),
 ('ictWrite','ICTで文章を作成できる','ICT機器で文章を作成する',2),
 ('consult','先生や大人に相談できる','先生や学校にいる大人にいつでも相談できますか',2),
 ('breakfast','朝食を毎日食べる','朝食を毎日食べていますか',2),
 ('dream','将来の夢や目標がある','将来の夢や目標を持っていますか',2),
 ('mathUseful','数学は将来役立つ','数学の授業で学習したことは、将来、社会に出たときに役に立つと思いますか',2),
 ('jpUseful','国語は将来役立つ','国語の授業で学習したことは、将来、社会に出たときに役に立つと思いますか',2),
]
data={'updated':'2026-10-14','populationSource':'https://www.stat.go.jp/data/kokusei/2020/kekka/pdf/outline_01.pdf','metrics':{k:{'label':label} for k,label,_,_ in metrics},'years':{str(y):{} for y in [2024,2025,2026]}}
data['population']=json.load(open(BASE/'tools/population.json'))['values']
assert data['population']['長野県']==2048011
checks=0
def national_set(target,key,record):
    if key in target:
        assert target[key]['value']==record['value'],(key,target[key],record)
    else:target[key]=record
for item in manifest:
    y=str(item['year']); name=item['name']; w=openpyxl.load_workbook(item['path'],data_only=True)
    regions=data['years'][y]
    region=regions.setdefault(name,{'code':item['code'],'academic':{},'questions':{}})
    national=regions.setdefault('全国平均',{'code':'00','academic':{},'questions':{}})
    if re.search(r'r(?:s)?\.xlsx$',item['path']):
        for s in w:
            key=s.title.strip()
            irt=key.startswith('英語') or key=='理科'
            cell='C19' if irt else 'G8'; nationalcell='C20' if irt else 'G9'
            v=s[cell].value; nv=s[nationalcell].value
            assert isinstance(v,(int,float,str)) and isinstance(nv,(int,float)),(item,key,v,nv)
            r={'value':v,'unit':'IRTスコア' if irt else '％','source':item['url'],'sheet':s.title,'cell':cell,'n':s['C8'].value,'scope':'公立中学校3年生'}
            if irt:
                r['bands']=[s.cell(8,c).value for c in range(27,32)]
                assert abs(sum(r['bands'])-100)<.4
            region['academic'][key]=r
            nr={**r,'value':nv,'cell':nationalcell,'n':s['C9'].value,'scope':'国公私立・4技能当日実施抽出校' if key=='英語４技能' else '公立中学校3年生'}
            if irt:nr['bands']=[s.cell(9,c).value for c in range(27,32)]
            national_set(national['academic'],key,nr)
            checks+=1
    else:
        s=w.active; rows=list(s.values); n=s['D8'].value
        for key,label,pattern,count in metrics:
            found=[(i,r) for i,r in enumerate(rows) if isinstance(r[2],str) and pattern in r[2]]
            if not found:continue
            assert len(found)==1,(y,key)
            i,row=found[0]
            count=(2 if y=='2024' else 3) if key=='ict' else count
            rates=list(rows[i+1][6:6+count]); counts=list(row[6:6+count]); nationwide=list(rows[i+3][6:6+count])
            assert all(isinstance(v,(int,float)) for v in rates+counts+nationwide),(item,key)
            for a,b in zip(rates,counts):
                assert abs(a-100*b/n)<=.051,(item,key,a,b,n)
                checks+=1
            r={'value':round(sum(rates),1),'unit':'％','question':row[1],'text':row[2],'selection':list(range(1,count+1)),'parts':rates,'counts':counts,'n':n,'source':item['url'],'sheet':s.title,'cells':f'G{i+2}:{chr(70+count)}{i+2}','definition':'選択肢1〜3の合計（1時間以上）' if key=='study' else '週3回以上の頻度区分の合計' if key=='ict' else '選択肢1・2（肯定回答）の合計'}
            region['questions'][key]=r
            nr={**r,'value':round(sum(nationwide),1),'parts':nationwide,'counts':None,'n':None,'cells':f'G{i+4}:{chr(70+count)}{i+4}'}
            national_set(national['questions'],key,nr)
for y,regions in data['years'].items():
    assert len(regions)==48,(y,len(regions))
    assert all(len(r['academic'])=={'2024':2,'2025':3,'2026':4}[y] for r in regions.values())
out=BASE; out.mkdir(exist_ok=True)
(out/'data.js').write_text('const DATA = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
(out/'sources.json').write_text(json.dumps([{k:v for k,v in x.items() if k!='path'} for x in manifest],ensure_ascii=False,indent=2))
print('Checks:',checks,'records:',sum(len(r['academic'])+len(r['questions']) for rs in data['years'].values() for r in rs.values()))
for y,rs in data['years'].items():
    print(y,{k:v['value'] for k,v in rs['長野県']['academic'].items()},{k:v['value'] for k,v in rs['長野県']['questions'].items()})
