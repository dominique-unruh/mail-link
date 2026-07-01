import './style.css';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/copy-button/copy-button.js';
import {emailToMailLink} from './generate-core.ts';
import {options, saveOptions} from './options.ts';
import type {SlCopyButton, SlInput, SlTextarea} from '@shoelace-style/shoelace';

const input = document.getElementById('headers-input') as unknown as SlTextarea;
const whoHasItInput = document.getElementById('whohasit-input') as unknown as SlInput;
const resultDiv = document.getElementById('result') as HTMLDivElement;
const resultLink = document.getElementById('result-link') as HTMLAnchorElement;
const resultCopy = document.getElementById('result-copy') as unknown as SlCopyButton;
const resultError = document.getElementById('result-error') as HTMLParagraphElement;
const thunderbirdHint = document.getElementById('thunderbird-hint') as HTMLParagraphElement;

// Restore the persisted name.
whoHasItInput.value = options.whoHasIt ?? '';

function showError(message: string): void {
    resultDiv.style.display = 'none';
    resultError.textContent = message;
    resultError.style.display = 'block';
    thunderbirdHint.style.display = 'none';
}

function hideOutput(): void {
    resultDiv.style.display = 'none';
    resultError.style.display = 'none';
    thunderbirdHint.style.display = 'block';
}

async function regenerate(): Promise<void> {
    const raw = input.value;
    if (!raw || raw.trim() === '') {
        hideOutput();
        return;
    }

    let url: string | null;
    try {
        // Base = the resolve page: the current directory, without generate.html/query/fragment.
        const base = new URL('.', window.location.href).href;
        url = await emailToMailLink(raw, base, whoHasItInput.value);
    } catch (error) {
        showError('Could not generate a link: ' + (error as Error).message);
        return;
    }

    if (url === null) {
        showError('No Message-ID found in the pasted headers, so no mail-link can be generated.');
        return;
    }

    resultError.style.display = 'none';
    thunderbirdHint.style.display = 'none';
    resultLink.href = url;
    resultLink.textContent = url;
    resultCopy.value = url;
    resultDiv.style.display = 'block';
}

input.addEventListener('sl-input', regenerate);

// Clear button: empty the paste box and reset the output.
const clearButton = document.getElementById('clear-input') as HTMLButtonElement;
clearButton.addEventListener('click', () => {
    input.value = '';
    void regenerate();
});

whoHasItInput.addEventListener('sl-input', () => {
    options.whoHasIt = whoHasItInput.value;
    saveOptions();
    void regenerate();
});

// Drag-and-drop a file (e.g. an .eml) onto the drop zone.
const dropZone = document.getElementById('drop-zone') as HTMLDivElement;

function onDragOver(event: DragEvent): void {
    event.preventDefault();
    // Show the "copy" cursor so the box reads as a drop target.
    if (event.dataTransfer)
        event.dataTransfer.dropEffect = 'copy';
    dropZone.classList.add('drag-over');
}

function onDragLeave(event: DragEvent): void {
    // Ignore dragleave events fired when moving between child elements.
    if (event.relatedTarget && dropZone.contains(event.relatedTarget as Node))
        return;
    dropZone.classList.remove('drag-over');
}

async function onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    dropZone.classList.remove('drag-over');
    const dt = event.dataTransfer;
    if (!dt)
        return;

    let text: string | null = null;
    if (dt.files && dt.files.length > 0)
        text = await dt.files[0].text();
    else
        text = dt.getData('text');

    if (text != null) {
        input.value = text;
        await regenerate();
    }
}

dropZone.addEventListener('dragover', onDragOver);
dropZone.addEventListener('dragleave', onDragLeave);
dropZone.addEventListener('drop', onDrop);
