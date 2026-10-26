const assert=require('node:assert/strict'),C=require('../calendar.js');
const calendar=['DAILY','WKD','WEEKEND'].map(service_id=>({service_id,monday:'1',tuesday:'1',wednesday:'1',thursday:'1',friday:'1',saturday:service_id==='WKD'?'0':'1',sunday:service_id==='WKD'?'0':'1',start_date:'20261020',end_date:'20270331'}));
for(const c of calendar)if(c.service_id==='WEEKEND')for(const d of ['monday','tuesday','wednesday','thursday','friday'])c[d]='0';
const exceptions=[{service_id:'WKD',date:'20261103',exception_type:'2'},{service_id:'WEEKEND',date:'20261103',exception_type:'1'}];
const active=(s,d)=>C.active({service_id:s},d,calendar,exceptions);
assert(!active('DAILY','2026-10-19'));assert(active('WKD','2026-10-20'));assert(!active('WEEKEND','2026-10-20'));
assert(!active('WKD','2026-10-24'));assert(active('WEEKEND','2026-10-24'));assert(active('DAILY','2026-10-25'));
assert(!active('WKD','2026-11-03'));assert(active('WEEKEND','2026-11-03'));assert(!active('DAILY','2027-04-01'));
console.log('PASS date boundaries, weekday, Saturday, Sunday and weekday national holiday');
