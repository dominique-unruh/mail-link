# mail-link bookmarklet

A bookmarklet that, from a supported webmail app, extracts the open message's
headers and builds a [mail-link](../shared/maillink.ts) pointing at the resolve
page.

Currently supported: **GMail (web)**.

## How it works

1. Detect the webmail app from the current URL (see [`src/apps.ts`](src/apps.ts)).
2. If unsupported, alert *"Unsupported email app"*.
3. Otherwise the app's extractor fetches the raw message source
   (GMail: via the same-origin "Show original" / "Download Original" endpoints).
4. Parse the headers ([`src/headers.ts`](src/headers.ts): RFC 5322 unfolding +
   RFC 2047 encoded-words).
5. Build the mail-link with the shared code and show it for copying.

## Configuration

The base URL and the name (recorded as "who has it") are **not** baked into the
source. `src/bookmarklet.ts` uses the placeholders `@@@BASE_URL@@@` and
`@@@WHOHASIT@@@`, and [`inject.mjs`](inject.mjs) substitutes them with the
configured values (safely quoted via `JSON.stringify`). The install page does
this substitution live from its two input fields.

## Build

```sh
make install       # npm install
make build         # -> dist/bookmarklet-{template,demo}.min.js and dist/test-install.html
make test          # unit tests (headers, message, inject)
make typecheck
make clean
```

(Equivalent `npm run build` / `npm test` / `npm run typecheck` scripts also
exist.) Everything — including postal-mime-free header parsing — is bundled into
a single `javascript:` URL. The build emits `dist/bookmarklet-template.min.js`
(raw minified bundle with the `@@@…@@@` placeholders intact, for injecting
configured values into) and `dist/bookmarklet-demo.min.js` (a ready-to-use
bookmarklet with the default base URL and an empty name already injected). The
build fails if the demo URL exceeds 63 KiB, because Firefox silently ignores
bookmark URLs longer than 65 536 characters.

## Install (for testing)

Open `dist/test-install.html`, set the **Base URL** and **name** fields, then drag the
**📧 Mail-Link** button onto your bookmarks toolbar (or, in Firefox, copy the URL
from the box into *Add Bookmark…*). Then open an email in a supported webmail app
and click it.
