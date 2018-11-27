import ext from "./utils/ext";
import storage from "./utils/storage";
import MicroModal from './lib/micromodal';
import { COOKIE_STORAGE_KEY } from './constants';
import { COOKIE_JAR_DEFAULT_USER_SETTING } from './defaults';

class CookieSetting {
  constructor() {
    this.init();
  }

  init() {
    this.container = document.getElementById('wrap');
    this.cookieItemsContainer = document.getElementById('cookie-items');
    this.newItemNameInput = document.getElementById('new-item-name');
    this.newItemDescInput = document.getElementById('new-item-desc');
    this.newItemDomainInput = document.getElementById('new-item-domain');
    this.modalTitle = document.getElementById('modal-1-title');
    this.cookieSettings = [];
    this.selectedItem = null;
    this.mode = 'new'; // 'new' or 'edit'
    this.fetchUserSetting();
    this.bindEvents();
  }

  bindEvents() {
    this.container.addEventListener("click", (e) => {
      if(e.target && e.target.matches("#add-new-btn")) {
        this.addNewItem(e);
      }
      if(e.target && e.target.matches("#save-new-btn")) {
        this.saveNewSetting();
      }
      if(e.target && e.target.matches(".icon-delete")) {
        this.deleteItem(e)
      }
      if(e.target && e.target.matches(".icon-edit")) {
        this.editItem(e);
      }
    });
  }

  fetchUserSetting() {
    storage.get(COOKIE_STORAGE_KEY, (resp) => {
      const userOptions = resp[COOKIE_STORAGE_KEY];
      if (userOptions === undefined) {
        this.cookieSettings = COOKIE_JAR_DEFAULT_USER_SETTING || [];
        storage.set({ [COOKIE_STORAGE_KEY]: this.cookieSettings }, () => {
          this.renderCookieItems();
        });
      } else {
        this.cookieSettings = userOptions || [];
        this.renderCookieItems();
      }
    });
  }

  addNewItem(e) {
    this.mode = 'new';
    this.selectedItem = null;
    this.newItemNameInput.value = '';
    this.newItemDomainInput.value = '';
    this.newItemDescInput.value = '';
    this.modalTitle.innerHTML = '添加 cookie 配置';
    MicroModal.show('add-cookie-modal');
  }

  editItem(e) {
    this.mode = 'edit';
    this.selectedItem = JSON.parse(e.target.parentNode.parentNode.getAttribute('data-model'));
    const { name, domain, desc } = this.selectedItem;
    this.newItemNameInput.value = name;
    this.newItemDomainInput.value = domain;
    this.newItemDescInput.value = desc;
    this.modalTitle.innerHTML = '编辑';
    MicroModal.show('add-cookie-modal');
  }

  deleteItem(e) {
    if (confirm('确定删除该项配置吗？')) {
      var trEle = e.target.parentNode.parentNode;
      const cookieRawData = JSON.parse(trEle.getAttribute('data-model'));
      const deleteIndex = this.cookieSettings.findIndex(item => item.id === cookieRawData.id);
      const newItems = [...this.cookieSettings];
      newItems.splice(deleteIndex);
      storage.set({ [COOKIE_STORAGE_KEY]: newItems }, () => {
        this.cookieSettings = newItems;
        this.renderCookieItems();
      });
    }
  }

  saveNewSetting() {
    const name = this.newItemNameInput.value.trim();
    const desc = this.newItemDescInput.value.trim();
    const domain = this.newItemDomainInput.value.trim();
    if (!name) {
      alert('必须填写 cookie 名称！');
      return;
    }
    if (!domain) {
      alert('必须填写 domain！');
      return;
    }
    if (this.mode === 'new') {
      this.cookieSettings.push({ name, domain, desc, id: `${Date.now()}` });
    } else {
      const existedIndex = this.cookieSettings.findIndex(item => item.id === this.selectedItem.id);
      const toUpdateItemm = this.cookieSettings[existedIndex];
      toUpdateItemm.name = name;
      toUpdateItemm.desc = desc;
      toUpdateItemm.domain = domain;
    }

    storage.set({ [COOKIE_STORAGE_KEY]: this.cookieSettings }, () => {
      MicroModal.close('add-cookie-modal');
      this.renderCookieItems();
    });
  }

  getCookieItemTemplate(cookieRawData) {
    const { name, desc, domain } = cookieRawData;
    return (`
      <tr data-model='${JSON.stringify(cookieRawData)}'>
        <td>${name}</td>
        <td>${domain}</td>
        <td>${desc}</td>
        <td>
          <span class="icon icon-edit"></span>
          <span class="icon icon-delete"></span>
        </td>
      </tr>
    `);
  }

  renderCookieItems() {
    const itemsHtml = this.cookieSettings.reduce((result, cookieItem) => {
      return `${result}${this.getCookieItemTemplate(cookieItem)}`
    }, '');
    this.cookieItemsContainer.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>名称</th>
            <th>域名</th>
            <th>描述</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    `;
  }


}

window.onload = function() {
  new CookieSetting();
}
