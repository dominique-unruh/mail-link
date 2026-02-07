import {validateNoDuplicateIds} from "./utils.ts";
import type {ParsedFragment} from "./main.ts";

export abstract class Provider {
    protected readonly title: string;
    protected readonly html: string | HTMLElement | DocumentFragment;
    protected readonly id: string;
    private _contentDiv!: HTMLDivElement;

    constructor(title: string, html: string | HTMLElement | DocumentFragment) {
        this.title = title;
        this.html = html;
        this.id = this.generateId(title);
    }

    private generateId(title: string): string {
        // Convert title to a valid ID: lowercase, replace spaces/special chars with hyphens
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    }

    /** @final */
    async addToDocument(): Promise<void> {
        const group = document.getElementById('how-to-open-group');
        if (!group) {
            console.error('how-to-open-group element not found');
            return;
        }

        // Create sl-details element
        const details = document.createElement('sl-details');
        details.setAttribute('summary', this.title);

        // Create content div
        const contentDiv = document.createElement('div');
        if (typeof this.html === 'string') {
            contentDiv.innerHTML = this.html;
        } else {
            contentDiv.appendChild(this.html);
        }

        // Append details to group
        group.appendChild(details);

        // Validate before adding to document
        if (validateNoDuplicateIds(contentDiv)) {
            // Append content to details
            details.appendChild(contentDiv);
            // Call abstract init method with the content div
            this._contentDiv = contentDiv;
            await this.init();
        } else {
            const error = document.createElement("strong")
            error.className = 'error';
            error.textContent = "Internal error. See Javascript console."
            details.appendChild(error);
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