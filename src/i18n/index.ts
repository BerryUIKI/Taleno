import { createSignal, createMemo } from "solid-js";
import { SupportedLocale, LocaleInfo, TranslationDictionary } from "./types";
import { en } from "./locales/en";
import { zhCN } from "./locales/zh-CN";
import { zhTW } from "./locales/zh-TW";
import { ja } from "./locales/ja";
import { ko } from "./locales/ko";
import { de } from "./locales/de";
import { fr } from "./locales/fr";
import { es } from "./locales/es";
import { ru } from "./locales/ru";

export const SUPPORTED_LOCALES: LocaleInfo[] = [
  { code: "en-US", name: "English", nativeName: "English" },
  { code: "zh-CN", name: "Simplified Chinese", nativeName: "简体中文" },
  { code: "zh-TW", name: "Traditional Chinese", nativeName: "繁體中文" },
  { code: "ja-JP", name: "Japanese", nativeName: "日本語" },
  { code: "ko-KR", name: "Korean", nativeName: "한국어" },
  { code: "de-DE", name: "German", nativeName: "Deutsch" },
  { code: "fr-FR", name: "French", nativeName: "Français" },
  { code: "es-ES", name: "Spanish", nativeName: "Español" },
  { code: "ru-RU", name: "Russian", nativeName: "Русский" },
];

const DICTIONARIES: Record<SupportedLocale, TranslationDictionary> = {
  "en-US": en,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  "ja-JP": ja,
  "ko-KR": ko,
  "de-DE": de,
  "fr-FR": fr,
  "es-ES": es,
  "ru-RU": ru,
};

export type LocaleSetting = "auto" | SupportedLocale;

/**
 * Detect the best matching supported locale from system/browser language.
 * Defaults to "en-US" if unresolvable.
 */
export function detectSystemLocale(): SupportedLocale {
  const raw = (navigator.language || (navigator.languages && navigator.languages[0]) || "en").toLowerCase();

  if (raw.startsWith("zh")) {
    if (raw.includes("tw") || raw.includes("hk") || raw.includes("mo") || raw.includes("hant")) {
      return "zh-TW";
    }
    return "zh-CN";
  }
  if (raw.startsWith("ja")) return "ja-JP";
  if (raw.startsWith("ko")) return "ko-KR";
  if (raw.startsWith("de")) return "de-DE";
  if (raw.startsWith("fr")) return "fr-FR";
  if (raw.startsWith("es")) return "es-ES";
  if (raw.startsWith("ru")) return "ru-RU";
  if (raw.startsWith("en")) return "en-US";
  return "en-US";
}

const STORAGE_KEY = "Taleno_locale_setting";

function getInitialSetting(): LocaleSetting {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "auto") return "auto";
  if (saved && saved in DICTIONARIES) return saved as SupportedLocale;
  return "auto";
}

const [localeSetting, setLocaleSettingInternal] = createSignal<LocaleSetting>(getInitialSetting());

/**
 * Active resolved locale code (e.g. 'zh-CN', 'en-US').
 */
export const currentLocale = createMemo<SupportedLocale>(() => {
  const setting = localeSetting();
  if (setting === "auto") {
    return detectSystemLocale();
  }
  return setting;
});

/**
 * Active translation dictionary.
 */
export const currentDict = createMemo<TranslationDictionary>(() => {
  const loc = currentLocale();
  return DICTIONARIES[loc] || en;
});

/**
 * Set and persist language choice ("auto" or specific locale code).
 */
export function setLocale(setting: LocaleSetting) {
  setLocaleSettingInternal(setting);
  localStorage.setItem(STORAGE_KEY, setting);
}

export { localeSetting };

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationDictionary>;

/**
 * Translate a nested key path with parameter interpolation.
 * Example: t("menu.file"), t("statusBar.lineCol", { line: 1, col: 1 })
 */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const dict = currentDict();
  const keys = key.split(".");
  let result: any = dict;

  for (const k of keys) {
    if (result && typeof result === "object" && k in result) {
      result = result[k];
    } else {
      // Fallback to English dictionary
      let fallback: any = en;
      for (const fk of keys) {
        if (fallback && typeof fallback === "object" && fk in fallback) {
          fallback = fallback[fk];
        } else {
          fallback = key;
          break;
        }
      }
      result = fallback;
      break;
    }
  }

  if (typeof result !== "string") {
    return key;
  }

  if (params) {
    return Object.entries(params).reduce((str, [paramKey, paramVal]) => {
      return str.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
    }, result);
  }

  return result;
}
