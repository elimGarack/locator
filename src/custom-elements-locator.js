import { LitElement, html, css } from 'lit-element';
import { cross, settings } from './icons/index.js';
import '@generic-components/components/dialog.js';
import '@generic-components/components/switch.js';
import { dialog} from '@generic-components/components';

import './found-element.js';
import './share-element.js'

class CustomElementsLocator extends LitElement {
  static get properties() {
    return {
      customElements: { type: Array },
      query: { type: String },
      loaded: { type: Boolean },
      showSubmit: { type: Boolean },
      host: { type: String},
      displayAmount: { type: Boolean },
    }
  }

  constructor() {
    super();
    this.customElements = [];
    this.query = '';
    this.loaded = true;
    this.showSubmit = false;
    this.host = '';
  }

  firstUpdated() {
    this.switch = this.shadowRoot.querySelector('generic-switch');

    ['keydown', 'click'].forEach(event => {
      this.switch.addEventListener(event, e => {
        switch (event) {
          case 'keydown':
            if (e.keyCode === 32 || e.keyCode === 13) {
              e.preventDefault();
              this.handleDisplayAmount(e);
            }
            break;
          case 'click':
            this.handleDisplayAmount(e);
            break;
          default:
            break;
        }
      });
    });

    chrome.storage.sync.get(['displayAmount'], ({displayAmount = false} = {}) => {
      if(displayAmount) {
        this.switch.setAttribute('checked', '');
      } else {
        this.switch.removeAttribute('checked')
      }
    });

    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {msg: "get_latest"}, ({elements, host}) => {
        this.customElements = elements;
      });
    });

    this.inputEl = this.shadowRoot.querySelector('input');
  }

  handleChange() {
    this.query = this.inputEl.value;
  }

  handleDisplayAmount(e) {
    chrome.storage.sync.set({'displayAmount': e.target.hasAttribute('checked')}, () => {
      chrome.runtime.sendMessage({
        msg: 'display_amount_changed',
        displayAmount: e.target.hasAttribute('checked'),
        amount: this.customElements.length
      }, () => {});

      if(e.target.hasAttribute('checked')) {
        this.switch.setAttribute('checked', '');
      } else {
        this.switch.removeAttribute('checked');
      }

    });
  }

  render() {
    return html`
      <generic-dialog close-on-escape close-on-outside-click>
        <button slot="invoker">
          ${settings}
        </button>
        <div slot="content">
          <div class="dialog-header">
            <h2>Settings:</h2>
            <button id="close" @click=${() => dialog.close()}>${cross}</button>
          </div>
          <generic-switch>
            Display amount in extension icon
          </generic-switch>
        </div>
      </generic-dialog>
      <div>
        <a class="img-href" href="https://www.open-wc.org" rel="noopener noreferrer" target="_blank">
          <svg style="margin-top: 10px" width="100px" height="100px" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 200"><defs><style>.cls-1{fill:url(#linear-gradient);}</style><linearGradient id="linear-gradient" x1="100" x2="100" y2="200" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#9b03fe"/><stop offset="0.17" stop-color="#9706fe"/><stop offset="0.33" stop-color="#8b0ffe"/><stop offset="0.48" stop-color="#781dfe"/><stop offset="0.64" stop-color="#5c32fe"/><stop offset="0.8" stop-color="#394cfe"/><stop offset="0.95" stop-color="#0e6cfe"/><stop offset="1" stop-color="#0077fe"/></linearGradient></defs><path class="cls-1" d="M192.19,92.19H184.8a85.12,85.12,0,0,0-77-77V7.81a7.81,7.81,0,0,0-15.62,0V15.2a85.12,85.12,0,0,0-77,77H7.81a7.81,7.81,0,0,0,0,15.62H15.2a85.12,85.12,0,0,0,77,77v7.39a7.81,7.81,0,0,0,15.62,0V184.8a85.12,85.12,0,0,0,77-77h7.39a7.81,7.81,0,0,0,0-15.62ZM162.5,107.81h6.59a69.67,69.67,0,0,1-61.28,61.28V162.5a7.81,7.81,0,0,0-15.62,0v6.59a69.67,69.67,0,0,1-61.28-61.28H37.5a7.81,7.81,0,0,0,0-15.62H30.91A69.67,69.67,0,0,1,92.19,30.91V37.5a7.81,7.81,0,0,0,15.62,0V30.91a69.67,69.67,0,0,1,61.28,61.28H162.5a7.81,7.81,0,0,0,0,15.62ZM100,76.56A23.44,23.44,0,1,0,123.44,100,23.47,23.47,0,0,0,100,76.56Zm0,31.25a7.81,7.81,0,1,1,7.81-7.81A7.81,7.81,0,0,1,100,107.81Z"/></svg>
        </a>
      </div>
      <h1>Custom Elements Locator</h1>
      <div>
        <input placeholder="Filter custom elements..." @input=${this.handleChange} type="text"/>
      </div>
      ${this.loaded
        ? this.customElements.length > 0
          ? html`
              <ul>
                ${this.customElements
                  .filter(element => element.includes(this.query))
                  .sort((a, b) => a.localeCompare(b))
                  .map(element => html`
                    <li>
                      <found-element .customElementName=${element}></found-element>
                    </li>
                  `)}
              </ul>
              <share-element .amount="${this.customElements.length}" .domain="${this.host}"></share-element>
            `
          : html`<p>No custom elements found!</p>`
        : html`<p>Loading...</p>`
      }
    `;
  }

  static get styles() {
    return css`
      :host {
        width: 300px;
        font-family: sans-serif;
        display: block;
        padding: 8px;
      }

      generic-dialog {
        width: 100%;
        display: flex;
        margin-left: auto;
      }

      generic-dialog button {
        margin-left: auto;
        display: flex;
        background: transparent;
        border: none;
      }

      generic-dialog button[slot="invoker"] svg path {
        stroke-width: 8;
      }

      .img-href {
        display: block;
      }

      h1 {
        font-size: 25px;
        text-align: center;
        color: var(--col-gray);
      }

      div {
        display: flex;
        flex: 1;
        justify-content: center;
      }

      img {
        width: 100px;
        margin: auto;
      }

      ul {
        padding-left: 0;
        font-weight: 500;
        padding-left: 0;
        font-size: 15px;
      }

      li {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          padding: 15px;
          list-style-type: none;
          background-color: white;
          border-radius: 7px;
          border: solid 3px rgb(227, 227, 227);
      }

      li:hover {
        border: solid 3px rgb(33, 127, 249);
        box-shadow: 0px 2px 5px -2px rgba(0,0,0,0.54);
      }

      input {
        font-size: 15px;
        width: calc(100% - 25px);
        padding: 10px;
        border-radius: 25px;
        border: none;
        border: solid 3px rgb(227, 227, 227);
      }

      input:focus {
        outline: none;
        border: solid 3px rgb(33, 127, 249);
        box-shadow: 0px 2px 5px -2px rgba(0,0,0,0.54);
      }

      p {
        font-size: 15px;
        text-align: center;
        margin-top: 45px;
        margin-bottom: 45px;
      }
    `;
  }
}

customElements.define('custom-elements-locator', CustomElementsLocator);