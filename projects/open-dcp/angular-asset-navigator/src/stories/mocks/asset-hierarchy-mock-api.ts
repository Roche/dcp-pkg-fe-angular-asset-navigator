import { delay, http, HttpResponse } from 'msw';
import type { DcpHierarchyResponse } from '../../lib/types/AssetNavigator';
import {
  getElementMetaData,
  getHierarchyChildren,
  hierarchyResponse,
  STORYBOOK_MOCK_API
} from './asset-hierarchy-mock-api.data';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const MOCK_API = escapeRegExp(STORYBOOK_MOCK_API);

// RegExps because the service builds `${gatewayModuleUrl('')}/{siteId}/…`, i.e. `gateway//1/…`.
export const HIERARCHY_NEXT_URL = new RegExp(`^${MOCK_API}/+\\d+/asset-hierarchy/hierarchy/next$`);
export const HIERARCHY_META_DATA_URL = new RegExp(`^${MOCK_API}/+\\d+/asset-hierarchy/hierarchy/[^/]+/meta-data$`);

const DEFAULT_LATENCY_MS = 300;

export interface HierarchyNextHandlerOptions {
  /** Response latency in ms, or `'infinite'` to keep the request pending forever. */
  latency?: number | 'infinite';
  /** Reshapes every element, e.g. to emulate another backend payload. */
  transform?: (element: DcpHierarchyResponse) => unknown;
}

/** `GET /{siteId}/asset-hierarchy/hierarchy/next[?link=…]` */
export const hierarchyNextHandler = ({ latency = DEFAULT_LATENCY_MS, transform }: HierarchyNextHandlerOptions = {}) =>
  http.get(HIERARCHY_NEXT_URL, async ({ request }) => {
    await delay(latency);
    const link = new URL(request.url).searchParams.get('link');
    const data = getHierarchyChildren(link);
    if (!data) {
      return HttpResponse.json({ Message: `Unknown hierarchy link "${link}"` }, { status: 404 });
    }
    return HttpResponse.json(hierarchyResponse(transform ? data.map(transform) : data));
  });

/** `GET /{siteId}/asset-hierarchy/hierarchy/{webId}/meta-data` */
export const metaDataHandler = ({ latency = DEFAULT_LATENCY_MS }: { latency?: number } = {}) =>
  http.get(HIERARCHY_META_DATA_URL, async ({ request }) => {
    await delay(latency);
    const segments = new URL(request.url).pathname.split('/');
    const webId = decodeURIComponent(segments[segments.length - 2]);
    const metaData = getElementMetaData(webId);
    return metaData
      ? HttpResponse.json(metaData)
      : HttpResponse.json({ Message: `Unknown element "${webId}"` }, { status: 404 });
  });

/**
 * Shared MSW handlers for the Storybook mock asset hierarchy. Registered as initial handlers in
 * `.storybook/preview.ts`; story-level `parameters.msw.handlers` take precedence over them.
 */
export const assetHierarchyMockApiHandlers = [
  hierarchyNextHandler(),
  metaDataHandler(),
  // Unmatched mock-API requests fail loudly instead of reaching the network.
  http.all(`${STORYBOOK_MOCK_API}/*`, ({ request }) =>
    HttpResponse.json({ Message: `No Storybook mock for ${new URL(request.url).pathname}` }, { status: 404 })
  )
];
