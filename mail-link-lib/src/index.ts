// Public API of the `mail-link` package.
// Keep every module free of top-level side effects (package.json declares "sideEffects": false),
// so bundlers can drop whatever a consumer does not use.

export {buildMailLink, type MailLinkFields} from './maillink.js';
export {messageToFields} from './message.js';
