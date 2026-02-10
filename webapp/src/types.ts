export interface ParsedFragment {
    mid: string;
    params: Record<string, string>;
}

// type ProviderOptions = Record<string, any>;

export interface OptionStorage {
    openedProvider?: string,
    automaticProvider?: string,
    // providerOptions?: Map<string, ProviderOptions>
}

export type HTMLLike = string | HTMLElement | DocumentFragment;