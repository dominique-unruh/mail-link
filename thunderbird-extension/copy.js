// Install the actions of the
// noinspection ExceptionCaughtLocallyJS

browser.messageDisplayAction.onClicked.addListener(async (tab, _info) => {
  try {
    // Get the displayed message
    let message = await browser.messageDisplay.getDisplayedMessage(tab.id);

    // Get options from storage
    let options = await browser.storage.sync.get();
    console.log(options)
    if (!options.baseUrl || options.baseUrl === "") {
      browser.runtime.openOptionsPage();
      return;
    }

    if (!message)
      throw Error("No message displayed");

    // Get full message details
    let messageData = await browser.messages.get(message.id);

    // Construct the URL
    let url = constructUrl(messageData, options);

    let linkTitle = await makeLinkTitle(messageData);
    console.log(linkTitle);

    await urlToClipboard(url, linkTitle);

    // Show notification
    await browser.notifications.create({
      type: "basic",
      iconUrl: "icon.svg",
      title: "Copy Message Link",
      message: "Message link copied to clipboard!"
    });
  } catch (error) {
    console.error("Error copying message link:", error);
    await browser.notifications.create({
      type: "basic",
      iconUrl: "icon.svg",
      title: "Copy Message Link",
      message: "Error: " + error.message
    });
  }
});

/** Like encodeURIComponent but encodes additional characters that make the URI more suitable for automatic recognition inside plain text */
function myEncodeURIComponent(uriComponent) {
  return encodeURIComponent(uriComponent)
      .replace(/'/g, (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase());
}

/** Optionally quotes the last character of the URI to make sure the URI is more suitable for automatic recognition inside plain text.
 * E.g., doesn't end in a `.`. */
function fixupURL(url) {
  return url.replace(/[^a-zA-Z0-9/&#=]$/, (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase());
}

// Construct the message link URL
function constructUrl(message, options) {
  let url = options.baseUrl;
  
  // Get message ID
  let msgId = message.headerMessageId;
  if (!msgId || msgId === "")
    throw Error("Could not determine message id")
  
  // Start with message ID
  url += "#" + myEncodeURIComponent(msgId);
  
  // Add optional fields
  if (options.includeSubject && message.subject) {
    url += "&subject=" + myEncodeURIComponent(message.subject);
  }
  
  if (options.includeDate && message.date) {
    // Format date as ISO 8601
    let dateStr = new Date(message.date).toISOString();
    url += "&date=" + myEncodeURIComponent(dateStr);
  }
  
  if (options.includeFrom && message.author) {
    url += "&from=" + myEncodeURIComponent(message.author);
  }
  
  if (options.includeTo && message.recipients && message.recipients.length > 0) {
    let toList = message.recipients.join(", ");
    url += "&to=" + myEncodeURIComponent(toList);
  }
  
  if (options.whoHasIt) {
    url += "&whohasit=" + myEncodeURIComponent(options.whoHasIt);
  }

  url = fixupURL(url);

  return url;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function urlToClipboard(url, title) {
  const html = `<a href="${url}">${escapeHtml(title)}</a>`;

  const clipboardItem = new ClipboardItem({
    'text/html': new Blob([html], { type: 'text/html' }),
    'text/plain': new Blob([url], { type: 'text/plain' })
  });

  await navigator.clipboard.write([clipboardItem]);
}

async function makeLinkTitle(message) {
  try {
    const parsedSender = (await browser.messengerUtilities.parseMailboxString(message.author))[0];
    console.log(message.author, parsedSender);
    const name = parsedSender.name;
    const email = parsedSender.email;
    console.log(message.author, parsedSender, name, email);
    if (name != null)
      return `Email from ${name}`;
    else if (email != null) {
      const localPart = email.substring(0, email.indexOf('@'));
      return `Email from "${localPart}"`;
    } else
      return "Email";
  } catch (e) {
    console.error("makeLinkTitle", message, e);
    return "Email";
  }
}
