import {insertHtmlLike, text, validateNoDuplicateIds} from "./utils.ts";
import type {HTMLLike, ParsedFragment, ProviderOptions} from "./types.ts";
import {setAutoActionProvider, unsetAutoActionProvider} from "./main.ts";
import {options} from "./options.ts";

interface ProviderArguments {
    /** A unique ID identifying this provider */
    readonly id: string;
    readonly title: string;
    readonly html?: HTMLLike;
    readonly insertHere?: string;
}

const group: HTMLElement = document.getElementById('how-to-open-group') ||
    (()=>{throw Error('how-to-open-group element not found')})();

export abstract class Provider {
    private readonly arguments: ProviderArguments;
    private _contentDiv!: HTMLDivElement;
    private _options?: ProviderOptions;

    /** @final */
    id(): string {
        return this.arguments.id;
    }

    protected constructor(args: ProviderArguments) {
        this.arguments = args;
    }

    createContainer(): HTMLElement {
        if (this.arguments.insertHere) {
            const insertHere = document.getElementById(this.arguments.insertHere);
            if (!insertHere)
                throw Error(`Could not find tag with id ${this.arguments.insertHere}`);
            insertHere.innerHTML = '';
            return insertHere;
        } else {
            // Create sl-details element
            const details = document.createElement('sl-details');
            details.setAttribute('summary', this.arguments.title);
            details.setAttribute('id', "provider-section-"+this.arguments.id);
            // Append details to group
            group.appendChild(details);
            return details;
        }
    }

    /** @final */
    async addToDocument(): Promise<void> {
        // Create content div
        const contentDiv = document.createElement('div');
        insertHtmlLike(contentDiv, this.arguments.html);

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
    /** Called whenever the data in the URL changes (also after initial loading).
     * If `parsed==null`, this means no email is currently being referenced.
     **/
    abstract dataChanged(parsed: ParsedFragment | null): void | Promise<void>;
    /** User readable description of the automatic action that will be performed by this provider.
     * Must provide suitable text if the current provider has registered as automatic action provider.
     **/
    automaticActionText(): HTMLLike {
        console.error("automaticActionText called by provider that doesn't support automatic actions")
        return text("[Internal error (see the console)]")
    }

    options(): ProviderOptions {
        if (this._options != null)
            return this._options;
        if (options.providerOptions == null)
            options.providerOptions = {}
        if (options.providerOptions[this.id()] == null)
            options.providerOptions[this.id()] = {};
        this._options = options.providerOptions[this.id()];
        return this._options;
    }
}