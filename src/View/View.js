import {Component} from "../Component/WebComponent.js";
import Binder from "../BoundNode/Binder.js";

export default class View {
  /**
   * @type {Component}
   */
  component;

  /**
   * コンストラクタ
   * @param {Component} component 
   */
  constructor(component) {
    this.component = component;
  }

  /**
   * レンダリング
   * パースしバインド情報を生成、初期化（子要素へ値を反映）
   * templateのクローンは、importNodeで行う
   * @param {Component?} component 
   * @param {Binder?} binder 
   * @param {HTMLTemplateElement?} template 
   * @param {ShadowRoot?} rootElement 
   */
  render(component = this.component, binder = component.binder, template = component.template, rootElement = component.shadowRoot ?? component) {
    const clone = document.importNode(template.content, true); // See http://var.blog.jp/archives/76177033.html
    binder.bind(clone);
    //binder.init();
    rootElement.appendChild(clone);
  }

}