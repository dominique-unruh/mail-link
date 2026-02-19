export interface ParsedFragment {
    mid: string;
    params: Record<string, string>;
}

export type ProviderOptions = Record<string, any>;

export interface OptionStorage {
    openedProvider?: string,
    automaticProvider?: string,
    providerOptions?: Record<string, ProviderOptions>
}

export type HTMLLike = string | HTMLElement | DocumentFragment | Text | [string, string];