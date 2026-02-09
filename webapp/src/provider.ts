import {validateNoDuplicateIds} from "./utils.ts";
import type {ParsedFragment} from "./main.ts";

interface ProviderOptions {
    readonly title: string;
    readonly html?: string | HTMLElement | DocumentFragment;
    readonly insertHere?: string;
}

const group: HTMLElement = document.getElementById('how-to-open-group') ||
    (()=>{throw Error('how-to-open-group element not found')})();

export abstract class Provider {
    private readonly options: ProviderOptions;
    protected readonly id: string;
    private _contentDiv!: HTMLDivElement;

    protected constructor(options: ProviderOptions) {
        this.options = options;
        this.id = this.generateId(options.title);
    }

    private generateId(title: string): string {
        // Convert title to a valid ID: lowercase, replace spaces/special chars with hyphens
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
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
            // Append details to group
            group.appendChild(details);
            return details;
        }
    }

    /** @final */
    async addToDocument(): Promise<void> {
        // Create content div
        const contentDiv = document.createElement('div');
        const html = this.options.html;
        if (html == undefined)
            contentDiv.innerHTML = '';
        else if (typeof html === 'string') {
            contentDiv.innerHTML = html;
        } else {
            contentDiv.appendChild(html);
        }

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

    /** Called after registering the provider. Can initialize the content more or do whatever. */
    protected abstract init(): void | Promise<void>;

    abstract dataChanged(parsed: ParsedFragment | null): void | Promise<void>;
}