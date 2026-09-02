# Filebrowser-Plugin — technischer Überblick

Stand: 2026-09-01, Branch `File-Browser-Extension`, Plugin-Version 1.1.0.

> Die in §3 beschriebenen Backend-Lücken sind auf diesem Branch geschlossen, §7/§8 sind
> teilweise abgearbeitet. Umsetzung und Restumfang: [features/filebrowser-extension.md](features/filebrowser-extension.md).

Bestandsaufnahme als Grundlage für die Erweiterung des Plugins. Beschreibt Aufbau,
Datenfluss, Backend-Vertrag, bekannte Lücken und Kandidaten für nächste Schritte.

## 1. Aufbau

| Datei                                                            | Zeilen | Rolle                                                                    |
| ---------------------------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| `src/plugins/filebrowser/plugin.json`                            | 10     | Metadaten, `isPins: true`, `defaultEnabled: false`, v1.0.1               |
| `src/plugins/filebrowser/index.js`                               | 76     | Route + Navigationseintrag, Inline-SVG-Icon                              |
| `src/plugins/filebrowser/views/filebrowser.vue`                  | 490    | Container: gesamter State + alle CRUD-Aktionen                           |
| `src/plugins/filebrowser/components/FilebrowserTopControls.vue`  | 124    | Pfadanzeige, Up/Refresh, Images-Only-Filter, Ordner anlegen, Breadcrumbs |
| `src/plugins/filebrowser/components/FilebrowserListPanel.vue`    | 184    | Liste Verzeichnisse + Dateien mit Zeilen-Aktionen                        |
| `src/plugins/filebrowser/components/FilebrowserDetailsPanel.vue` | 68     | Detailspalte zur Auswahl                                                 |
| `src/plugins/filebrowser/components/FilebrowserPreviewModal.vue` | 306    | Bild-/FITS-Vorschau + FITS-Debug-Panel                                   |
| `src/plugins/filebrowser/components/FilebrowserRenameDialog.vue` | 78     | Umbenennen-Dialog                                                        |
| `src/plugins/filebrowser/composables/useFitsPreview.js`          | 943    | kompletter FITS-Decoder im Browser                                       |

Die Architektur ist sauber getrennt: **View hält Zustand und Aktionen, die Kinder sind rein
präsentational** (Props rein, Events raus, keine eigenen API-Calls). Der einzige Composable
kapselt die Vorschau vollständig und hängt nur über `{ apiService }` am Rest der App.

## 2. Datenfluss

`filebrowser.vue` → `apiService` → `src/services/api/filesystem.js` → **`API_URL`**
(`http://<host>:<connection.port>/api/`) = Touch'N'Stars-Plugin-Server (C#).
Nicht die NINA Advanced API und nicht der PINS-Daemon.

| Frontend-Methode                                                                       | Request                                  | Backend vorhanden? |
| -------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------ |
| `browseFilesystem(path)`                                                               | `GET /api/filesystem/browse?path=`       | ja                 |
| `createFilesystemDirectory(path)`                                                      | `POST /api/filesystem/directory`         | ja                 |
| `deleteFilesystemDirectory(path)`                                                      | `DELETE /api/filesystem/directory?path=` | ja (rekursiv)      |
| `deleteFilesystemFile(path)`                                                           | `DELETE /api/filesystem/file?path=`      | ja                 |
| `renameFilesystemEntry(src, dst)`                                                      | `PUT /api/filesystem/rename`             | **nein — fehlt**   |
| `getFilesystemFileStreamUrl` / `fetchFilesystemFileBuffer` / `fetchFilesystemFileText` | `GET /api/filesystem/file?path=`         | nur Text           |

Browse-Antwort: `{ success, currentPath, parentPath, directories[], files[] }`;
Verzeichniseinträge `{ name, path, lastModified }`, Dateieinträge zusätzlich `size`.
Ohne `path` liefert das Backend `MyDocuments`.

## 3. Zwei harte Backend-Lücken — geschlossen

Geprüft in
`…/N.I.N.A-Plugin-for-Touch-N-Stars/Touch-N-Stars/Server/Controllers/FilesystemController.cs`.

1. **`rename`-Endpoint fehlte.** Ergänzt als `PUT /filesystem/rename` mit Body
   `{ sourcePath, targetPath }`, für Dateien und Verzeichnisse. Der Dialog läuft nicht mehr
   in einen 404, und die Fehlermeldung ist jetzt `renameError`/`renameEmptyName` statt
   `loadError`.
2. **`GET /filesystem/file` war textbasiert.** Ersetzt durch einen echten Byte-Stream mit
   Content-Type aus der Dateiendung, `Content-Length` (Voraussetzung für die
   Fortschrittsanzeige) und `Content-Disposition`; `download=1` erzwingt `attachment`.

Noch offen: die Defensiv-Logik im Composable (`inferImageGeometry`, `truncated`,
`decodablePixelCount`) steht unverändert. Sie lässt sich erst zurückbauen, wenn der
Byte-Stream gegen einen laufenden Plugin-Server verifiziert ist.

`DEFAULT_TIMEOUT` (10 s) gilt nicht mehr für Dateitransfers — `filesystem.js` verwendet dafür
ein eigenes `FILE_TRANSFER_TIMEOUT` von 120 s.

## 4. FITS-Decoder

`useFitsPreview.js` implementiert vollständig in JavaScript:

- Multi-HDU-Header-Parsing mit Auswahl des ersten Bild-HDU, Fallback auf das erste HDU
- BITPIX 8/16/32/-32/-64, BSCALE/BZERO
- Perzentil-Stretch (1 % / 99,5 %), Stretch-Modi linear/sqrt/log/asinh
- Bayer-Debayering (RGGB/BGGR/GRBG/GBRG, bilinear) und Auto-Weißabgleich
- Rendering auf Canvas mit vertikalem Flip, rAF-gedrosselt, plus detaillierte Perf-Messung

Relevant für Erweiterungen:

- Alles läuft **synchron im Main-Thread** — bei großen Sensoren blockiert das die UI.
  Web Worker + `OffscreenCanvas` wäre der naheliegende nächste Schritt.
- Kein Zoom/Pan im Modal (es gibt `ZoomableImage.vue` im Projekt), kein Histogramm,
  kein Downsampling.
- Das „FITS Debug"-Panel ist aufgeteilt: die Stretch-Steuerung ist ein normales, übersetztes
  Bedienpanel, die Diagnosewerte liegen in einem eingeklappten `<details>` darunter.

## 5. Integration in die App

- **Gating:** `isPins: true` → Navigationseintrag nur wenn `store.isPINS`
  (`NavigationComp.vue:595`), in den Einstellungen nur unter „PINS-Plugins"
  (`SettingsPluginsTab.vue:106-115`). Standardmäßig aus; der Nutzerzustand liegt persistiert
  in `localStorage` unter `plugin-store`.
- **Route:** `/pluginN`, `meta: { requiresSetup: true }`. `index.js` nutzt jetzt das aktuelle
  Registrierungsmuster (`currentPlugin.pluginPath` + `addPluginNavigationItem`, wie
  `src/plugins/hardware-db/index.js`).
- **Startpfad:** `onMounted` → `jumpToImageSavePath()` → `store.imageSavePath` (aus
  `profileInfo.ImageFileSettings.FilePath`), mit Fallback auf `browse('')`.
- **Löschen** nutzt korrekt `toastStore.showConfirmation`.

## 6. i18n

`plugins.filebrowser.*` ist in **allen 14 Locales vollständig**. Die drei toten Keys
(`onHoldTitle`, `onHoldMessage`, `currentPath`) sind entfernt, `loadError` wird nicht mehr für
„leerer Name beim Umbenennen" missbraucht, und `mapFilesystemError` in
`src/services/api/filesystem.js` reicht statt der rohen axios-Meldung den Backend-Grund durch.

## 7. UI-Konventionen

Erledigt: alle Komponenten nutzen jetzt `tns-*` und `min-h-touch`. Die vier Icon-Buttons pro
Zeile sind weg — die Liste ist auswahlgetrieben (Zeile antippen wählt aus, Ordnerzeile öffnet),
Aktionen liegen in einer klebrigen Aktionsleiste am unteren Rand.

Ebenfalls erledigt: `openFile` fällt für nicht-vorschaubare Dateien nicht mehr auf
`window.open` zurück, sondern speichert über `src/utils/blobDownloader.js` auf das Gerät.

## 8. Was fehlt (Kandidaten für die Erweiterung)

Erledigt: Sortierung (Name/Datum/Größe), Suche, Mehrfachauswahl mit Sammel-Löschen und
Sammel-Download, Download auf das Gerät, Tests für die Listenlogik, Eintrag in `docs/features/`.

Weiterhin offen:

- Paginierung oder Virtualisierung bei sehr großen Ordnern — es wird immer alles gerendert
- Verschieben/Kopieren (der rename-Endpoint könnte das schon), Upload
- Thumbnails/Grid-Ansicht statt reiner Liste (für Bildordner der eigentliche Anwendungsfall)
- Freies Pfad-Eingabefeld und Sprungziele (Logs, Sequenzen, Profile)

## 9. Sicherheit

Das Backend akzeptiert jeden Pfad (`Path.GetFullPath`, keine Root-Beschränkung, keine Auth) und
löscht Verzeichnisse rekursiv. Der Filebrowser kann damit das gesamte Dateisystem des
NINA-/PINS-Rechners lesen und löschen. Für ein LAN-Gerät vertretbar, aber bei jeder Erweiterung
Richtung Schreiben/Verschieben/Upload sollte parallel eine Root-Whitelist im Controller
entstehen.

## 10. Nächste Schritte

1. **Sicherheit:** Root-Whitelist im Controller (§9) — jetzt am dringendsten, weil mit
   `rename` der erste Schreibzugriff dazugekommen ist.
2. **Backend verifizieren:** Byte-Stream gegen einen laufenden Plugin-Server prüfen, danach
   die Korruptions-Defensive im FITS-Composable zurückbauen.
3. **Features:** Thumbnails/Grid, Virtualisierung großer Ordner, Verschieben/Upload.
