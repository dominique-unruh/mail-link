# mail-link

Library for creating and processing *mail-links*: URLs that refer to an individual email by its
message-id, optionally with additional data (subject, date, sender, ...) for finding it when
message-id search is not available.
The link format is specified in [this wiki page](https://github.com/dominique-unruh/mail-link/wiki/Mail%E2%80%90link-format).
See the [main repository](https://github.com/dominique-unruh/mail-link) for the tools built on it.

## Installation

```sh
npm install mail-link
```

## Usage

All data of a link is represented as `MailLinkFields`: an object with the mandatory `messageId`
(without the surrounding `<>`), the optional known fields `subject`, `date`, `from`, `to`,
`whohasit`, and any other field with a lowercase name.

### Creating a link

```ts
import {buildMailLink} from 'mail-link';

const link = buildMailLink('https://qis.rwth-aachen.de/people/unruh/tools/mail-link/', {
    messageId: 'abc123@example.org',
    subject: 'Meeting notes',
    from: 'Alice <alice@example.org>',
});
// https://qis.rwth-aachen.de/people/unruh/tools/mail-link/#abc123%40example.org&subject=Meeting%20notes&from=Alice%20%3Calice%40example.org%3E
```

The first argument is the URL of a landing page that interprets mail-links, here the hosted
[mail-link webapp](https://qis.rwth-aachen.de/people/unruh/tools/mail-link/).

### Creating a link from an email

`messageToFields` extracts the fields from the headers of a raw email (RFC 5322, e.g., the
content of an `.eml` file). It returns `null` if the email has no `Message-ID`.

```ts
import {buildMailLink, messageToFields} from 'mail-link';

const raw = 'Message-ID: <abc123@example.org>\r\n' +
    'Subject: =?UTF-8?Q?Gr=C3=BC=C3=9Fe?=\r\n' +
    'From: Alice <alice@example.org>\r\n\r\nHello!\r\n';
const fields = messageToFields(raw);
// {messageId: 'abc123@example.org', subject: 'Grüße', from: 'Alice <alice@example.org>'}
if (fields)
    console.log(buildMailLink('https://qis.rwth-aachen.de/people/unruh/tools/mail-link/', fields));
```

### Parsing a link

`parseMailLink` is the inverse of `buildMailLink`. It throws a `MailLinkParseError` if the link
cannot be interpreted at all (not a URL, no fragment, no message-id). Smaller problems are
tolerated and described in `parseErrors`. Unknown fields are kept.

```ts
import {MailLinkParseError, parseMailLink} from 'mail-link';

try {
    const fields = parseMailLink(
        'https://qis.rwth-aachen.de/people/unruh/tools/mail-link/#abc123%40example.org&subject=Meeting%20notes&Subject=again&x-tag=urgent');
    // {
    //     messageId: 'abc123@example.org',
    //     subject: 'Meeting notes',
    //     'x-tag': 'urgent',
    //     parseErrors: ['Field name "Subject" is not lowercase',
    //                   'Ignored repeated field "subject": "again"'],
    // }
} catch (e) {
    if (e instanceof MailLinkParseError)
        console.log('Not a mail-link: ' + e.message);
    else
        throw e;
}
```

## License

[MIT](LICENSE).

As an additional permission, in minified or bundled builds a short notice of the form
`mail-link (c) Dominique Unruh, MIT License` satisfies the requirement to include the copyright
and permission notice.
