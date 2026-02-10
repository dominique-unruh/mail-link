import {insertHtmlLike, validateNoDuplicateIds} from "./utils.ts";
import type {HTMLLike, ParsedFragment} from "./types.ts";
import {setAutoActionProvider, unsetAutoActionProvider} from "./main.ts";

interface ProviderOptions {
    /** A unique ID identifying this provider */
    readonly id: string;
    readonly title: string;
    readonly html?: HTMLLike;
    readonly insertHere?: string;
}

const group: HTMLElement = document.getElementById('how-to-open-group') ||
    (()=>{throw Error('how-to-open-group element not found')})();

export abstract class Provider {
    private readonly options: ProviderOptions;
    private _contentDiv!: HTMLDivElement;

    /** @final */
    id(): string {
        return this.options.id;
    }

    protected constructor(options: ProviderOptions) {
        this.options = options;
    }

    createContainer(): HTMLElement {
        if (this.options.insertHere) {
            const insertHere = document.getElementById(this.options.insertHere);
            if (!insertHere)
                throw Error(`Could not find tag with id ${this.options.insertHere}`);
            insertHere.innerHTML = '';
            return insertHere;
        } else {
            // Create sl-details element
            const details = document.createElement('sl-details');
            details.setAttribute('summary', this.options.title);
            details.setAttribute('id', "provider-section-"+this.options.id);
            // Append details to group
            group.appendChild(details);
            return details;
        }
    }

    /** @final */
    async addToDocument(): Promise<void> {
        // Create content div
        const contentDiv = document.createElement('div');
        insertHtmlLike(contentDiv, this.options.html);

        const container = this.createContainer();

        // Validate before adding to document
        if (validateNoDuplicateIds(contentDiv)) {
            // Append content to details
            container.appendChild(contentDiv);
            // Call abstract init method with the content div
            this._contentDiv = contentDiv;
            await this.init();
        } else {
            const error = document.createElement("strong")
            error.className = 'error';
            error.textContent = "Internal error. See Javascript console."
            container.appendChild(error);
        }
    }

    /** @final */
    protected contentDiv(): HTMLDivElement {
        return this._contentDiv;
    }

    /** Call this to make the current provider register as doing the auto-action */
    protected takeAutoAction(): void {
        setAutoActionProvider(this);
    }

    /** Call this to make the current provider unregister from being responsible for the auto-action */
    protected releaseAutoAction(): void {
        unsetAutoActionProvider(this);
    }

    /** This is called to inform the provider that it isn't auto-action provider anymore */
    lostAutoAction(): void {}

    /** This is called to inform the provider that it isn't auto-action provider anymore */
    gotAutoAction(): void {}

    /** Perform the auto-action */
    doAutoAction(): void | Promise<void> {
        console.error("doAutoAction called by provider that doesn't support automatic actions")
    }

    /** Called after registering the provider. Can initialize the content more or do whatever. */
    protected abstract init(): void | Promise<void>;
    abstract dataChanged(parsed: ParsedFragment | null): void | Promise<void>;
    /** User readable description of the automatic action that will be performed by this provider.
     * Must provide suitable text if the current provider has registered as automatic action provider.
     **/
    automaticActionText(): HTMLLike {
        console.error("automaticActionText called by provider that doesn't support automatic actions")
        return "[Internal error (see the console)]"
    }
}