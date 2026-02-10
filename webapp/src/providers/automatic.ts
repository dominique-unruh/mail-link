import html from './automatic.html?raw';
import {Provider} from "../provider.ts";
import type {HTMLLike, ParsedFragment} from "../types.ts";

export class AutomaticProvider extends Provider {
    private linkElement!: HTMLAnchorElement;
    private autoActionCheckbox!: HTMLInputElement;
    private uri: string | undefined;

    constructor() {
        super({'id': 'automatic', 'title': 'Automatically', 'html': html});
    }

    protected init(): void | Promise<void> {
        this.linkElement = document.getElementById("automatic-mid-link") as HTMLAnchorElement;
        this.autoActionCheckbox = document.getElementById("automatic-autoaction") as HTMLInputElement;

        this.autoActionCheckbox.addEventListener("change", () => {
            if (this.autoActionCheckbox.checked) this.takeAutoAction();
            else this.releaseAutoAction();
        })
    }

    dataChanged(data: ParsedFragment | null): void | Promise<void> {
        if (!data) {
            this.linkElement.href = "";
            this.linkElement.textContent = "[No message ID]";
            return;
        }
        // TODO: Theoretically, the mid should be percent-escaped here. But at least Thunderbird expects a non-escaped mid here. Should we make this configurable?
        this.uri = "mid:" + data.mid;
        this.linkElement.textContent = this.uri;
        this.linkElement.href = this.uri;
    }

    lostAutoAction() {
        console.log("Lost");
        this.autoActionCheckbox.checked = false;
    }

    gotAutoAction() {
        this.autoActionCheckbox.checked = true;
    }

    automaticActionText(): HTMLLike {
        return 'Directly open the email in your local mail software (see "Automatically" below).';
    }

    doAutoAction(): void | Promise<void> {
        if (this.uri != null)
            window.location.href = this.uri;
        else
            console.error("doAutoAction called without parsed fragment", this);
    }
}
