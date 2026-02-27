# Version 1.1

- When copying into a rich text documents (and most other places where text can be formatted)
  the result will be a short like like [Email from Dominique Unruh](https://qis.rwth-aachen.de/people/unruh/tools/mail-link/#a5ce5048-46cb-454b-afcd-8012add2c8c1%40x.unruh.de&subject=An%20interesting%20email...&date=2026-02-06T17%3A45%3A30.000Z&from=Sender%20Name%20%3Cgit.maillink.32gdvl%40x.unruh.de%3E&to=Recipient%20Name%20%3Crecipient%40example.com%3E&whohasit=Dominique%20Unruh)
  instead of a long URL.
- Date in URL is formatted as a RFC5322 time-stamp (more readable)
- Message URL now encoded slightly differently to avoid e.g., ending in `.`.
  This makes it easier for programs to automatically identify where the URL
  ends when contained in plain text documents.
- Extension is now written in TypeScript.
