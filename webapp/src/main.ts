import './style.css';
import {escapeHtml} from './utils.ts';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/copy-button/copy-button.js';
import '@shoelace-style/shoelace/dist/components/details/details.js';
import {providers} from "./providers/providers.ts";


export interface ParsedFragment {
    mid: string;
    params: Record<string, string>;
}

const linkInputField = document.getElementById("link") as HTMLInputElement;
const howToOpenGroup = document.getElementById("how-to-open-group") as HTMLDivElement;
const messageIDSpan = document.getElementById("message-id-span") as HTMLSpanElement;
const tableContainer = document.getElementById('fragment-table') as HTMLDivElement;

function parseFragment(url: string): ParsedFragment | null {
    const hash = new URL(url).hash;
    if (!hash || hash.length <= 1)
        return null;

    // Remove the leading '#'
    const fragment = hash.substring(1);

    // Split by '&'
    const parts = fragment.split('&');

    if (parts.length === 0) {
        return null;
    }

    // First part is the mid
    const mid = decodeURIComponent(parts[0]);

    // Rest are key=value pairs
    const params: Record<string, string> = {};

    for (let i = 1; i < parts.length; i++) {
        const pair = parts[i].split('=');
        if (pair.length === 2) {
            const key = decodeURIComponent(pair[0].replace(/\+/g, ' '));
            // noinspection UnnecessaryLocalVariableJS
            const value = decodeURIComponent(pair[1].replace(/\+/g, ' '));
            params[key] = value;
        }
    }

    return { mid, params };
}

function displayTable(parsed: ParsedFragment) {
    const paramCount = Object.keys(parsed.params).length;

    if (paramCount === 0) {
        tableContainer.innerHTML = `<p style="color: #999;">No additional parameters</p>`;
    } else {
        let tableHtml = `
          <table style="margin-top: 1rem; border-collapse: collapse; width: 100%;">
            <thead>
              <tr style="background: #f0f0f0;">
                <th style="padding: 0.5rem; text-align: left; border: 1px solid #ddd;">Key</th>
                <th style="padding: 0.5rem; text-align: left; border: 1px solid #ddd;">Value</th>
              </tr>
            </thead>
            <tbody>
        `;

        for (const [key, value] of Object.entries(parsed.params)) {
            tableHtml += `
            <tr>
              <td style="padding: 0.5rem; border: 1px solid #ddd;">${escapeHtml(key)}</td>
              <td style="padding: 0.5rem; border: 1px solid #ddd;">${escapeHtml(value)}</td>
            </tr>
          `;
        }

        tableHtml += `
            </tbody>
          </table>
        `;

        tableContainer.innerHTML = tableHtml;
    }
}

async function displayFragmentData(): Promise<void> {
    const parsed = parseFragment(linkInputField.value);

    if (!parsed) {
        tableContainer.innerHTML = '<p style="color: #999;">No fragment data in URL</p>';
        messageIDSpan.textContent = "[No message ID]";
        return;
    }

    messageIDSpan.textContent = parsed.mid;
    displayTable(parsed);

    for (const provider of providers)
        await provider.dataChanged(parsed);
}


/** Updates `linkInputField` from the location bar */
async function updatelinkInputFieldFromLocation() {
    linkInputField.value = window.location.href;
    await displayFragmentData();
}

async function initApp(): Promise<void> {
    for (const provider of providers)
        await provider.addToDocument();

    linkInputField.addEventListener("sl-change", displayFragmentData);
    // Makes sure only one provider visible at once
    howToOpenGroup.addEventListener('sl-show', event => {
        const target = event.target as HTMLElement;
        if (target.localName === 'sl-details') {
            [...howToOpenGroup.querySelectorAll('sl-details')].map(details => (details.open = event.target === details));
        }
    });

    // TODO: Make it configurable what happens automatically
    // Auto-open mid-link on first load
    const parsed = parseFragment(window.location.href);
    if (parsed)
        window.location.href = `mid:${parsed.mid}`;

    // Update link if location changes
    window.addEventListener('hashchange', updatelinkInputFieldFromLocation);

    await updatelinkInputFieldFromLocation();
}


// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    await initApp();
}