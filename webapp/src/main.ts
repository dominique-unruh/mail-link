import './style.css';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/copy-button/copy-button.js';
import '@shoelace-style/shoelace/dist/components/details/details.js';
import {providers} from "./providers/providers.ts";
import type {ParsedFragment} from "./types.ts";
import {options, saveOptions} from "./options.ts";

const linkInputField = document.getElementById("link") as HTMLInputElement;
const howToOpenGroup = document.getElementById("how-to-open-group") as HTMLDivElement;
const messageIDSpan = document.getElementById("message-id-span") as HTMLSpanElement;

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

async function displayFragmentData(): Promise<void> {
    const parsed = parseFragment(linkInputField.value);

    if (!parsed) {
        messageIDSpan.textContent = "[No message ID]";
        return;
    }

    messageIDSpan.textContent = parsed.mid;

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

    initProviderSections();

    // Update link if location changes
    window.addEventListener('hashchange', updatelinkInputFieldFromLocation);

    await updatelinkInputFieldFromLocation();

    initialAction();
}

function initProviderSections() {
    linkInputField.addEventListener("sl-change", displayFragmentData);
    // Makes sure only one provider visible at once
    howToOpenGroup.addEventListener('sl-show', event => {
        const target = event.target as HTMLElement;
        options.openedProvider = target.id.substring("provider-section-".length);
        if (target.localName === 'sl-details') {
            [...howToOpenGroup.querySelectorAll('sl-details')].map(details => (details.open = target === details));
        }
        saveOptions();
    });

    if (options.openedProvider)
        document.getElementById("provider-section-"+options.openedProvider)?.setAttribute("open", "true");
}

function initialAction(): void {
    // TODO: Make it configurable what happens automatically
    // Auto-open mid-link on first load
    const parsed = parseFragment(window.location.href);
    if (parsed)
        window.location.href = `mid:${parsed.mid}`;
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    await initApp();
}