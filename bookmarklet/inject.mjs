// Substitute the bookmarklet's configuration placeholders with actual values.
//
// The placeholders appear in the bundled code as quoted string literals, e.g.
// "@@@BASE_URL@@@". We match the placeholder together with its surrounding quote
// (single or double, whichever the minifier chose) and replace the whole literal
// with JSON.stringify(value) — a valid JS double-quoted string literal — so any
// quotes, backslashes or other characters in the value are quoted correctly.
//
// A function replacement is used so that "$" in a value is not treated as a
// special replacement pattern.

export function inject(template, baseUrl, whohasit) {
    return template
        .replace(/(['"])@@@BASE_URL@@@\1/g, () => JSON.stringify(baseUrl))
        .replace(/(['"])@@@WHOHASIT@@@\1/g, () => JSON.stringify(whohasit));
}
