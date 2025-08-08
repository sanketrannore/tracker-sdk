import { EnvSnapshot } from '../../common/types';

export function captureEnvSnapshot(userId?: string, ipAddress?: string | null): EnvSnapshot {
  let pageLoadtime: number | null = null;
  try {
    const timing = (performance && (performance as any).timing) || null;
    if (timing && timing.loadEventEnd > 0 && timing.navigationStart > 0) {
      pageLoadtime = timing.loadEventEnd - timing.navigationStart;
    }
  } catch {}

  return {
    ua: navigator.userAgent,
    sh: typeof screen !== 'undefined' ? screen.height : 0,
    sw: typeof screen !== 'undefined' ? screen.width : 0,
    l: navigator.language,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    p: navigator.platform,
    an: !userId,
    vh: typeof window !== 'undefined' ? window.innerHeight : 0,
    vw: typeof window !== 'undefined' ? window.innerWidth : 0,
    pt: typeof document !== 'undefined' ? document.title : '',
    pu: typeof window !== 'undefined' ? window.location.href : '',
    pp: typeof window !== 'undefined' ? window.location.pathname : '',
    pd: typeof window !== 'undefined' ? window.location.hostname : '',
    pl: pageLoadtime,
    pr: typeof document !== 'undefined' && document.referrer ? document.referrer : null,
    ip: ipAddress ?? null,
  };
}

