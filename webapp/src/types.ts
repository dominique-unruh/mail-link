export interface ParsedFragment {
    mid: string;
    params: Record<string, string>;
}

// type ProviderOptions = Map<string, any>;

export interface OptionStorage {
    openedProvider?: string,
    // automaticProvider?: string,
    // providerOptions?: Map<string, ProviderOptions>
}