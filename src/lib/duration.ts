import {TimeUnit} from '@proto/timeUnit';


export function convertDailyDurationToHM(dur: number): string {
  const hh = Math.floor(dur / TimeUnit.Hour);
  const mm = Math.round((dur - hh * TimeUnit.Hour) / TimeUnit.Minute);
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
}


export function convertDailyDurationToDur(s: number, digits = 2): string {
  if (s == 0) {
    return '无期限';
  }
  if (s >= TimeUnit.Day) {
    return `${(s / TimeUnit.Day).toFixed(digits)} 天`;
  }
  if (s >= TimeUnit.Hour) {
    return `${(s / TimeUnit.Hour).toFixed(digits)} 时`;
  }
  if (s >= TimeUnit.Minute) {
    return `${(s / TimeUnit.Minute).toFixed(digits)} 分`;
  }
  if (s >= TimeUnit.Second) {
    return `${(s / TimeUnit.Second).toFixed(digits)} 秒`;
  }
  return `${(0).toFixed(digits)} 秒`;
}
