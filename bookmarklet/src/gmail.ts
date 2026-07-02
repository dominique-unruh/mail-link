// GMail (web) support: fetch the raw source of the currently open message.
//
// Approach (all same-origin, using the existing session):
//   1. The open conversation's DOM exposes the message's hex id in
//      `data-legacy-message-id`; the per-session inbox key is `window.GLOBALS[9]`.
//   2. `?ui=2&ik=<ik>&view=om&permmsgid=msg-f:<decimal>` returns the HTML
//      "Original Message" page, whose "Download Original" link points at the raw
//      RFC 822 source. (Gmail's CSP blocks DOMParser, so we regex out the href.)

import type {EmailApp} from './apps.ts';
import {log} from './log.ts';

async function fetchText(url: string): Promise<string> {
    const res = await fetch(url, {credentials: 'include'});
    if (!res.ok)
        throw new Error(`GMail request failed (HTTP ${res.status}).`);
    return res.text();
}

function matches(location: Location): boolean {
    return location.hostname === 'mail.google.com';
}

async function extract(location: Location): Promise<string> {
    const account = (location.pathname.match(/\/mail\/u\/(\d+)/) || [, '0'])[1];
    log('gmail: account', account);

    let ik = ((window as unknown as {GLOBALS?: unknown[]}).GLOBALS?.[9] as string) || '';
    if (!ik) {
        const m = document.documentElement.innerHTML.match(/[?&;]ik=([A-Za-z0-9_-]+)/);
        if (m) ik = m[1];
    }
    log('gmail: ik', ik || '(none)');

    const messageEl = [...document.querySelectorAll('[data-legacy-message-id]')].pop();
    const messageHex = messageEl?.getAttribute('data-legacy-message-id');
    if (!messageHex)
        throw new Error('No open message found. Open a conversation first, then click the bookmarklet.');
    const messageDecimal = BigInt('0x' + messageHex).toString();
    log('gmail: message id hex', messageHex, 'dec', messageDecimal);

    const base = `https://mail.google.com/mail/u/${account}/`;
    const originalUrl = `${base}?ui=2&ik=${ik}&view=om&permmsgid=msg-f:${messageDecimal}`;
    log('gmail: original-message URL', originalUrl);
    const originalPage = await fetchText(originalUrl);

    const hrefs = [...originalPage.matchAll(/href=["']([^"']+)["']/g)]
        .map(m => m[1].replace(/&amp;/g, '&'));
    const downloadHref = hrefs.find(h => /disp=|filename=|download/i.test(h));
    if (!downloadHref)
        throw new Error('Could not find the "Download Original" link on the source page.');

    const downloadUrl = new URL(downloadHref, base).href;
    log('gmail: download URL', downloadUrl);
    return fetchText(downloadUrl);
}

export const gmailApp: EmailApp = {name: 'GMail', matches, extract};
