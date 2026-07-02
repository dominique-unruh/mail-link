// A small in-page popup showing the generated mail-link with a copy button.
//
// Built entirely with createElement / textContent / style.cssText: Gmail's CSP
// (Trusted Types) blocks innerHTML, so we never assign HTML strings.

function button(background: string, color: string, label: string): HTMLButtonElement {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText =
        `background:${background};color:${color};border:none;border-radius:6px;` +
        'padding:8px 16px;font:14px sans-serif;cursor:pointer;';
    return b;
}

/** Show `link` in a modal popup with a truncated view and a copy button. */
export function showLink(link: string): void {
    const overlay = document.createElement('div');
    overlay.style.cssText =
        'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.4);' +
        'display:flex;align-items:center;justify-content:center;';

    const box = document.createElement('div');
    box.style.cssText =
        'background:#fff;color:#000;font:14px sans-serif;padding:20px 22px;' +
        'border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.3);width:420px;max-width:90vw;';

    const title = document.createElement('div');
    title.textContent = 'Mail-link';
    title.style.cssText = 'font-weight:600;font-size:16px;margin-bottom:12px;';

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

    function close(): void {
        overlay.remove();
        document.removeEventListener('keydown', onKey);
    }
    function onKey(e: KeyboardEvent): void {
        if (e.key === 'Escape') close();
    }

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
    overlay.addEventListener('click', e => {
        if (e.target === overlay) close();
    });
    document.addEventListener('keydown', onKey);

    buttons.append(copyBtn, closeBtn);
    box.append(title, view, buttons);
    overlay.append(box);
    document.body.append(overlay);
}
