// In-page popups used by the bookmarklet:
//   - chooseMessage(): pick one message from a conversation
//   - showLink():      show the generated mail-link with a copy button
//
// Trusted-Types-safe: built with createElement / textContent / style.cssText
// only (Gmail's CSP blocks innerHTML).

import type {MessageChoice} from './apps.ts';

const OVERLAY_CSS =
    'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.4);' +
    'display:flex;align-items:center;justify-content:center;';
const BOX_CSS =
    'background:#fff;color:#000;font:14px sans-serif;padding:20px 22px;border-radius:10px;' +
    'box-shadow:0 8px 30px rgba(0,0,0,.3);width:440px;max-width:90vw;';
const TITLE_CSS = 'font-weight:600;font-size:16px;margin-bottom:12px;';

/** Open a modal overlay with a title. `onClose` runs when it is dismissed
 * (backdrop click or Esc). Returns the content box and a close() function. */
function openModal(titleText: string, onClose: () => void): {box: HTMLElement; close: () => void} {
    const overlay = document.createElement('div');
    overlay.style.cssText = OVERLAY_CSS;

    const box = document.createElement('div');
    box.style.cssText = BOX_CSS;

    const title = document.createElement('div');
    title.textContent = titleText;
    title.style.cssText = TITLE_CSS;

    let closed = false;
    function close(): void {
        if (closed) return;
        closed = true;
        overlay.remove();
        document.removeEventListener('keydown', onKey);
        onClose();
    }
    function onKey(e: KeyboardEvent): void {
        if (e.key === 'Escape') close();
    }
    overlay.addEventListener('click', e => {
        if (e.target === overlay) close();
    });
    document.addEventListener('keydown', onKey);

    box.append(title);
    overlay.append(box);
    document.body.append(overlay);
    return {box, close};
}

function button(background: string, color: string, label: string): HTMLButtonElement {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText =
        `background:${background};color:${color};border:none;border-radius:6px;` +
        'padding:8px 16px;font:14px sans-serif;cursor:pointer;';
    return b;
}

/** Ask the user to pick one of `choices`; resolves with the chosen id, or null if
 * dismissed. Emphasised choices (e.g. currently-open messages) are shown bold. */
export function chooseMessage(choices: MessageChoice[]): Promise<string | null> {
    return new Promise(resolve => {
        const {box, close} = openModal('Which message?', () => resolve(null));

        const list = document.createElement('div');
        list.style.cssText = 'display:flex;flex-direction:column;margin-top:4px;';

        for (const choice of choices) {
            const row = document.createElement('button');
            row.textContent = choice.label;
            row.style.cssText =
                'display:block;width:100%;text-align:left;background:transparent;border:none;' +
                'border-top:1px solid #eee;padding:9px 6px;font:14px sans-serif;cursor:pointer;' +
                'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' +
                (choice.emphasize ? 'font-weight:700;' : '');
            row.addEventListener('mouseenter', () => { row.style.background = '#eef3ff'; });
            row.addEventListener('mouseleave', () => { row.style.background = 'transparent'; });
            row.addEventListener('click', () => {
                resolve(choice.id);
                close();
            });
            list.append(row);
        }

        box.append(list);
    });
}

/** Show `link` in a modal popup with a truncated view and a copy button. */
export function showLink(link: string): void {
    const {box, close} = openModal('Mail-link', () => {});

    const view = document.createElement('a');
    view.href = link;
    view.textContent = link;
    view.title = link; // full link on hover
    view.target = '_blank';
    view.rel = 'noopener';
    // Truncate to a single line with a trailing ellipsis via CSS.
    view.style.cssText =
        'display:block;font-family:monospace;background:#f2f2f2;border:1px solid #ddd;' +
        'border-radius:6px;padding:8px 10px;margin-bottom:14px;' +
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';

    const buttons = document.createElement('div');
    buttons.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';
    const copyBtn = button('#1a73e8', '#fff', 'Copy');
    const closeBtn = button('#e0e0e0', '#000', 'Close');

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(link).then(
            () => {
                copyBtn.textContent = 'Copied!';
                setTimeout(close, 700);
            },
            () => {
                copyBtn.textContent = 'Copy failed';
            },
        );
    });
    closeBtn.addEventListener('click', close);

    buttons.append(copyBtn, closeBtn);
    box.append(view, buttons);
}
