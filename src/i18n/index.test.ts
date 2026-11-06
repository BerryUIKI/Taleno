import { describe, it, expect, beforeEach } from "vitest";
import {
  SUPPORTED_LOCALES,
  t,
  setLocale,
  detectSystemLocale,
} from "./index";
import { compareVersions } from "../lib/updater";
import { en } from "./locales/en";
import { zhCN } from "./locales/zh-CN";
import { zhTW } from "./locales/zh-TW";
import { ja } from "./locales/ja";
import { ko } from "./locales/ko";
import { de } from "./locales/de";
import { fr } from "./locales/fr";
import { es } from "./locales/es";
import { ru } from "./locales/ru";

describe("i18n Internationalization Engine", () => {
  beforeEach(() => {
    setLocale("en-US");
  });

  it("should support at least 9 distinct languages", () => {
    expect(SUPPORTED_LOCALES.length).toBeGreaterThanOrEqual(9);
    const codes = SUPPORTED_LOCALES.map((l) => l.code);
    expect(codes).toContain("en-US");
    expect(codes).toContain("zh-CN");
    expect(codes).toContain("zh-TW");
    expect(codes).toContain("ja-JP");
    expect(codes).toContain("ko-KR");
    expect(codes).toContain("de-DE");
    expect(codes).toContain("fr-FR");
    expect(codes).toContain("es-ES");
    expect(codes).toContain("ru-RU");
  });

  it("should have complete dictionary coverage for all languages", () => {
    const dicts = [en, zhCN, zhTW, ja, ko, de, fr, es, ru];
    dicts.forEach((d) => {
      expect(d.app.name).toBe("Taleno");
      expect(d.menu.file).toBeTruthy();
      expect(d.menu.edit).toBeTruthy();
      expect(d.menu.view).toBeTruthy();
      expect(d.menu.window).toBeTruthy();
      expect(d.menu.help).toBeTruthy();
      expect(d.menu.language).toBeTruthy();
      expect(d.menu.languageSubtitle).toBeTruthy();
      expect(d.menu.autoLanguageDesc).toBeTruthy();
      expect(d.file.newDocument).toBeTruthy();
      expect(d.file.openFile).toBeTruthy();
      expect(d.file.save).toBeTruthy();
      expect(d.edit.bold).toBeTruthy();
      expect(d.sidebar.outline).toBeTruthy();
      expect(d.sidebar.files).toBeTruthy();
      expect(d.sidebar.workspace).toBeTruthy();
      expect(d.view.themeSettings).toBeTruthy();
      expect(d.settings.themeTab).toBeTruthy();
      expect(d.settings.elementShadows).toBeTruthy();
      expect(d.settings.updatesTab).toBeTruthy();
      expect(d.settings.automaticUpdateChecks).toBeTruthy();
      expect(d.statusBar.wordsCount).toBeTruthy();
      expect(d.update.checking).toBeTruthy();
      expect(d.update.aheadTitle).toBeTruthy();
      expect(d.update.aheadDesc).toBeTruthy();
      expect(d.update.aheadBadge).toBeTruthy();
      expect(d.update.installAndRestart).toBeTruthy();
      expect(d.update.unsavedMessage).toBeTruthy();
    });
  });

  it("should translate keys properly in English", () => {
    setLocale("en-US");
    expect(t("menu.file")).toBe("File");
    expect(t("menu.edit")).toBe("Edit");
    expect(t("file.newDocument")).toBe("New Document");
    expect(t("update.aheadTitle")).toBe("🌟 Ahead of Public Release");
  });

  it("should translate keys properly in Simplified Chinese", () => {
    setLocale("zh-CN");
    expect(t("menu.file")).toBe("文件");
    expect(t("menu.edit")).toBe("编辑");
    expect(t("file.newDocument")).toBe("新建文档");
    expect(t("update.aheadTitle")).toBe("🌟 领先于官方发行版");
    expect(
      t("update.aheadDesc", { current: "v0.1.2", latest: "v0.1.1" })
    ).toBe("检测到本地版本为 v0.1.2，官方最新公开版本为 v0.1.1。");
  });

  it("should translate keys properly in Traditional Chinese", () => {
    setLocale("zh-TW");
    expect(t("menu.file")).toBe("檔案");
    expect(t("menu.edit")).toBe("編輯");
    expect(t("file.newDocument")).toBe("新增文件");
    expect(t("update.aheadTitle")).toBe("🌟 領先於官方發行版");
  });

  it("should translate keys properly in Japanese", () => {
    setLocale("ja-JP");
    expect(t("menu.file")).toBe("ファイル");
    expect(t("file.newDocument")).toBe("新規ドキュメント");
    expect(t("update.aheadTitle")).toBe("🌟 公式リリースより新しいバージョン");
  });

  it("should translate keys properly in Korean", () => {
    setLocale("ko-KR");
    expect(t("menu.file")).toBe("파일");
    expect(t("file.newDocument")).toBe("새 문서");
    expect(t("update.aheadTitle")).toBe("🌟 공식 릴리스보다 앞선 버전");
  });

  it("should translate keys properly in German", () => {
    setLocale("de-DE");
    expect(t("menu.file")).toBe("Datei");
    expect(t("file.newDocument")).toBe("Neues Dokument");
    expect(t("update.aheadTitle")).toBe("🌟 Dem offiziellen Release voraus");
  });

  it("should translate keys properly in French", () => {
    setLocale("fr-FR");
    expect(t("menu.file")).toBe("Fichier");
    expect(t("file.newDocument")).toBe("Nouveau document");
    expect(t("update.aheadTitle")).toBe("🌟 En avance sur la version publique");
  });

  it("should translate keys properly in Spanish", () => {
    setLocale("es-ES");
    expect(t("menu.file")).toBe("Archivo");
    expect(t("file.newDocument")).toBe("Nuevo documento");
    expect(t("update.aheadTitle")).toBe("🌟 Por delante del lanzamiento oficial");
  });

  it("should translate keys properly in Russian", () => {
    setLocale("ru-RU");
    expect(t("menu.file")).toBe("Файл");
    expect(t("file.newDocument")).toBe("Новый документ");
    expect(t("update.aheadTitle")).toBe("🌟 Опережает официальный релиз");
  });

  it("should interpolate dynamic parameters correctly", () => {
    setLocale("en-US");
    expect(t("statusBar.lineCol", { line: 42, col: 17 })).toBe("Ln 42, Col 17");

    setLocale("zh-CN");
    expect(t("statusBar.lineCol", { line: 42, col: 17 })).toBe("第 42 行，第 17 列");
  });

  it("should correctly compare version strings in compareVersions", () => {
    expect(compareVersions("v0.1.3", "0.1.2")).toBe(1); // remote is newer -> update available
    expect(compareVersions("v0.1.1", "0.1.2")).toBe(-1); // local is ahead -> ahead of public release
    expect(compareVersions("v0.1.2", "0.1.2")).toBe(0); // same -> up to date
  });

  it("should fallback gracefully if system locale is unknown", () => {
    expect(detectSystemLocale()).toBeDefined();
  });
});
