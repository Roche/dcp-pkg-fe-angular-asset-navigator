/* eslint-disable */
/* tslint:disable */

/**
 * Storybook service worker entry (registered from `.storybook/preview.ts`).
 *
 * The MSW worker is scoped to `/`, so it also sees requests it can never mock and re-fetches them via
 * `passthrough()`, which logs "Uncaught (in promise) TypeError: Failed to fetch" when that re-fetch fails:
 *  - `only-if-cached` requests: DevTools re-requests the opened documents (`/?path=...`, `iframe.html`)
 *    from the cache; MSW only skips them for non same-origin requests, so the re-fetch fails with
 *    `net::ERR_CACHE_MISS`.
 *  - page navigations (manager / preview iframe), e.g. while the dev server restarts.
 * Such requests are kept out of the worker and handled by the browser as usual. Every other request
 * is handled by the generated, unmodified `mockServiceWorker.js`.
 *
 * This listener must be registered before `importScripts` so it runs before MSW's fetch listener.
 */
self.addEventListener('fetch', function (event) {
  if (event.request.mode === 'navigate' || event.request.cache === 'only-if-cached') {
    event.stopImmediatePropagation()
  }
})

importScripts('./mockServiceWorker.js')
