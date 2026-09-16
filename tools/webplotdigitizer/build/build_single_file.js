#!/usr/bin/env node
/*
    build_single_file.js - bundle WebPlotDigitizer into one standalone .html

    Reads an already-rendered WPD page (index.html or any index.<lang>.html) and
    inlines every resource it references, so the result runs by double-clicking
    it from a file:// URL with no server and no network.

    Usage:  node build_single_file.js [input.html] [output.html]

    Nothing in the source tree is modified; all inputs are read-only.
    Run check_single_file.js afterwards to assert the result is self-contained.
*/

const fs = require("fs");
const path = require("path");

const IN = process.argv[2] || "index.html";
const OUT = process.argv[3] || "WebPlotDigitizer-4.7-standalone.html";

const PDF = "node_modules/pdfjs-dist/build";
const read = p => fs.readFileSync(p, "utf8");
const b64 = p => fs.readFileSync(p).toString("base64");

// A string inlined into <script>/<style> must not contain a closing tag, or the
// parser ends the block early. None of WPD's bundles do today; this keeps that
// from becoming a silent corruption if one ever does.
const esc = s => s.replace(/<\/(script|style)/gi, "<\\/$1");

const banner = f => "\n/* ===== " + f + " ===== */\n";
const js = f => "<script>" + banner(f) + esc(read(f)) + "\n</script>";
const css = f => "<style>" + banner(f) + esc(read(f)) + "\n</style>";

let html = read(IN);
const sub = (needle, replacement) => {
    if (!html.includes(needle)) {
        throw new Error("build_single_file: expected markup not found in " + IN + ":\n  " + needle);
    }
    html = html.replace(needle, () => replacement);
};

// ---------------------------------------------------------------- shim ------
// Three things the app does that only work when it is served over HTTP.
// Patched here, at the two shared choke points, rather than in WPD's source -
// the URL literals survive minification, so the shipped wpd.min.js is used
// as-is.
const shim = [
    '<script>',
    '/* ===== WebPlotDigitizer standalone shim ===== */',
    '(function () {',
    '    "use strict";',
    '',
    '    // start.png, inlined. Not just cosmetic: graphicsWidget.init() is private',
    '    // and runs only from loadImage(), and it is what binds the canvas mouse,',
    '    // drop and paste handlers. If the default image never loads, then',
    '    // drag-and-drop and clipboard paste are silently dead.',
    '    var START_PNG = "' + b64("start.png") + '";',
    '',
    '    function b64ToBlob(b64, type) {',
    '        var bin = atob(b64), buf = new Uint8Array(bin.length);',
    '        for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);',
    '        return new Blob([buf], {type: type});',
    '    }',
    '',
    '    var realFetch = window.fetch && window.fetch.bind(window);',
    '    window.fetch = function (input, init) {',
    '        var url = typeof input === "string" ? input : (input && input.url) || "";',
    '        // javascript/main.js:37',
    '        if (url === "start.png") {',
    '            return Promise.resolve(new Response(b64ToBlob(START_PNG, "image/png"), {status: 200}));',
    '        }',
    '        // javascript/services/log.js:34 - "false" is what the server returns',
    '        // when logging is disabled, so log.js takes its no-op branch. This',
    '        // file sends nothing anywhere.',
    '        if (url === "log") {',
    '            return Promise.resolve(new Response("false", {status: 200}));',
    '        }',
    '        return realFetch ? realFetch(input, init)',
    '                         : Promise.reject(new Error("offline build: " + url));',
    '    };',
    '',
    '    // graphicsWidget.saveImage() does window.open(canvas.toDataURL()), and',
    '    // Chrome (60+) and Firefox (59+) block top-level navigation to data: URLs,',
    '    // so Save Image is dead on the web today too. Route data: URLs to a',
    '    // download instead - one guard at the shared choke point, not per caller.',
    '    var realOpen = window.open.bind(window);',
    '    window.open = function (url) {',
    '        if (typeof url === "string" && url.slice(0, 5) === "data:") {',
    '            var a = document.createElement("a");',
    '            a.href = url;',
    '            a.download = "wpd_image.png";',
    '            document.body.appendChild(a);',
    '            a.click();',
    '            a.remove();',
    '            return null;',
    '        }',
    '        return realOpen.apply(window, arguments);',
    '    };',
    '})();',
    '</script>'
].join("\n");

// ---------------------------------------------------------------- head ------
// The Google Fonts stylesheet is the only network resource the page loads, and
// nothing uses Roboto - styles.css:143 and widgets.css:84,133,188,195 all ask
// for Verdana/sans-serif. Drop it.
sub('    <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">\n', "");

// Cache directives are meaningless over file://.
html = html.replace(/ *<meta http-equiv="(Cache-Control|Pragma|Expires)"[^>]*>\n/g, "");

sub('<link rel="stylesheet" href="styles.css" type="text/css" media="screen" />', css("styles.css"));
sub('<link rel="stylesheet" href="widgets.css" type="text/css" media="screen" />', css("widgets.css"));
sub('href="favicon.ico"', 'href="data:image/x-icon;base64,' + b64("favicon.ico") + '"');

sub('<script src="wpd.min.js"></script>', shim + "\n" + js("wpd.min.js"));

// pdf.js spawns its worker from a blob: URL, which Chrome refuses on a file://
// page (null origin). pdf.js:2833 skips worker construction entirely when
// globalThis.pdfjsWorker.WorkerMessageHandler already exists, and the worker
// bundle's UMD sets window.pdfjsWorker when loaded as a page script (its
// self-start is guarded by pdf.worker.js:702). So inline it and pdf.js never
// constructs a Worker at all. PDF parsing then runs on the main thread - slower
// on huge files, but PDF import keeps working.
sub('<script src="node_modules/pdfjs-dist/build/pdf.js"></script>', js(PDF + "/pdf.min.js"));
sub(
    '    <script>\n        pdfjsLib.GlobalWorkerOptions.workerSrc = "node_modules/pdfjs-dist/build/pdf.worker.js";\n    </script>',
    js(PDF + "/pdf.worker.min.js") + "\n" + [
        '<script>',
        '    globalThis.pdfjsWorker = globalThis.pdfjsWorker || globalThis["pdfjs-dist/build/pdf.worker"];',
        '    if (!globalThis.pdfjsWorker) throw new Error("pdf.worker did not register on the main thread");',
        '    pdfjsLib.GlobalWorkerOptions.workerSrc = "inline"; // non-empty: silences the deprecation warning',
        '</script>'
    ].join("\n")
);
sub('<script src="node_modules/tarballjs/tarball.js"></script>', js("node_modules/tarballjs/tarball.js"));

// -------------------------------------------------------------- images ------
// 10 <img src> in the help/axes popups plus one CSS background on the crosshair
// button. Neither stylesheet contains a url(), so this covers every image.
const seen = new Set();
html = html.replace(/images\/([A-Za-z0-9_.-]+\.(?:png|svg))/g, (_, file) => {
    seen.add(file);
    const mime = file.endsWith(".svg") ? "image/svg+xml" : "image/png";
    return "data:" + mime + ";base64," + b64(path.join("images", file));
});

fs.writeFileSync(OUT, html);

console.log(IN + " -> " + OUT);
console.log("  inlined " + seen.size + " images: " + [...seen].sort().join(", "));
console.log("  " + (fs.statSync(OUT).size / 1048576).toFixed(2) + " MiB total");
