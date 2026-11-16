import type { DcHttpConfig } from '@open-dcp/angular-services';
import type { AssetNavigatorLevel, AssetNavigatorOption, DcpHierarchyResponse } from '../../lib/types/AssetNavigator';
import NavigatorLevelType from '../../lib/enums/NavigatorLevelType';

/**
 * Storybook-only mock of the DCP asset hierarchy (the data behind the Global Filter).
 * Stories point `HttpConfig.gatewayUrl` here and MSW (see asset-hierarchy-mock-api.ts) answers
 * `/{siteId}/asset-hierarchy/hierarchy/next?link=…` and `/{siteId}/asset-hierarchy/hierarchy/{webId}/meta-data`.
 *
 * Like the real API, the suffix of an element `Link` tells which kind of level its children form:
 * `…/level` -> next level, `…/group` -> equipment group, `…/sensor` -> sensors (final step).
 */
export const STORYBOOK_MOCK_API_PATH = '/storybook-mock-api';

export const getStorybookMockApiBase = (): string => {
  const origin = typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null'
    ? window.location.origin
    : 'http://localhost';
  return `${origin}${STORYBOOK_MOCK_API_PATH}`;
};

export const STORYBOOK_MOCK_API = getStorybookMockApiBase();

export const MOCK_SITE_ID = 1;

export const httpConfig: DcHttpConfig = {
  apiUrl: STORYBOOK_MOCK_API,
  gatewayUrl: STORYBOOK_MOCK_API,
};

type ChildKind = 'level' | 'group' | 'sensor';

interface MockSensor {
  webId: string;
  name: string;
  description: string;
  uom: string | null;
  valueType: string;
  categoryNames: string[];
  step?: boolean;
}

interface MockNode {
  webId: string;
  name: string;
  description: string;
  /** Kind of level formed by this node's children. */
  childKind: ChildKind;
  isDevice?: boolean;
  categoryNames?: string[];
  children?: MockNode[];
  sensors?: MockSensor[];
}

const sensor = (
  webId: string,
  name: string,
  description: string,
  uom: string | null,
  categoryNames: string[],
  valueType = 'Float32',
  step = false
): MockSensor => ({ webId, name, description, uom, valueType, categoryNames, step });

const bioreactorSensors = (prefix: string, tag: string): MockSensor[] => [
  sensor(`${prefix}-TT01`, `${tag} Temperature`, 'Culture temperature (TT-01)', '°C', ['Process Parameter', 'CPP']),
  sensor(`${prefix}-PH01`, `${tag} pH`, 'Culture pH (AT-01)', 'pH', ['Process Parameter', 'CPP']),
  sensor(`${prefix}-DO01`, `${tag} Dissolved Oxygen`, 'Dissolved oxygen saturation (AT-02)', '%', ['Process Parameter', 'CPP']),
  sensor(`${prefix}-SC01`, `${tag} Agitation`, 'Impeller speed (SC-01)', 'rpm', ['Process Parameter']),
  sensor(`${prefix}-PT01`, `${tag} Headspace Pressure`, 'Vessel headspace pressure (PT-01)', 'bar', ['Process Parameter']),
  sensor(`${prefix}-WT01`, `${tag} Weight`, 'Vessel net weight (WT-01)', 'kg', ['Process Parameter']),
  sensor(`${prefix}-PHASE`, `${tag} Batch Phase`, 'Current recipe phase', null, ['Batch'], 'String', true),
];

export const assetHierarchy: MockNode[] = [
  {
    webId: 'F1EmBSL-B90',
    name: 'Building 90',
    description: 'Biologics drug substance manufacturing',
    childKind: 'level',
    categoryNames: ['Building'],
    children: [
      {
        webId: 'F1EmBSL-B90-USP',
        name: 'Upstream Processing',
        description: 'Cell culture and production bioreactors',
        childKind: 'group',
        categoryNames: ['Area'],
        children: [
          {
            webId: 'F1EmBSL-B90-USP-BR01',
            name: 'Bioreactor BR-2000-01',
            description: '2000 L single-use production bioreactor',
            childKind: 'sensor',
            isDevice: true,
            categoryNames: ['Equipment', 'Bioreactor'],
            sensors: bioreactorSensors('F1EmBSL-B90-USP-BR01', 'BR-01'),
          },
          {
            webId: 'F1EmBSL-B90-USP-BR02',
            name: 'Bioreactor BR-2000-02',
            description: '2000 L single-use production bioreactor',
            childKind: 'sensor',
            isDevice: true,
            categoryNames: ['Equipment', 'Bioreactor'],
            sensors: bioreactorSensors('F1EmBSL-B90-USP-BR02', 'BR-02'),
          },
          {
            webId: 'F1EmBSL-B90-USP-SBR01',
            name: 'Seed Bioreactor SBR-200',
            description: '200 L seed train bioreactor',
            childKind: 'sensor',
            isDevice: true,
            categoryNames: ['Equipment', 'Bioreactor'],
            sensors: bioreactorSensors('F1EmBSL-B90-USP-SBR01', 'SBR-200'),
          },
        ],
      },
      {
        webId: 'F1EmBSL-B90-DSP',
        name: 'Downstream Processing',
        description: 'Purification: chromatography and filtration',
        childKind: 'group',
        categoryNames: ['Area'],
        children: [
          {
            webId: 'F1EmBSL-B90-DSP-CHR01',
            name: 'Chromatography Skid CHR-01',
            description: 'Protein A capture chromatography',
            childKind: 'sensor',
            isDevice: true,
            categoryNames: ['Equipment', 'Chromatography'],
            sensors: [
              sensor('F1EmBSL-B90-DSP-CHR01-UV280', 'CHR-01 UV 280 nm', 'Column outlet UV absorbance', 'mAU', ['Process Parameter', 'CPP']),
              sensor('F1EmBSL-B90-DSP-CHR01-CT01', 'CHR-01 Conductivity', 'Column outlet conductivity', 'mS/cm', ['Process Parameter']),
              sensor('F1EmBSL-B90-DSP-CHR01-FT01', 'CHR-01 Flow Rate', 'Mobile phase flow rate', 'L/h', ['Process Parameter']),
              sensor('F1EmBSL-B90-DSP-CHR01-PT01', 'CHR-01 Column Pressure', 'Column inlet pressure', 'bar', ['Process Parameter']),
            ],
          },
          {
            webId: 'F1EmBSL-B90-DSP-UFDF01',
            name: 'UF/DF Skid UFDF-01',
            description: 'Ultrafiltration / diafiltration',
            childKind: 'sensor',
            isDevice: true,
            categoryNames: ['Equipment', 'Filtration'],
            sensors: [
              sensor('F1EmBSL-B90-DSP-UFDF01-TMP', 'UFDF-01 TMP', 'Transmembrane pressure', 'bar', ['Process Parameter', 'CPP']),
              sensor('F1EmBSL-B90-DSP-UFDF01-FT02', 'UFDF-01 Permeate Flow', 'Permeate flow rate', 'L/min', ['Process Parameter']),
              sensor('F1EmBSL-B90-DSP-UFDF01-PT03', 'UFDF-01 Retentate Pressure', 'Retentate line pressure', 'bar', ['Process Parameter']),
            ],
          },
        ],
      },
    ],
  },
  {
    webId: 'F1EmBSL-B95',
    name: 'Building 95',
    description: 'Fill & finish of parenteral products',
    childKind: 'level',
    categoryNames: ['Building'],
    children: [
      {
        webId: 'F1EmBSL-B95-FL01',
        name: 'Aseptic Filling Line FL-01',
        description: 'Vial filling under isolator',
        childKind: 'group',
        categoryNames: ['Area'],
        children: [
          {
            webId: 'F1EmBSL-B95-FL01-FM01',
            name: 'Filling Machine FM-01',
            description: 'Peristaltic vial filler',
            childKind: 'sensor',
            isDevice: true,
            categoryNames: ['Equipment', 'Filler'],
            sensors: [
              sensor('F1EmBSL-B95-FL01-FM01-FW', 'FM-01 Fill Weight', 'In-process control fill weight', 'g', ['Process Parameter', 'CPP']),
              sensor('F1EmBSL-B95-FL01-FM01-SPD', 'FM-01 Machine Speed', 'Filling output', 'units/min', ['Process Parameter'], 'Int32'),
              sensor('F1EmBSL-B95-FL01-FM01-PC05', 'FM-01 Particles ≥0.5 µm', 'Grade A non-viable particle count', 'counts/m³', ['Environmental Monitoring'], 'Int32'),
            ],
          },
          {
            webId: 'F1EmBSL-B95-FL01-ISO01',
            name: 'Isolator ISO-01',
            description: 'Filling isolator with VHP decontamination',
            childKind: 'sensor',
            isDevice: true,
            categoryNames: ['Equipment', 'Isolator'],
            sensors: [
              sensor('F1EmBSL-B95-FL01-ISO01-DP', 'ISO-01 Differential Pressure', 'Isolator to room differential pressure', 'Pa', ['Environmental Monitoring', 'CPP']),
              sensor('F1EmBSL-B95-FL01-ISO01-H2O2', 'ISO-01 H2O2 Concentration', 'VHP concentration during decontamination', 'ppm', ['Process Parameter']),
              sensor('F1EmBSL-B95-FL01-ISO01-TT', 'ISO-01 Temperature', 'Isolator chamber temperature', '°C', ['Environmental Monitoring']),
            ],
          },
        ],
      },
      {
        webId: 'F1EmBSL-B95-LYO',
        name: 'Lyophilization',
        description: 'Freeze drying',
        childKind: 'group',
        categoryNames: ['Area'],
        children: [
          {
            webId: 'F1EmBSL-B95-LYO-LYO01',
            name: 'Freeze Dryer LYO-01',
            description: '30 m² production freeze dryer',
            childKind: 'sensor',
            isDevice: true,
            categoryNames: ['Equipment', 'Freeze Dryer'],
            sensors: [
              sensor('F1EmBSL-B95-LYO-LYO01-TS', 'LYO-01 Shelf Temperature', 'Shelf inlet temperature', '°C', ['Process Parameter', 'CPP']),
              sensor('F1EmBSL-B95-LYO-LYO01-PC', 'LYO-01 Chamber Pressure', 'Capacitance manometer chamber pressure', 'µbar', ['Process Parameter', 'CPP']),
              sensor('F1EmBSL-B95-LYO-LYO01-TC', 'LYO-01 Condenser Temperature', 'Ice condenser temperature', '°C', ['Process Parameter']),
            ],
          },
        ],
      },
    ],
  },
  {
    webId: 'F1EmBSL-UTL',
    name: 'Site Utilities',
    description: 'HVAC and clean utilities',
    childKind: 'level',
    categoryNames: ['Building'],
    children: [
      {
        webId: 'F1EmBSL-UTL-HVAC',
        name: 'HVAC',
        description: 'Heating, ventilation and air conditioning',
        childKind: 'group',
        categoryNames: ['Area'],
        children: [
          {
            webId: 'F1EmBSL-UTL-HVAC-AHU01',
            name: 'Air Handling Unit AHU-01',
            description: 'Supplies cleanroom grade C/D areas',
            childKind: 'sensor',
            isDevice: true,
            categoryNames: ['Equipment', 'AHU'],
            sensors: [
              sensor('F1EmBSL-UTL-HVAC-AHU01-TS', 'AHU-01 Supply Temperature', 'Supply air temperature', '°C', ['Utility']),
              sensor('F1EmBSL-UTL-HVAC-AHU01-TR', 'AHU-01 Return Temperature', 'Return air temperature', '°C', ['Utility']),
              sensor('F1EmBSL-UTL-HVAC-AHU01-FT', 'AHU-01 Air Flow', 'Supply air volume flow', 'm³/h', ['Utility']),
              sensor('F1EmBSL-UTL-HVAC-AHU01-RH', 'AHU-01 Humidity', 'Supply air relative humidity', '%rH', ['Utility']),
              sensor('F1EmBSL-UTL-HVAC-AHU01-DP', 'AHU-01 Filter Differential Pressure', 'HEPA filter differential pressure', 'Pa', ['Utility']),
            ],
          },
        ],
      },
      {
        webId: 'F1EmBSL-UTL-CU',
        name: 'Clean Utilities',
        description: 'Water for injection and clean steam',
        childKind: 'group',
        categoryNames: ['Area'],
        children: [
          {
            webId: 'F1EmBSL-UTL-CU-WFI01',
            name: 'WFI Loop WFI-01',
            description: 'Hot WFI distribution loop',
            childKind: 'sensor',
            isDevice: true,
            categoryNames: ['Equipment', 'WFI'],
            sensors: [
              sensor('F1EmBSL-UTL-CU-WFI01-CT', 'WFI-01 Conductivity', 'Return conductivity', 'µS/cm', ['Utility', 'Quality']),
              sensor('F1EmBSL-UTL-CU-WFI01-TOC', 'WFI-01 TOC', 'Total organic carbon', 'ppb', ['Utility', 'Quality']),
              sensor('F1EmBSL-UTL-CU-WFI01-TT', 'WFI-01 Loop Temperature', 'Return temperature', '°C', ['Utility']),
            ],
          },
          {
            webId: 'F1EmBSL-UTL-CU-CSG01',
            name: 'Clean Steam Generator CSG-01',
            description: 'Clean steam for SIP',
            childKind: 'sensor',
            isDevice: true,
            categoryNames: ['Equipment', 'Clean Steam'],
            sensors: [
              sensor('F1EmBSL-UTL-CU-CSG01-PT', 'CSG-01 Steam Pressure', 'Clean steam header pressure', 'bar', ['Utility']),
              sensor('F1EmBSL-UTL-CU-CSG01-TT', 'CSG-01 Steam Temperature', 'Clean steam header temperature', '°C', ['Utility']),
            ],
          },
        ],
      },
    ],
  },
];

/** Link of a hierarchy element, e.g. `F1EmBSL-B90/level`. */
export const linkOf = (webId: string, childKind: ChildKind): string => `${webId}/${childKind}`;

const toHierarchyElement = (node: MockNode): DcpHierarchyResponse => ({
  CategoryNames: node.categoryNames ?? [],
  Description: node.description,
  IsChromUnit: false,
  IsDevice: node.isDevice === true,
  Link: linkOf(node.webId, node.childKind),
  Name: node.name,
  Step: false,
  UoM: null,
  ValueType: null,
  WebId: node.webId,
});

const toSensorElement = (s: MockSensor): DcpHierarchyResponse => ({
  CategoryNames: s.categoryNames,
  Description: s.description,
  IsChromUnit: false,
  IsDevice: false,
  Link: s.webId,
  Name: s.name,
  Step: s.step === true,
  UoM: s.uom,
  ValueType: s.valueType,
  WebId: s.webId,
});

const nodesByWebId = new Map<string, MockNode>();
const sensorsByWebId = new Map<string, MockSensor>();
const indexNodes = (nodes: MockNode[]): void => nodes.forEach(node => {
  nodesByWebId.set(node.webId, node);
  node.sensors?.forEach(s => sensorsByWebId.set(s.webId, s));
  indexNodes(node.children ?? []);
});
indexNodes(assetHierarchy);

/** Children of the element addressed by `link` (`undefined` = site root), as returned by `hierarchy/next`. */
export const getHierarchyChildren = (link?: string | null): DcpHierarchyResponse[] | null => {
  if (!link) {
    return assetHierarchy.map(toHierarchyElement);
  }
  const [webId] = link.split('/');
  const node = nodesByWebId.get(webId);
  if (!node) {
    return null;
  }
  return node.sensors ? node.sensors.map(toSensorElement) : (node.children ?? []).map(toHierarchyElement);
};

/** Body returned by `hierarchy/{webId}/meta-data` (read as `response.data.description` by the tooltip). */
export const getElementMetaData = (webId: string): { data: { description: string } } | null => {
  const node = nodesByWebId.get(webId);
  if (node) {
    const categories = node.categoryNames?.length ? ` [${node.categoryNames.join(', ')}]` : '';
    return { data: { description: `${node.name} - ${node.description}${categories}` } };
  }
  const s = sensorsByWebId.get(webId);
  if (s) {
    return { data: { description: `${s.name} - ${s.description}${s.uom ? ` (${s.uom})` : ''}` } };
  }
  return null;
};

export const hierarchyResponse = <T>(data: T[]) => ({ Data: data, Errors: [], Warnings: [] });

const toOption = (element: DcpHierarchyResponse): AssetNavigatorOption => ({
  label: element.Name,
  description: element.Description,
  value: element.Link,
  webId: element.WebId,
  isDevice: element.IsDevice,
});

/** Pre-selected path Building 90 > Upstream Processing > BR-2000-01; its sensors are loaded through MSW. */
export const formulaInitialState: AssetNavigatorLevel[] = [
  {
    levelType: NavigatorLevelType.Level,
    options: (getHierarchyChildren() ?? []).map(toOption),
    value: linkOf('F1EmBSL-B90', 'level'),
  },
  {
    levelType: NavigatorLevelType.Level,
    options: (getHierarchyChildren(linkOf('F1EmBSL-B90', 'level')) ?? []).map(toOption),
    value: linkOf('F1EmBSL-B90-USP', 'group'),
  },
  {
    levelType: NavigatorLevelType.Group,
    options: (getHierarchyChildren(linkOf('F1EmBSL-B90-USP', 'group')) ?? []).map(toOption),
    value: linkOf('F1EmBSL-B90-USP-BR01', 'sensor'),
  },
];

/** Alternative backend payload shape used by the "With Transfer" story. */
export type TransformerApiElement = {
  assetName: string;
  assetDescription: string;
  assetLink: string;
  assetWebId: string;
  assetIsDevice: boolean;
  assetCategories: string[];
  assetUnit: string | null;
  assetValueType: string | null;
  assetIsStep: boolean;
};

export const toTransformerElement = (element: DcpHierarchyResponse): TransformerApiElement => ({
  assetName: element.Name,
  assetDescription: element.Description,
  assetLink: element.Link,
  assetWebId: element.WebId,
  assetIsDevice: element.IsDevice,
  assetCategories: element.CategoryNames,
  assetUnit: element.UoM,
  assetValueType: element.ValueType,
  assetIsStep: element.Step,
});

export const dataTransformer = (element: Record<string, unknown>): Record<string, unknown> => {
  const raw = element as unknown as TransformerApiElement;
  return {
    Name: raw.assetName,
    Description: raw.assetDescription,
    Link: raw.assetLink,
    WebId: raw.assetWebId,
    IsDevice: raw.assetIsDevice,
    CategoryNames: raw.assetCategories,
    UoM: raw.assetUnit,
    ValueType: raw.assetValueType,
    Step: raw.assetIsStep,
  };
};
