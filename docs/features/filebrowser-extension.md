# Filebrowser: binary transfers, download to device, sorting and multi-select

Status: implemented (backend untested against a running plugin server)
Date: 2026-09-01

## Goal

The file browser becomes usable on a phone: files can be saved onto the device,
large capture folders can be sorted and searched, and several entries can be
deleted or downloaded in one go. The foundation for all of that is the backend
finally handing out real bytes — until now `GET /api/filesystem/file` read every
file as UTF-8 text, which turned every byte >= 0x80 into U+FFFD and made image
previews and downloads impossible.

Based on the inventory in [../filebrowser-plugin-overview.md](../filebrowser-plugin-overview.md).

## Scope

- Runtime modes: NINA and PINS (`plugin.json` carries `isPins: false`) — the
  filesystem controller ships with the NINA plugin and answers in both modes
- Backend: `FilesystemController.cs` in the Touch'N'Stars NINA plugin
  (`N.I.N.A-Plugin-for-Touch-N-Stars`, branch `File-Browser-Extension`)
- Surface: `src/plugins/filebrowser/**`, `src/services/api/filesystem.js`
- State owner: component-local — the browser holds no state across sessions

## Backend contract

| Endpoint                                       | Change                                                                                                                                                                        |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/filesystem/file?path=…[&download=1]` | streams the raw file, with a real `Content-Type` from the extension, `Content-Length` and `Content-Disposition` (`inline`, or `attachment` with `download=1`)                 |
| `PUT /api/filesystem/rename`                   | new; body `{ sourcePath, targetPath }`, works for files and directories. 400 missing fields / target parent missing, 404 source missing, 409 target exists, 403 access denied |

`Content-Length` is what lets the client show real download progress.

## Non-goals

- No root whitelist and no auth on the filesystem controller. The controller
  still accepts any path — see §9 of the inventory. Rename is the first write
  access, so this should be the next issue on top of this branch.
- No thumbnails or grid view, no upload, no move/copy between folders (the
  rename endpoint would already support a move).
- No Range/resume support for interrupted transfers.
- The defensive logic in `useFitsPreview.js` (`inferImageGeometry` fallback,
  `truncated`, `decodablePixelCount`) is untouched. It only becomes removable
  once the binary stream is verified against a running plugin server.

## Acceptance criteria

1. Given a PNG or JPG in the browsed folder, when it is opened, the preview
   shows the real image (previously a broken/blank image).
2. Given any file, when "save to device" is used, it lands in
   `Documents/TouchNStars/Filebrowser` on Android/iOS and in the browser's
   download folder otherwise — byte-identical to the original.
3. Given a folder with many frames, when sorting by name, `M31_2` sorts before
   `M31_10`; sorting by date or size reverses fully with the direction toggle.
4. Given a search term, the list filters directories and files case-insensitively.
5. Given several selected files, when downloading, transfers run one after
   another with an `n/total` progress bar that can be cancelled; already saved
   files stay.
6. Given several selected entries, when deleting, exactly one confirmation is
   shown, naming how many of them are directories.
7. Given a rename, the entry is renamed without a 404 and stays selected.
8. Every control is at least 48 px high (`min-h-touch`) and uses the `tns-*`
   utilities.

## Interaction model

The list is selection driven, like the iOS Files app: tapping a file row toggles
its selection, tapping a directory row opens it, and a sticky action bar at the
bottom carries open / download / rename / delete for whatever is selected. Open
and rename require exactly one selected entry. This replaces the four 32 px icon
buttons that used to sit in every row.

## Verification

```bash
npm run lint && npm run format:check && npm run build && npm run test:run && npm run i18n:check
```

Backend, against a running plugin server:

```bash
curl -s -D- -o /tmp/t.png "http://<host>:<port>/api/filesystem/file?path=<file.png>" | head
file /tmp/t.png            # PNG image data, not "data"
cmp /tmp/t.png <original>   # identical
```

---

# Phase 2: render previews in NINA instead of in JavaScript

Status: implemented (backend untested against a running plugin server)
Date: 2026-09-01

## Problem

Two symptoms, one cause.

- **FITS previews are slow.** Opening a frame downloads the whole file to the
  phone (`fetchFilesystemFileBuffer` in `src/services/api/filesystem.js:219`) and
  then decodes, debayers and stretches it in JS — 948 lines in
  `useFitsPreview.js`. A 16-bit 6000×4000 frame is ~48 MB over Wi-Fi before the
  first pixel appears, followed by a single-threaded decode.
- **Only FITS opens.** `FITS_EXTENSIONS` is `['fit', 'fits', 'fts']`
  (`useFitsPreview.js:4`), so XISF and DSLR raw (CR2/CR3/NEF/ARW/…) fall through
  `openFile()` to "download to device". Adding them in JS means writing an XISF
  parser and a raw demosaicer — and then maintaining both.

The cause is that the app re-implements an image pipeline that NINA already has.

## Why the backend is the right place

The plugin already does this. `FitsAnalysisController.cs:74` loads frames from
disk with `TouchNStars.Mediators.ImageDataFactory.CreateFromFile(...)`, so the
factory, mediators and registration all exist — Phase 2 adds a route, not
infrastructure.

What that factory buys us, from `NINA.Image/ImageData/BaseImageData.cs:601`
(`FromFile` dispatch):

| Group    | Extensions                                                            |
| -------- | --------------------------------------------------------------------- |
| Astro    | `.fit` `.fits` `.fts` `.fz` `.xisf`                                   |
| Raw      | `.cr2` `.cr3` `.nef` `.raf` `.raw` `.pef` `.dng` `.arw` `.orf` `.rw2` |
| Ordinary | `.gif` `.tif` `.tiff` `.jpg` `.jpeg` `.png`                           |

XISF and DSLR raw are therefore not a feature to build, they are a switch to
flip. `BaseImageData.FileIsSupported(path)` (`:653`) is a ready-made regex that
should drive the browser's "can this be previewed" decision instead of the
hardcoded extension lists.

Rendering is equally ready: `IImageData.RenderImage()` returns an
`IRenderedImage` with `Debayer(...)`, `Stretch(factor, blackClipping, unlinked)`
and `GetThumbnail()` (`NINA.Image/Interfaces/IRenderedImage.cs`). These are the
same routines behind NINA's own image view, so a preview in the app finally looks
like the frame does on the desktop — the JS stretch never matched it.

Encoding works in **both** runtime modes, which is the part worth checking before
committing to this: PINS ships headless `JpegBitmapEncoder`/`PngBitmapEncoder`
in `System.Windows.Compat/Media/Imaging/BitmapEncoders.cs`, and ninaAPI's
`BitmapHelper.cs` (`GetEncoder`/`ScaleBitmap`) runs unchanged under both. Copy
that shape rather than reaching for ImageSharp, which the plugin only uses for
Stellarium landscapes.

The payoff on the wire: ~48 MB becomes a ~300 KB JPEG at screen resolution.

## Backend contract (new)

| Endpoint                                                                                                 | Purpose                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/filesystem/preview?path=…&maxWidth=…&quality=…&stretch=…&blackClipping=…&unlinked=…&debayer=…` | renders the file through `ImageDataFactory` → `RenderImage` → `Stretch` → scaled JPEG (or PNG at `quality<0`), streamed with `Content-Type` and `Content-Length` |
| `GET /api/filesystem/imageinfo?path=…`                                                                   | JSON: dimensions, bit depth, bayer pattern, `isSupported`, and the header/metadata table that `fitsHeaderEntries` shows today                                    |

Both live in `FilesystemController.cs` (already registered at
`TouchNStarsServer.cs:61`), with the loading and rendering in a new
`Server/Services/ImagePreviewService.cs` — controllers stay thin.

Defaults: `maxWidth` = the device's CSS pixel width × DPR, capped at 2048;
`quality` = 85; `stretch`/`blackClipping` from
`profile.ImageSettings.AutoStretchFactor` / `BlackClipping` so the app agrees
with NINA out of the box.

### Cache and back pressure

Rendering competes with capture and plate solving on the NINA machine, so the
service must be bounded:

- One render at a time (`SemaphoreSlim(1)`), queued, with the request's
  `CancellationToken` honoured so closing the modal actually stops the work.
- Cache the last decoded `IRenderedImage` keyed by path with a short TTL
  (~60 s, 1 entry). Moving a stretch slider then re-runs only `Stretch` +
  encode, not the file read and debayer — that is what keeps the sliders usable
  over a round trip.
- Frontend debounces slider changes (~250 ms) and cancels the in-flight request
  via `AbortSignal`, the way `useFilebrowserDownload.js` already cancels.

## Frontend changes

- `useFitsPreview.js` shrinks from a decoder to a viewer: request a URL from
  `getFilesystemPreviewUrl(path, params)`, bind it to `<img>`, drop the canvas.
  The parser, demosaicer, stretch maths and the whole defensive block
  (`inferImageGeometry`, `truncated`, `decodablePixelCount`) go with it. Rename
  it to `useImagePreview.js` — it is no longer FITS-specific.
- `preview` and `imageinfo` methods go into `src/services/api/filesystem.js`
  against `API_URL` (plugin server port, not `apiPort`), then the surface
  snapshot is regenerated with
  `node --import ./scripts/test-loader.mjs scripts/dump-api-surface.mjs`.
- The stretch controls stay, they just post their values as query parameters.
- `previewLoading` gets a real spinner state again — the delay moves from
  "download bar" to "server is rendering". A second flag, `previewImageLoading`,
  covers the `<img>` itself: it is set whenever the `src` changes (initial open
  and every stretch-slider commit) and cleared on the `load`/`error` event, so
  the rendered-JPEG transfer also shows a spinner instead of a stale or blank
  frame while it comes over the wire.

## Risks

- **libraw on PINS.** Raw goes through `LibRawConverter`
  (`NINA.Image/RawConverter/LibRawConverter.cs`); the native library has to be
  present on the Linux build. Verify before promising CR2 support in PINS mode —
  if it is missing, `imageinfo` reports the file as unsupported and the entry
  falls back to "download to device", which is today's behaviour anyway.
- **The obsolete overload.** `FitsAnalysisController.cs:75` passes
  `RawConverterEnum.FREEIMAGE` to a `[Obsolete]` overload that ignores the
  argument (`BaseImageData.cs:775`). New code uses
  `CreateFromFile(path, bitDepth, isBayered, ct)`; the old call should be
  cleaned up in passing.
- **Bit depth for raw.** `CreateFromFile` takes an explicit `bitDepth`; for raw
  files use the camera profile value rather than the hardcoded 16.
- **Server load during a sequence.** Mitigated by the semaphore above, but worth
  a look at NINA's CPU while a preview renders mid-capture.
- **Offline regression.** Rendering now needs the NINA machine, where the JS path
  only needed the bytes. Acceptable — the browser cannot reach the file without
  the plugin server either way.

## Acceptance criteria

1. Given a FITS frame of ~50 MB, when it is opened on a phone, the preview
   appears in noticeably less time than the current full download, and the
   transferred payload is well under 1 MB.
2. Given an XISF file, when it is tapped, it opens as a preview instead of
   starting a download.
3. Given a CR2/NEF from a DSLR, when it is tapped, it opens debayered in colour
   (NINA mode; PINS depends on libraw, see Risks).
4. Given an open preview, when a stretch slider is moved, the image updates
   without re-reading the file from disk, and rapid changes cancel their
   predecessor instead of queueing up.
5. Given the preview is closed mid-render, the server-side render is cancelled.
6. Given an unsupported file, `imageinfo` reports it and the row falls back to
   "download to device" — no broken preview modal.
7. The FITS header table still shows, now sourced from `imageinfo`.
8. Both runtime modes render: NINA on Windows and PINS headless on Linux.

## Sequencing

Phase 2 assumes the Phase 1 binary stream is verified against a running plugin
server — `imageinfo`/`preview` share its path handling, and the `useFitsPreview`
cleanup listed as a Phase 1 non-goal is simply absorbed here. Do not start
before that check.
