const assert=require('node:assert/strict');
const M=require('./model.js'),data=require('./data.json');
assert.equal(M.minutes('25:05:00'),1505);
assert.equal(M.minutes('12:99:00'),null);
assert.deepEqual([...M.active(data,'2026-10-12')],['WEEKDAY']); // Monday: holiday rules missing, disclosed
assert.deepEqual([...M.active(data,'2026-10-11')],['HOLIDAY']);
assert.equal(M.active(data,'2028-01-01').size,0);
assert.equal(M.kind({name:'特急あずさ1号'}),'azusa');
assert.equal(M.kind({name:'快速'}),'other');
assert.equal(M.select(data,{date:'2026-10-12',service:'auto',direction:'both',kinds:['freight']}).length,0);
const amended={calendar:data.calendar,exceptions:[{date:'20261012',service_id:'WEEKDAY',exception_type:'2'},{date:'20261012',service_id:'HOLIDAY',exception_type:'1'}]};
assert.deepEqual([...M.active(amended,'2026-10-12')],['HOLIDAY']);
assert.deepEqual(M.stations('suwa','midori'),['岡谷','下諏訪','上諏訪','茅野']);
assert.ok(!M.stations('full','tatsuno').includes('みどり湖'));
for(const t of data.trains){let last=-1;for(const s of t.stops){const m=M.minutes(s[2]||s[1]);assert.notEqual(m,null);assert.ok(m>=last);last=m;}}
console.log('Model checks passed');
assert.ok(M.stations('full','both').includes('みどり湖')&&M.stations('full','both').includes('辰野'));
assert.equal(M.color({name:'普通',stops:[['辰野']]}),'#007e9a');
assert.equal(M.color({name:'特急あずさ',stops:[['辰野']]}),'#af287a');
