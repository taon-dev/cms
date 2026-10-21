import { Resource } from 'ng2-rest/src';
import { Observable } from 'rxjs';

const progressCallbacks = new WeakMap<FormData, (percentage: number) => void>();

// Keep Taon's middleware, retries and response decoding; replace only the
// final Fetch transport for uploads that request browser upload events.
export function trackCmsUpload(
  url: string,
  body: FormData,
  onProgress: (percentage: number) => void,
): () => void {
  const key = `cms-upload-progress-POST-${new URL(url).pathname}`;
  if (!Resource.methodsInterceptors.has(key)) {
    Resource.methodsInterceptors.set(key, {
      intercept: ({ req, next }) => {
        if (!(req.body instanceof FormData)) {
          return next.handle(req);
        }
        const uploadBody = req.body;
        const callback = progressCallbacks.get(uploadBody);
        if (!callback) {
          return next.handle(req);
        }
        return new Observable<Response>(subscriber => {
          const xhr = new XMLHttpRequest();
          xhr.open(req.method || 'POST', req.url);
          xhr.withCredentials = req.credentials === 'include';
          new Headers(req.headers).forEach((value, name) => {
            // The browser must supply the multipart boundary.
            if (name.toLowerCase() !== 'content-type') {
              xhr.setRequestHeader(name, value);
            }
          });
          xhr.upload.onprogress = event => {
            if (event.lengthComputable && event.total > 0) {
              callback(
                Math.min(100, Math.floor((event.loaded * 100) / event.total)),
              );
            }
          };
          xhr.onload = () => {
            const headers = new Headers();
            for (const line of xhr
              .getAllResponseHeaders()
              .trim()
              .split(/[\r\n]+/)) {
              const separator = line.indexOf(':');
              if (separator > 0) {
                headers.append(
                  line.slice(0, separator),
                  line.slice(separator + 1).trim(),
                );
              }
            }
            subscriber.next(
              new Response(
                [204, 205, 304].includes(xhr.status) ? null : xhr.responseText,
                {
                  status: xhr.status,
                  statusText: xhr.statusText,
                  headers,
                },
              ),
            );
            subscriber.complete();
          };
          xhr.onerror = () =>
            subscriber.error(new Error('Media upload network error.'));
          xhr.ontimeout = () =>
            subscriber.error(new Error('Media upload timed out.'));
          xhr.onabort = () =>
            subscriber.error(new Error('Media upload was cancelled.'));
          const abort = () => xhr.abort();
          req.signal?.addEventListener('abort', abort, { once: true });
          if (req.signal?.aborted) {
            subscriber.error(new Error('Media upload was cancelled.'));
          } else {
            callback(0);
            xhr.send(uploadBody);
          }
          return () => {
            req.signal?.removeEventListener('abort', abort);
            if (xhr.readyState !== XMLHttpRequest.DONE) {
              xhr.abort();
            }
          };
        });
      },
    });
  }
  progressCallbacks.set(body, onProgress);
  return () => progressCallbacks.delete(body);
}
