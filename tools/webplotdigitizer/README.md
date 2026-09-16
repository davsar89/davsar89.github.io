# WebPlotDigitizer 4.7 — single-file standalone build

[WebPlotDigitizer](https://github.com/ankitrohatgi/WebPlotDigitizer) by Ankit Rohatgi,
repackaged as **one self-contained `.html` file**.

## Just take the one file

Download [`WebPlotDigitizer-4.7-standalone.html`](WebPlotDigitizer-4.7-standalone.html)
(1.65 MiB) and double-click it. That is the whole program.

No install, no server, no network, no Electron, nothing to sit next to it. Put it on a
USB stick or email it and it works on any machine with a modern browser. The
`build/` folder here is optional and is only needed if you want to regenerate the file
yourself — you never need it to *use* the digitizer.

For comparison, the official desktop build is a 177 MB `.exe` plus ~230 MB of bundled
Chromium; the hosted version needs a web server.

## What's in the file

Everything the app referenced is inlined: `wpd.min.js`, both stylesheets, all 11 PNGs
as data-URIs, the favicon, `tarball.js`, and `pdf.js` + `pdf.worker.js`. The Google
Fonts stylesheet — the only network resource the original page loaded — is dropped,
because no CSS rule actually used Roboto.

Verified empirically: serving the file alone in an otherwise empty directory and
exercising the whole app produced **exactly one HTTP request, for the page itself**.

## What works

Everything below was tested by clicking through the real UI:

- Load images via the file picker, drag-and-drop or clipboard paste
- All 7 axis types offered; XY calibration (linear and log) verified numerically
- Manual point acquisition, data table, sorting and number formatting
- Automatic extraction: box mask, colour picker with dominant-colour analysis,
  averaging-window detection
- CSV export, Save/Load Project (`.tar`), JSON export
- PDF import including multi-page navigation
- Image editing (crop) with undo/redo
- Distance measurements
- Rotate, zoom, fit, extended crosshair
- "Run Script" user-script injection

Accuracy was checked against ground truth generated with matplotlib, where the exact
pixel↔data mapping is known by construction:

| Check | Result |
|---|---|
| `pixelToData` vs matplotlib `transData`, linear axes | agrees to 2e-16 |
| same, log-log axes | agrees to 2e-15 |
| Auto-detection of a plotted curve | 124 points, 0.024 % median error of full scale |
| Distance measurement | matched predicted pixel distance exactly |

## Known limitations

- **PDF parsing runs on the main thread**, so the UI blocks briefly on large PDFs.
  `file://` pages have an opaque origin and Chrome refuses to construct a Worker from
  a `blob:` URL there, so the worker is inlined and run in-page instead. If this ever
  matters, serve the file over `http://localhost` and the stock worker path applies
  unchanged.
- **Webcam capture does not work** — but it is already dead upstream, using APIs
  browsers removed years ago. Not a regression from bundling.
- **"Export to Plotly" needs internet**, by design. Left in place.
- **CID/CJK PDFs render poorly** — upstream never sets `cMapUrl`. Pre-existing.
- **`?projectid=` deep links** don't work; they need the automeris.io backend.
- Reloading the page loses unsaved work — WPD keeps all state in memory by design.
  Save a `.tar` project.

Not yet exercised through the UI: Bar / Polar / Ternary / Map / Image / Circular
Chart Recorder calibration, pen and erase masks, point groups, angle and area
measurements, and grid detection. These are unmodified upstream code paths that the
bundling does not touch, but they have not been clicked through.

## How it was built

Three things in WPD only work when the app is served over HTTP. All three are handled
by a ~30-line shim injected ahead of `wpd.min.js`, at shared choke points — the
upstream JavaScript bundle is inlined **unmodified**.

1. **`fetch("start.png")`** (`javascript/main.js:37`) fails off a server. This looks
   cosmetic, but `graphicsWidget.init()` is private and runs *only* from
   `loadImage()`, and it is what binds the canvas mouse, drag-drop and paste handlers.
   Without a fix the app loads looking fine but silently cannot accept a pasted image.
   The shim serves the inlined PNG from a `Blob`.

2. **`fetch("log")`** (`javascript/services/log.js:34`) is a telemetry probe. The shim
   answers `"false"`, which is what the server returns when logging is disabled, so
   the no-op branch is taken. **This build sends nothing anywhere.**

3. **`window.open(canvas.toDataURL())`** in `graphicsWidget.saveImage()` — Chrome and
   Firefox have blocked top-level navigation to `data:` URLs since 2018, so "Save
   Image" is broken in every browser build of WPD today. The shim routes `data:` URLs
   to a download instead.

For PDF support, `pdf.worker.min.js` is inlined as an ordinary page script. Its UMD
header sets `window.pdfjsWorker`, and pdf.js skips worker construction entirely when
`globalThis.pdfjsWorker.WorkerMessageHandler` already exists — the same mechanism as
the stock `pdf.worker.entry.js`.

## Rebuilding (optional)

You do not need this to use the digitizer. `build/build_single_file.js` requires a
WebPlotDigitizer 4.7 source tree, because it reads the already-built `index.html` and
the assets it references. Copy both scripts into that tree (next to `build_js.sh`) and
run:

```sh
node build_single_file.js               # -> WebPlotDigitizer-4.7-standalone.html
node check_single_file.js               # fails if anything is not inlined
```

`check_single_file.js` fails the build if any `src`/`href`/`url()` resolves to
anything other than a `data:` URI, if the `.i18n-string { display: none }` rule went
missing (without it 85 raw UI strings render at the bottom of the page), or if any
piece of the shim is absent.

Both scripts are plain Node with no dependencies. The input page is an argument, so
passing `index.fr_FR.html`, `index.de_DE.html`, `index.ja.html`, `index.ru.html` or
`index.zh_CN.html` produces a standalone build in that language with no code changes.

## Licence and credit

WebPlotDigitizer is © 2010–2024 Ankit Rohatgi and licensed **AGPL-3.0**. This
repackaging is covered by the same licence; see [`LICENSE`](LICENSE).

- Upstream source: https://github.com/ankitrohatgi/WebPlotDigitizer
- Project site: https://automeris.io/WebPlotDigitizer

This repository contains no modifications to WebPlotDigitizer's own source. The
standalone file embeds `wpd.min.js` verbatim; the corresponding source is the
upstream repository above, at version 4.7. Bundled third-party components:
[pdf.js](https://github.com/mozilla/pdf.js) (Apache-2.0) and
[tarballjs](https://github.com/ankitrohatgi/tarballjs) (MIT).
