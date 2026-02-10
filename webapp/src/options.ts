import type {OptionStorage} from "./types.ts";

export const options: OptionStorage = loadOptions();

function loadOptions(): OptionStorage {
    const json = localStorage.getItem('mail-link-webapp');
    if (json == null) return {}
    var parsed: object
    try {
        parsed = JSON.parse(json)
    } catch (error) {
        console.error("Could not parse stored options. Discarding options.", json)
        return {}
    }
    if (!(typeof parsed === 'object')) {
        console.error("Stored options are not a JSON-object. Discarding options.", json, parsed)
        return {}
    }
    console.log("Loaded options", parsed);
    return parsed as OptionStorage;
}

export function saveOptions(): void {
    console.log("Saving options", options);
    localStorage.setItem('mail-link-webapp', JSON.stringify(options))
}
