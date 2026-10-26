(function(root){
'use strict';
function active(trip,date,calendar,exceptions){
 const day=date.replaceAll('-','');
 const exception=exceptions.find(x=>x.service_id===trip.service_id&&x.date===day);
 if(exception)return exception.exception_type==='1';
 const row=calendar.find(x=>x.service_id===trip.service_id);
 if(!row||day<row.start_date||day>row.end_date)return false;
 const weekday=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date(date+'T12:00:00Z').getUTCDay()];
 return row[weekday]==='1';
}
function label(service){return service.endsWith('WKD')?'平日のみ（土日祝運休）':service.endsWith('WEEKEND')?'土日祝のみ':'毎日';}
const api={active,label};if(typeof module!=='undefined')module.exports=api;else root.BusCalendar=api;
})(typeof globalThis!=='undefined'?globalThis:this);
