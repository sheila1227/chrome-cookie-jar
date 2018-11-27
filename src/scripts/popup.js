import ext from "./utils/ext";
import storage from "./utils/storage";
import { COOKIE_STORAGE_KEY } from './constants';
import { COOKIE_JAR_DEFAULT_USER_SETTING } from './defaults';
import ClipboardJS from './lib/clipboard';
import tippy from './lib/tippy';

class CookieView {
  constructor() {
    this.init();
  }

  init() {
    this.popup = document.getElementById('app');
    this.cookieItemsContainer = document.getElementById('cookie-items');
    this.cookiesToFetch = []; // user setting
    this.cookiesFromStore = []; // cookie raw data fetched from cookie store
    this.fetchedTimes = 0; // indicate cookie fetching progress
    this.clipboard = new ClipboardJS('.copy-cookie-val');
    this.fetchUserSetting();
    this.bindEvents();
  }

  fetchUserSetting() {
    storage.get(COOKIE_STORAGE_KEY, (resp) => {
      const userOptions = resp[COOKIE_STORAGE_KEY];
      if (userOptions === undefined) {
        this.cookiesToFetch = COOKIE_JAR_DEFAULT_USER_SETTING || [];
        storage.set({ [COOKIE_STORAGE_KEY]: this.cookiesToFetch }, () => {
          this.fetchCookies();
        });
      } else {
        this.cookiesToFetch = userOptions || [];
        this.fetchCookies();
      }
    });
  }

  fetchCookies() {
    this.cookiesToFetch.forEach((cookieObj) => {
      this.fetchSingleCookie(cookieObj)
    });
  }

  fetchSingleCookie(cookieObj) {
    const { name, domain } = cookieObj;
    const param = { name };
    if (domain) param.domain = domain;
    ext.cookies.getAll(param, (cookies) => {
      this.fetchedTimes += 1;

      if (cookies.length) {
        const cookieRawData = cookies[0];
        this.cookiesFromStore.push(cookieRawData);
      }

      if (this.fetchedTimes === this.cookiesToFetch.length) { // has done all cookie fetching
        this.renderCookieItems();
      }
    });
  }

  bindEvents() {
    this.popup.addEventListener("click", (e) => {
      if(e.target && e.target.matches("#save-btn")) {
      } else if(e.target && e.target.matches("#go-option-page")) {
        this.goOptionPage(e);
      }
    });
  }

  goOptionPage(e) {
    e.preventDefault();
    ext.tabs.create({'url': ext.extension.getURL('options.html')});
  }

  getCookieItemTemplate(cookieRawData) {
    const { name, value, domain } = cookieRawData;
    const userSettingItem = this.cookiesToFetch.find(settingItem => settingItem.name === name && settingItem.domain === domain);
    const { desc } = userSettingItem || {};
    return (`
      <li class="cookie-item list-item">
        <label>${name}</label>
        <span class="item-val">${value}</span>
        <span
          tabindex="1"
          class="copy-cookie-val"
          data-tippy="I'm a Tippy tooltip!"
          data-tippy-delay="50"
          data-tippy-arrow="true"
          data-tippy-animation="shift-toward"
          data-clipboard-text="${value}">
          复制
        </span>
      </li>
      ${desc ? `<div class="desc">${desc}</div>` : ""}
      ${domain ? `<div class="domain">来自：${domain}</div>` : ""}
    `);
  }

  renderCookieItems() {
    this.cookieItemsContainer.innerHTML = this.cookiesFromStore.reduce((result, cookieItem) => {
      return `${result}${this.getCookieItemTemplate(cookieItem)}`
    }, '');
    tippy('.copy-cookie-val', {
      content: "Copied!",
      delay: 100,
      arrow: true,
      size: 'small',
      trigger: 'click',
      animation: 'shift-toward',
      placement: 'top-end',
    })
  }


}

window.onload = function() {
  new CookieView();
}
