#!/usr/bin/env node
/*
    check_single_file.js - assert the standalone build really is standalone.

    Fails if the page would load anything off disk or off the network at
    runtime. Plain <a href="https://..."> links in the help popups are fine -
    those are hyperlinks the user clicks, not resources the page fetches.

    Usage:  node check_single_file.js [file.html]
*/

const fs = require("fs");

const FILE = process.argv[2] || "WebPlotDigitizer-4.7-standalone.html";
const html = fs.readFileSync(FILE, "utf8");
const fail = [];

// Resource-loading tags: these are fetched whether or not the user acts.
const LOADERS = /<(?:script|img|link|iframe|source|embed|video|audio)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']*)["']/gi;
for (const m of html.matchAll(LOADERS)) {
    const url = m[1];
    if (/^(data:|#|$)/.test(url)) continue;
    fail.push("external resource: " + url + "  in  " + m[0].slice(0, 60) + "...");
}

// CSS url() and @import. Scanned only inside real CSS: a bare /url\(/i search
// also hits the tail of createObjectURL( in the inlined bundles.
const cssBlocks = [
    ...[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]),
    ...[...html.matchAll(/\bstyle\s*=\s*"([^"]*)"/gi)].map(m => m[1]),
];
for (const block of cssBlocks) {
    for (const m of block.matchAll(/\burl\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) {
        if (/^data:/.test(m[1])) continue;
        fail.push("external css url(): " + m[1]);
    }
    for (const m of block.matchAll(/@import\s+['"]([^'"]+)['"]/gi)) {
        fail.push("@import: " + m[1]);
    }
}

// The 85 i18n <div>s are hidden by exactly one rule (styles.css:284-286). Lose
// it and the raw UI strings render at the bottom of the page.
if (!/\.i18n-string\s*\{[^}]*display:\s*none/.test(html)) {
    fail.push("missing rule: .i18n-string { display: none }");
}

// The shim is what makes the default image load - and therefore what gets the
// drop/paste handlers bound - and what keeps the build from phoning home.
const MARKERS = [
    "WebPlotDigitizer standalone shim",
    'if (url === "start.png")',
    'if (url === "log")',
    "globalThis.pdfjsWorker",
];
for (const marker of MARKERS) {
    if (!html.includes(marker)) fail.push("missing shim piece: " + marker);
}

// Every <script> must carry its code inline.
const empty = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>\s*<\/script>/gi)];
if (empty.length) fail.push(empty.length + " empty inline <script> block(s)");

if (fail.length) {
    console.error("FAIL  " + FILE);
    for (const f of fail) console.error("  - " + f);
    process.exit(1);
}
console.log("PASS  " + FILE + " is self-contained (" +
            (fs.statSync(FILE).size / 1048576).toFixed(2) + " MiB)");
