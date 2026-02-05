import './style.css';

interface ParsedFragment {
    mid: string;
    params: Record<string, string>;
}

function parseFragment(): ParsedFragment | null {
    const hash = window.location.hash;

    if (!hash || hash.length <= 1) {
        return null;
    }

    // Remove the leading '#'
    const fragment = hash.substring(1);

    // Split by '&'
    const parts = fragment.split('&');

    if (parts.length === 0) {
        return null;
    }

    // First part is the mid
    const mid = decodeURIComponent(parts[0]);

    // Rest are key=value pairs
    const params: Record<string, string> = {};

    for (let i = 1; i < parts.length; i++) {
        const pair = parts[i].split('=');
        if (pair.length === 2) {
            const key = decodeURIComponent(pair[0].replace(/\+/g, ' '));
            // noinspection UnnecessaryLocalVariableJS
            const value = decodeURIComponent(pair[1].replace(/\+/g, ' '));
            params[key] = value;
        }
    }

    return { mid, params };
}

function shellEscape(str: string): string {
    if (str == '') return "''";

    // If string contains no special characters, return as-is
    if (/^[a-zA-Z0-9._\/:@+-]+$/.test(str)) {
        return str;
    }

    // Otherwise, wrap in single quotes and escape any single quotes
    return "'" + str.replace(/'/g, "'\\''") + "'";
}

function displayFragmentData(): void {
    const parsed = parseFragment();

    const tableContainer = document.getElementById('fragment-table') as HTMLDivElement;
    const textarea = document.getElementById('thunderbird-command') as HTMLTextAreaElement;

    if (!parsed) {
        tableContainer.innerHTML = '<p style="color: #999;">No fragment data in URL</p>';
        textarea.value = '';
        return;
    }

    // Set thunderbird command
    // Note: parsed.mid should not be percent-escaped here because thunderbird (incorrectly?) does not decode the mid-URI.
    textarea.value = `thunderbird ${shellEscape("mid:" + parsed.mid)}`;

    // Build table
    const paramCount = Object.keys(parsed.params).length;

    if (paramCount === 0) {
        tableContainer.innerHTML = `
      <p><strong>Message ID:</strong> ${escapeHtml(parsed.mid)}</p>
      <p style="color: #999;">No additional parameters</p>
    `;
    } else {
        let tableHtml = `
      <p><strong>Message ID:</strong> ${escapeHtml(parsed.mid)}</p>
      <table style="margin-top: 1rem; border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="padding: 0.5rem; text-align: left; border: 1px solid #ddd;">Key</th>
            <th style="padding: 0.5rem; text-align: left; border: 1px solid #ddd;">Value</th>
          </tr>
        </thead>
        <tbody>
    `;

        for (const [key, value] of Object.entries(parsed.params)) {
            tableHtml += `
        <tr>
          <td style="padding: 0.5rem; border: 1px solid #ddd;">${escapeHtml(key)}</td>
          <td style="padding: 0.5rem; border: 1px solid #ddd;">${escapeHtml(value)}</td>
        </tr>
      `;
        }

        tableHtml += `
        </tbody>
      </table>
    `;

        tableContainer.innerHTML = tableHtml;
    }
}

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setupCopyButton(): void {
    const copyButton = document.getElementById('copy-button') as HTMLButtonElement;
    const textarea = document.getElementById('thunderbird-command') as HTMLTextAreaElement;

    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(textarea.value);

            // Visual feedback
            const originalText = copyButton.textContent;
            copyButton.textContent = '✓ Copied!';
            copyButton.style.background = '#4CAF50';

            setTimeout(() => {
                copyButton.textContent = originalText;
                copyButton.style.background = '';
            }, 2000);
        } catch (err) {
            // Fallback for older browsers
            textarea.select();
            document.execCommand('copy');
            copyButton.textContent = '✓ Copied!';

            setTimeout(() => {
                copyButton.textContent = 'Copy to Clipboard';
            }, 2000);
        }
    });
}

function initApp(): void {
    displayFragmentData();
    setupCopyButton();

    // Re-parse if hash changes
    window.addEventListener('hashchange', displayFragmentData);
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}