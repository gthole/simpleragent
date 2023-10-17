import { IPlugin } from './base';

export function redirect(max_redirects: number) {
    class RedirectPlugin implements IPlugin {
        redirects = 0;

        async onError(req, err) {
            if (
                (err.statusCode !== 300 && err.statusCode !== 301) ||
                !err?.response?.headers?.location ||
                this.redirects >= max_redirects
            ) {
                return;
            }
            this.redirects += 1;
            req.location(err.response.headers.location);
            return {retry: true};
        }
    }
    return RedirectPlugin
}
