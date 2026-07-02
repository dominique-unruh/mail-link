import './style.css';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import {inject} from '../../bookmarklet/inject.mjs';
// The bookmarklet template (with @@@BASE_URL@@@ / @@@WHOHASIT@@@ placeholders),
// built by the bookmarklet subproject. Inlined into this bundle at build time.
import template from '../../bookmarklet/dist/bookmarklet-template.min.js?raw';
import {options, saveOptions} from './options.ts';
import type {SlInput} from '@shoelace-style/shoelace';

const baseInput = document.getElementById('baseurl-input') as unknown as SlInput;
const whoInput = document.getElementById('whohasit-input') as unknown as SlInput;
const bmLink = document.getElementById('bm-link') as HTMLAnchorElement;
const sizeEl = document.getElementById('bm-size') as HTMLParagraphElement;

const FIREFOX_LIMIT = 65536;

// Default resolve URL = this page's directory, i.e. the web-app root (which is
// exactly the base that generated mail-links point at). Configurable below.
baseInput.value = new URL('.', window.location.href).href;
whoInput.value = options.whoHasIt ?? '';

function update(): void {
    const code = inject(template, baseInput.value.trim(), whoInput.value.trim());
    const url = 'javascript:' + encodeURIComponent(code);
    bmLink.href = url;

    const over = url.length > FIREFOX_LIMIT;
    sizeEl.textContent = over
        ? `The bookmarklet is ${url.length} characters — too long for Firefox bookmarks (limit ${FIREFOX_LIMIT}).`
        : '';
    sizeEl.classList.toggle('error', over);
}

// Clicking the button here would just run the bookmarklet against this page.
// It must be installed as a bookmark and used on a webmail page instead.
bmLink.addEventListener('click', event => {
    event.preventDefault();
    alert('Drag this button onto your bookmarks toolbar to install it — don’t click it here. '
        + 'It only works when clicked from your bookmarks while viewing an email.');
});

baseInput.addEventListener('sl-input', update);
whoInput.addEventListener('sl-input', () => {
    options.whoHasIt = whoInput.value;
    saveOptions();
    update();
});

update();
