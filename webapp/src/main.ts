import './style.css';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/copy-button/copy-button.js';
import '@shoelace-style/shoelace/dist/components/details/details.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import {getProvider, providers} from "./providers/providers.ts";
import type {ParsedFragment} from "./types.ts";
import {options, saveOptions} from "./options.ts";
import {insertHtmlLike} from "./utils.ts";
import type {Provider} from "./provider.ts";

const linkInputField = document.getElementById("link") as HTMLInputElement;
const providerGroup = document.getElementById("how-to-open-group") as HTMLDivElement;
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

    initAutoAction();

    await doAutoAction();
}

function initProviderSections() {
    linkInputField.addEventListener("sl-change", displayFragmentData);
    // Makes sure only one provider visible at once
    providerGroup.addEventListener('sl-show', event => {
        const target = event.target as HTMLElement;
        if (target.localName === 'sl-details') {
            [...providerGroup.querySelectorAll('sl-details')].map(details => (details.open = target === details));
            options.openedProvider = target.id.substring("provider-section-".length);
            saveOptions();
        }
    });
    providerGroup.addEventListener('sl-hide', event => {
        const target = event.target as HTMLElement;
        if (target.localName === 'sl-details') {
            const provider = target.id.substring("provider-section-".length);
            if (options.openedProvider === provider) {
                options.openedProvider = undefined;
                saveOptions();
            }
        }
    });


    if (options.openedProvider)
        document.getElementById("provider-section-"+options.openedProvider)?.setAttribute("open", "true");
}

/** Sets the provider to be the responsible for the current auto action.
 * Also calls `.lostAutoAction()` on the previous auto action provider (unless the provider did not change). */
export function setAutoActionProvider(provider: Provider): void {
    // console.log("setAutoActionProvider", provider.id(), options)
    const section = document.getElementById("automatic-action-section")!;
    const span = document.getElementById("autoaction-span")!;
    const checkbox = document.getElementById("autoaction-checkbox") as HTMLInputElement;
    const previous = options.automaticProvider;
    insertHtmlLike(span, provider.automaticActionText());
    // checkbox.style.display = 'inline';
    checkbox.disabled = false;
    checkbox.title = "Click to disable automatic action."
    section.style.display = 'block';
    checkbox.checked = true;
    if (previous !== provider?.id()) {
        options.automaticProvider = provider?.id();
        saveOptions();
    }
    if (previous != null && previous != provider.id()) {
        provider.lostAutoAction();
    }
    provider.gotAutoAction();
}

/** Removes auto action provider. Also calls `.lostAutoAction()` on the current auto action provider.
 * If `unsetThisProvider` is given, then only unsets it, if `unsetThisProvider` is currently the auto action provider.
 * */
export function unsetAutoActionProvider(unsetThisProvider?: Provider): void {
    // console.log("unsetAutoActionProvider", unsetThisProvider, options)
    const previous = options.automaticProvider;
    if (unsetThisProvider != null && previous != unsetThisProvider.id())
        return;
    const span = document.getElementById("autoaction-span")!;
    const checkbox = document.getElementById("autoaction-checkbox") as HTMLInputElement;
    span.innerHTML = 'None (you can select something to happen automatically in the "How to find the email" section below).';
    // checkbox.style.display = 'none';
    checkbox.checked = false;
    checkbox.disabled = true;
    checkbox.title = "To activate automatic action, choose one in the \"How to find the email\" section below."
    if (options.automaticProvider != null) {
        options.automaticProvider = undefined;
        saveOptions();
    }
    if (previous != null)
        getProvider(previous)?.lostAutoAction();
}

function initAutoAction(): void {
    const checkbox = document.getElementById("autoaction-checkbox") as HTMLInputElement;
    const providerId = options.automaticProvider
    const provider= providerId != null ? getProvider(providerId) : null;
    if (provider == null && providerId != null)
        console.error(`Provider ${providerId} not found`);
    if (provider == null)
        unsetAutoActionProvider();
    else
        setAutoActionProvider(provider);
    checkbox.addEventListener("change", () => {
        if (!checkbox.checked)
            unsetAutoActionProvider();
    });
}

async function doAutoAction(): Promise<void> {
    if (options.automaticProvider != null) {
        getProvider(options.automaticProvider)?.doAutoAction();
    }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    await initApp();
}
