import csv

def export_private_csv(root,payload):
    with (root/'data/private-admissions.csv').open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.writer(f)
        w.writerow(['受験実施年度','入学年','学校','学科','地域','年間定員','推薦志願','推薦受験','推薦合格','一般志願','一般受験','一般共同集計ID','一般共同志願者数','調査時点','出典URL'])
        for x in payload['records']:
            g=x['late'].get('applicant_group',{});ids=x.get('source_ids',[x['source_id']])
            w.writerow([x['year']-1,x['year'],x['school'],x['department'],x['region'],x['annual_capacity'],x['early']['applicants'],x['early']['examinees'],x['early']['accepted'],x['late']['applicants'],x['late']['examinees'],g.get('id'),g.get('applicants'),x['as_of'],' '.join(s['url'] for s in payload['sources'] if s['id'] in ids)])
