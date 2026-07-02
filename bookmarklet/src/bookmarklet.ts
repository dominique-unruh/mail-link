// Bookmarklet entry point.
//
// Flow:
//   1. Detect which supported webmail app the current page belongs to.
//   2. If none, alert "Unsupported email app".
//   3. Otherwise call that app's extractor to get the raw message source.
//   4. Parse the headers into mail-link fields.
//   5. Build a mail-link with the shared code and show it in a popup.
//
// BASE_URL and WHOHASIT are placeholders; install.html substitutes them with the
// configured values (see inject.mjs) when the bookmarklet is installed.

import {findApp} from './apps.ts';
import {messageToFields} from './message.ts';
import {showLink} from './popup.ts';
import {log} from './log.ts';
import {buildMailLink} from '../../shared/maillink.ts';

const BASE_URL = '@@@BASE_URL@@@';
const WHOHASIT = '@@@WHOHASIT@@@';

async function run(): Promise<void> {
    log('starting');

    const app = findApp(window.location);
    if (!app) {
        log('unsupported app:', window.location.hostname);
        alert('Unsupported email app');
        return;
    }
    log('detected app:', app.name);

    const raw = await app.extract(window.location);
    log('fetched source:', raw.length, 'bytes');
    log('source (whole):\n' + raw);

    const fields = messageToFields(raw);
    if (!fields) {
        log('no Message-ID found');
        alert('The message has no Message-ID, so no mail-link can be generated.');
        return;
    }

    // Empty WHOHASIT (name left blank at install time) is ignored by buildMailLink.
    if (WHOHASIT)
        fields.whohasit = WHOHASIT;
    log('extracted fields:', fields);

    const link = buildMailLink(BASE_URL, fields);
    log('mail-link:', link);
    showLink(link);
}

run().catch(e => {
    log('error:', e);
    alert('mail-link: ' + (e instanceof Error ? e.message : String(e)));
});
