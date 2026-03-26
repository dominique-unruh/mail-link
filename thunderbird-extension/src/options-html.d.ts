interface Document {
    getElementById(elementId: "whoHasIt" | "baseUrl"): HTMLInputElement;
    getElementById(elementId: "includeWhoHasIt" | "includeSubject" | "includeDate" | "includeFrom" | "includeTo" | "acceptPrivacyNotice"): HTMLInputElement;
    getElementById(elementId: "presentation"): HTMLTextAreaElement;
    getElementById(elementId: "optionsForm"): HTMLFormElement;
    getElementById(elementId: "errors" | "status"): HTMLDivElement;
    getElementById(elementId: "save-button"): HTMLButtonElement;
    getElementById(elementId: "privacy-notice"): HTMLParagraphElement;
}