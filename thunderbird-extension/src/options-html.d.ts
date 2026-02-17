interface Document {
    getElementById(elementId: "whoHasIt" | "baseUrl"): HTMLInputElement;
    getElementById(elementId: "includeWhoHasIt" | "includeSubject" | "includeDate" | "includeFrom" | "includeTo"): HTMLInputElement;
    getElementById(elementId: "optionsForm"): HTMLFormElement;
    getElementById(elementId: "errors" | "status"): HTMLDivElement;
    getElementById(elementId: "save-button"): HTMLButtonElement;
}