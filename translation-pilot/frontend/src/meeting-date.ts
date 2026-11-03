import {getLanguage,type Language} from './i18n';
export function formatMeetingDate(value:string,language:Language=getLanguage()):string {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
 const [year,month,day]=value.split('-').map(Number),date=new Date(Date.UTC(year,month-1,day,12));
 if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return value;
 return new Intl.DateTimeFormat(language==='es'?'es-MX':'en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(date);
}
