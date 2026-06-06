import ky, { type KyInstance, type Options } from 'ky';
import { getToken, clearToken } from '@/shared/auth';

/**
 * Инкапсулирует доступ к REST API: хранит ky-клиент и логику работы
 * с JWT-токеном как приватное состояние, наружу отдаёт только get/post.
 */
export class ApiClient {
  private readonly client: KyInstance;

  constructor(baseUrl: string) {
    this.client = ky.create({
      prefixUrl: baseUrl,
      timeout: 20_000,
      retry: 0,
      hooks: {
        beforeRequest: [req => this.attachToken(req)],
        afterResponse: [(_req, _opts, res) => this.handleUnauthorized(res)],
      },
    });
  }

  private attachToken(req: Request): void {
    const tk = getToken();
    if (tk && !req.headers.has('Authorization')) {
      req.headers.set('Authorization', `Bearer ${tk}`);
    }
  }

  private handleUnauthorized(res: Response): Response {
    if (res.status === 401) {
      clearToken();
      if (location.pathname !== '/login') {
        location.replace('/login?from=' + encodeURIComponent(location.pathname));
      }
    }
    return res;
  }

  get(url: string, options?: Options) {
    return this.client.get(url, options);
  }

  post(url: string, options?: Options) {
    return this.client.post(url, options);
  }
}

export const http = new ApiClient('/');
