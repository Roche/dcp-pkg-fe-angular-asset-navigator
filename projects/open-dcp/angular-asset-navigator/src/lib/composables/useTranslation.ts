export interface EditorTranslation {
  translationPrefix?: string;
  translator: (key: string) => string;
}

const DEFAULT_TRANSLATION_PREFIX = '@open-dcp/i18n';
const FEATURE_NAMESPACE = 'asset-navigator';

const normalizeKey = (key: string, translationPrefix: string): string => {
    if (key.startsWith('@')) {
        return key;
    }

    if (key.startsWith(`${FEATURE_NAMESPACE}.`)) {
        return `${translationPrefix}.${key}`;
    }

    return `${translationPrefix}.${FEATURE_NAMESPACE}.${key}`;
};

export const translateString = (key: string, translation?: EditorTranslation | null) => {
    const translationPrefix = translation?.translationPrefix ?? DEFAULT_TRANSLATION_PREFIX;

    const normalizedKey = normalizeKey(key, translationPrefix);
    const translated = translation?.translator?.(normalizedKey);

    return translated ?? key;
};
