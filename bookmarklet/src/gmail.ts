// GMail (web) support.
//
// listMessages(): one entry per currently-open message in the conversation, read
//   from the DOM; label = sender + date (best-effort scrape). Gmail lazy-renders
//   collapsed messages (no id/body in the DOM), so only open ones can be listed.
// extract(id): fetch the raw source of that message, all same-origin using the
//   existing session:
//   1. ?ui=2&ik=<ik>&view=om&permmsgid=msg-f:<decimal(id)> returns the HTML
//      "Original Message" page, whose "Download Original" link points at the raw
//      RFC 822 source. (Gmail's CSP blocks DOMParser, so we regex out the href.)

import type {EmailApp, MessageChoice} from './apps.ts';
import {log} from './log.ts';

function matches(location: Location): boolean {
    return location.hostname === 'mail.google.com';
}

/** Best-effort "sender — date" label for a message element. */
function labelFor(el: HTMLElement, index: number): string {
    const sender = el.querySelector('[email]');
    const name = sender?.getAttribute('name') || sender?.getAttribute('email') || '';
    const dateEl = el.querySelector('[data-tooltip], .g3');
    const date = dateEl?.getAttribute('data-tooltip')
        || dateEl?.getAttribute('title')
        || dateEl?.textContent?.trim()
        || '';
    const parts = [name, date].filter(s => s !== '');
    return parts.length > 0 ? parts.join(' — ') : `Message ${index + 1}`;
}

/** The message's permmsgid ("msg-f:<decimal>"), from either the data-message-id
 * attribute (#msg-f:...) or the legacy hex id. Null if this isn't a message. */
function permId(el: HTMLElement): string | null {
    const m = el.getAttribute('data-message-id')?.match(/(msg-[af]:\d+)/);
    if (m)
        return m[1];
    const legacy = el.getAttribute('data-legacy-message-id');
    return legacy ? 'msg-f:' + BigInt('0x' + legacy).toString() : null;
}

function listMessages(_location: Location): MessageChoice[] {
    const seen = new Set<string>();
    const choices: MessageChoice[] = [];
    // Collapsed messages may lack data-legacy-message-id, so also match
    // data-message-id (the #msg-f:... perm-id).
    for (const el of document.querySelectorAll<HTMLElement>('[data-message-id],[data-legacy-message-id]')) {
        const id = permId(el);
        if (!id || seen.has(id))
            continue;
        // List only currently-open messages. A message's body (.a3s) stays in the
        // DOM once opened, but has no layout boxes while collapsed; skip those, so
        // the list matches exactly what the user currently sees expanded.
        const body = el.querySelector('.a3s');
        if (body == null || body.getClientRects().length === 0)
            continue;
        seen.add(id);
        const choice: MessageChoice = {label: labelFor(el, choices.length), id, emphasize: false};
        choices.push(choice);
        log('gmail: open message', id, JSON.stringify(choice.label));
    }
    return choices;
}

function accountAndIk(location: Location): {account: string; ik: string} {
    const account = (location.pathname.match(/\/mail\/u\/(\d+)/) || [, '0'])[1];
    let ik = ((window as unknown as {GLOBALS?: unknown[]}).GLOBALS?.[9] as string) || '';
    if (!ik) {
        const m = document.documentElement.innerHTML.match(/[?&;]ik=([A-Za-z0-9_-]+)/);
        if (m) ik = m[1];
    }
    return {account, ik};
}

async function fetchText(url: string): Promise<string> {
    const res = await fetch(url, {credentials: 'include'});
    if (!res.ok)
        throw new Error(`GMail request failed (HTTP ${res.status}).`);
    return res.text();
}

async function extract(location: Location, id: string): Promise<string> {
    const {account, ik} = accountAndIk(location);
    log('gmail: account', account, 'ik', ik || '(none)', 'message', id);

    const base = `https://mail.google.com/mail/u/${account}/`;
    const originalUrl = `${base}?ui=2&ik=${ik}&view=om&permmsgid=${id}`;
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

export const gmailApp: EmailApp = {name: 'GMail', matches, listMessages, extract};
