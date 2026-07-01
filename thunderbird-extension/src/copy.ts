// noinspection ExceptionCaughtLocallyJS

import {makeLinkTitle, makeLinkTitles, makeSpecificLinkTitle} from './maketitle.js';
import {defaultOptions, Options, PrivacyNoticeOptions} from "./common.js";
import Tab = browser.tabs.Tab;
import {buildMailLink, MailLinkFields} from "./shared/maillink.js";

/** Returns options, or redirects user to options page and returns null */
async function getOptions() {
  // Get options from storage
  let options = await browser.storage.sync.get(defaultOptions) as Options;

  if (!options.baseUrl || options.baseUrl === "" || options.privacyNotice != PrivacyNoticeOptions.accepted) {
    console.log("Need to show options page", options);
    await browser.runtime.openOptionsPage();
    return null;
  }

  return options;
}

async function copyMessageLink(tab: Tab, presentation: string|null) {
  try {
    // Get the displayed message
    let message = (await browser.messageDisplay.getDisplayedMessage(tab.id!))!;

    if (!message)
      throw Error("No message displayed");

    const options = await getOptions();
    if (options == null) return;

    // Construct the URL
    let url = constructUrl(message, options);

    const linkTitle =
        (presentation == null) ? await makeLinkTitle(message, options) :
            (await makeSpecificLinkTitle(message, presentation))[1];

    await urlToClipboard(url, linkTitle);

    // Show notification
    await browser.notifications.create({
      type: "basic",
      iconUrl: "icon.svg",
      title: "Copy Message Link",
      message:
          (presentation == null) ?
            `Message link '${linkTitle}' copied to clipboard!\n(Right click 'Copy Link' button for more options.)` :
              `Message link '${linkTitle}' copied to clipboard!`,
    });
  } catch (error) {
    console.error("Error copying message link:", error);
    await browser.notifications.create({
      type: "basic",
      iconUrl: "icon.svg",
      title: "Copy Message Link",
      message: "Error: " + (error as Error).message
    });
  }
}

browser.messageDisplayAction.onClicked.addListener(async (tab, _info) => {
  await copyMessageLink(tab, null);
});

browser.menus.onShown.addListener(async (info, tab) => {
  console.log("onShown", info);

  let message = (await browser.messageDisplay.getDisplayedMessage(tab.id!))!;

  const options = await getOptions();
  if (options == null) return;

  for (const id of info.menuIds)
    if (String(id).startsWith("copy-message-link-"))
      browser.menus.remove(id);

/*
  browser.menus.create({
    id: "copy-message-link-copy-as",
    enabled: true,
    title: "Copy as:",
    contexts: ["message_display_action"],
  })*/

  let someValid = false;
  for await (const [valid, config, title] of makeLinkTitles(message, options)) {
    browser.menus.create({
      id: `copy-message-link-title-${config}`,
      title: `📋 ${title}`,
      enabled: valid,
      contexts: ["message_display_action", "message_list"],
    })
    if (valid) someValid = true;
  }

  if (!someValid)
    browser.menus.create({
      id: `copy-message-link-title-Email`,
      title: `📋 Email`,
      contexts: ["message_display_action", "message_list"],
    })

  browser.menus.refresh();
})

browser.menus.onClicked.addListener(async (info, tab) => {
  if (tab?.id == null) return;
  const menuItemId = String(info.menuItemId);
  if (menuItemId.startsWith("copy-message-link-title-")) {
    const message = await browser.messageDisplay.getDisplayedMessage(tab.id);
    if (!message) return;
    const presentation = menuItemId.substring("copy-message-link-title-".length);
    copyMessageLink(tab, presentation);
  }
})

/** Construct the URL linking to email `message`, honoring the include-flags in `options`.
 */
function constructUrl(message: browser.messages.MessageHeader, options: Options): string {
  const fields: MailLinkFields = {
    messageId: message.headerMessageId,
  };

  if (options.includeSubject && message.subject)
    fields.subject = message.subject;

  if (options.includeDate && message.date)
    fields.date = formatRFC5322(message.date as Date);

  if (options.includeFrom && message.author)
    fields.from = message.author;

  if (options.includeTo && message.recipients && message.recipients.length > 0)
    fields.to = message.recipients.join(", ");

  if (options.whoHasIt)
    fields.whohasit = options.whoHasIt;

  return buildMailLink(options.baseUrl, fields);
}

function escapeHtml(text: string) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/** Copied `url` to the clipboard.
 * When pasted into a target supporting rich text, it will be pasted as a hyperlink to `url`, with text `title`.
 */
async function urlToClipboard(url: string, title: string): Promise<void> {
  const html = `<a href="${url}">${escapeHtml(title)}</a>`;

  const clipboardItem = new ClipboardItem({
    'text/html': new Blob([html], { type: 'text/html' }),
    'text/plain': new Blob([url], { type: 'text/plain' })
  });

  await navigator.clipboard.write([clipboardItem]);
}


function formatRFC5322(date: Date) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const pad = (n: any) => String(n).padStart(2, '0');

  const offset = -date.getTimezoneOffset();
  const offsetSign = offset >= 0 ? '+' : '-';
  const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
  const offsetMinutes = pad(Math.abs(offset) % 60);

  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} ` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ` +
      `${offsetSign}${offsetHours}${offsetMinutes}`;
}
