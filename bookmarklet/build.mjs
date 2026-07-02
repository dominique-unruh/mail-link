// Bundles src/bookmarklet.ts into a single self-contained IIFE (keeping the
// @@@BASE_URL@@@ / @@@WHOHASIT@@@ placeholders) and emits:
//   dist/bookmarklet.min.js  - default-configured bookmarklet (default base URL,
//                              no name), directly usable
//   dist/test-install.html   - a page with Base URL / Name fields that build a
//                              configured bookmarklet live (for install & testing)
//
// Firefox silently ignores bookmark URLs longer than 65536 chars, so we fail the
// build if the (default-configured) bookmarklet exceeds 63 KiB (that limit minus
// ~1 KiB of safety).
import {build} from 'esbuild';
import {writeFileSync, mkdirSync, readFileSync} from 'node:fs';
import {inject} from './inject.mjs';

const MAX_URL_LENGTH = 63 * 1024; // 64512: Firefox's 65536 limit minus 1 KiB safety.
const DEFAULT_BASE_URL = 'https://qis.rwth-aachen.de/people/unruh/tools/mail-link/';

const result = await build({
    entryPoints: ['src/bookmarklet.ts'],
    bundle: true,
    minify: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    write: false,
});

const template = result.outputFiles[0].text.trim();

// Guard against the minifier constant-folding a placeholder away.
for (const placeholder of ['@@@BASE_URL@@@', '@@@WHOHASIT@@@']) {
    if (!template.includes(placeholder)) {
        console.error(`ERROR: placeholder ${placeholder} is missing from the bundle.`);
        process.exit(1);
    }
}

// Default-configured bookmarklet (base URL default, no name).
const configured = 'javascript:' + encodeURIComponent(inject(template, DEFAULT_BASE_URL, ''));
const size = configured.length;

console.log(`Bookmarklet size (default config): ${size} chars (limit ${MAX_URL_LENGTH}).`);
if (size > MAX_URL_LENGTH) {
    console.error(
        `ERROR: bookmarklet is ${size} chars, exceeding the ${MAX_URL_LENGTH}-char limit.`);
    process.exit(1);
}

mkdirSync('dist', {recursive: true});
writeFileSync('dist/bookmarklet.min.js', configured + '\n');

// For the installer page, inline the inject() source (minus its `export`) and the
// raw template, then wire the two input fields to rebuild the URL live.
const injectSrc = readFileSync('inject.mjs', 'utf8').replace(/^export\s+/m, '');
// Embed the template as a JS string; escape "<" so it can't break out of <script>.
const templateLiteral = JSON.stringify(template).replace(/</g, '\\u003C');

const html = `<!doctype html>
<meta charset="utf-8">
<title>Install the mail-link bookmarklet</title>
<style>
  body { font-family: sans-serif; max-width: 44em; margin: 2em auto; padding: 0 1em; line-height: 1.5; }
  a.bm { display: inline-block; font-size: 1.3em; padding: .4em .8em; border: 1px solid #888;
         border-radius: .4em; text-decoration: none; }
  input, textarea { font: inherit; }
  label { display: block; margin: .8em 0; }
  code { background: #f0f0f0; padding: 0 .2em; }
</style>
<h1>mail-link bookmarklet</h1>
<p>Set the values below, then drag the button onto your bookmarks toolbar.</p>

<label>Base URL<br>
  <input id="base" size="64" value="${DEFAULT_BASE_URL}"></label>
<label>Your name (recorded as &ldquo;who has it&rdquo;)<br>
  <input id="name" size="40" placeholder="(optional)"></label>

<p><a class="bm" id="bm" href="#">📧 Mail-Link</a></p>
<p id="size" style="color:#888"></p>
<p>(Clicking it here does nothing — it only works inside a supported webmail app.)</p>

<h2>Can&rsquo;t drag it? (e.g. Firefox)</h2>
<p>Right-click the toolbar &rarr; <em>Add Bookmark&hellip;</em> and paste this into the URL field:</p>
<textarea id="out" rows="4" cols="64" readonly></textarea>

<h2>How to use</h2>
<ol>
  <li>Open an email in a supported webmail app (currently: GMail web).</li>
  <li>Click the <em>Mail-Link</em> bookmark.</li>
  <li>Copy the mail-link from the dialog that appears.</li>
</ol>

<script>
${injectSrc}
const TEMPLATE = ${templateLiteral};
const FIREFOX_LIMIT = 65536;
const baseEl = document.getElementById('base');
const nameEl = document.getElementById('name');
const bmEl = document.getElementById('bm');
const outEl = document.getElementById('out');
const sizeEl = document.getElementById('size');
function update() {
  const code = inject(TEMPLATE, baseEl.value.trim(), nameEl.value.trim());
  const url = 'javascript:' + encodeURIComponent(code);
  bmEl.href = url;
  outEl.value = url;
  const over = url.length > FIREFOX_LIMIT;
  sizeEl.textContent = 'Bookmarklet length: ' + url.length + ' characters'
    + (over ? ' — over the Firefox ' + FIREFOX_LIMIT + ' limit!' : ' (Firefox limit ' + FIREFOX_LIMIT + ').');
  sizeEl.style.color = over ? '#c00' : '#888';
}
baseEl.addEventListener('input', update);
nameEl.addEventListener('input', update);
update();
</script>
`;
writeFileSync('dist/test-install.html', html);

console.log('Wrote dist/bookmarklet.min.js and dist/test-install.html');
