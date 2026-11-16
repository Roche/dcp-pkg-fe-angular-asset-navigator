import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {DcHttp} from "@open-dcp/angular-services";
import { AssetNavigatorDataTransformer, AssetNavigatorLevel, DcpHierarchyResponse } from "../types/AssetNavigator";
import NavigatorLevelType from "../enums/NavigatorLevelType";

function uncapitalizeKeys<T extends Record<string, unknown>>(
  obj: T,
  renames: Record<string, string> = {}
): { [K in keyof T as Uncapitalize<string & K>]: T[K] } {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      const lowKey = k.charAt(0).toLowerCase() + k.slice(1)
      return [renames[lowKey] ?? lowKey, v]
    })
  ) as any;
}

function mapLinkToLevelType(link: string | null | undefined): NavigatorLevelType {
  const value = (link ?? '').toLowerCase()
  const match = value.match(/\/(level|group|sensor)(?:\?|$)/)

  switch (match?.[1]) {
    case 'level':
      return NavigatorLevelType.Level
    case 'group':
      return NavigatorLevelType.Group
    case 'sensor':
      return NavigatorLevelType.Sensor
    default:
      return NavigatorLevelType.Level
  }
}

@Injectable({providedIn: 'root'})
export class ODCPAssetNavigatorService {
  defaultSiteId: number = 0;
  dataTransformer?: AssetNavigatorDataTransformer;

  constructor(private readonly http: DcHttp) {}

  configure(defaultSiteId: number, dataTransformer?: AssetNavigatorDataTransformer) {
    this.defaultSiteId = defaultSiteId;
    this.dataTransformer = dataTransformer;
  }
  
  getHierarchyUrl(link?: string, siteId?: number): string {
    const effectiveSiteId = siteId ?? this.defaultSiteId;

    if (!effectiveSiteId) {
      throw new Error('Site ID is required');
    }

    let requestUrl = `/${effectiveSiteId}/asset-hierarchy/hierarchy/next`;
    if (link) {
      requestUrl += `?link=${encodeURIComponent(link)}`;
    }
    return `${this.http.gatewayModuleUrl('')}${requestUrl}`;
  }

  fetchHierarchy(link?: string, siteId?: number): Observable<DcpHierarchyResponse> {
    const url = this.getHierarchyUrl(link, siteId);
    return this.http.get(url) as Observable<any>;
  }

  fetchElementMetaData(webId: string, siteId?: number): Observable<any> {
    const effectiveSiteId = siteId ?? this.defaultSiteId;
    const requestUrl = `/${effectiveSiteId}/asset-hierarchy/hierarchy/${webId}/meta-data`;
    const url = `${this.http.gatewayModuleUrl('')}${requestUrl}`;
    return this.http.get(url) as Observable<any>;
  }

  processHierarchy(hierarchyResponse: any, link?: string): AssetNavigatorLevel {
    return {
      value: null,
      options: hierarchyResponse.Data.map((el: any) => {
        const transformedElement = this.dataTransformer?.(el) ?? el;
        const base = uncapitalizeKeys(transformedElement as any) as any;
        const { link, ...baseWithoutLink } = base;
        return {
          ...baseWithoutLink,
          label: base.name,
          value: link ?? base.webId ?? null,
          webId: base.webId,
          isDevice: base.isDevice === true,
        };
      }),
      levelType: mapLinkToLevelType(link)
    } as AssetNavigatorLevel;
  }

}
