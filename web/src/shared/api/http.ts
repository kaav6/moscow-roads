import ky from 'ky';
import { getToken } from '@/shared/auth';

export const http = ky.create({
  prefixUrl: '/',
  timeout: 20_000,
  retry: 0,
  hooks: {
    beforeRequest: [
      req => {
        const tk = getToken();
        if (tk && !req.headers.has('Authorization')) {
          req.headers.set('Authorization', `Bearer ${tk}`);
        }
      },
    ],
    afterResponse: [
      (_req, _opts, res) => {
        if (res.status === 401) {
          localStorage.removeItem('tp_at');
          if (location.pathname !== '/login') {
            location.replace('/login?from=' + encodeURIComponent(location.pathname));
          }
        }
        return res;
      },
    ],
  },
});
