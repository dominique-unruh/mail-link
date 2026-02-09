import {Provider} from "../provider.ts";
import {escapeHtml} from "../utils.ts";
import type {ParsedFragment} from "../types.ts";

export class DataTableProvider extends Provider {
    constructor() {
        super({'id': 'data-table', 'title': 'Data Table', 'insertHere': 'data-table'});
    }

    protected init(): void | Promise<void> {}

    dataChanged(parsed: ParsedFragment | null): void | Promise<void> {
        const tableContainer = this.contentDiv();

        if (!parsed) {
            tableContainer.innerHTML = '<p style="color: #999;">No fragment data in URL</p>';
            return;
        }

        const paramCount = Object.keys(parsed.params).length;

        if (paramCount === 0) {
            tableContainer.innerHTML = `<p style="color: #999;">No additional parameters</p>`;
        } else {
            let tableHtml = `
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
}
