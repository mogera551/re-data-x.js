import Thread from "../Thread/Thread.js";
import utils from "../utils.js";
import BoundNode from "./BoundNode.js";
import NodeProperty from "./NodeProperty.js";
import ParseFunc from "./ParseFunc.js";

export default class BoundElement extends BoundNode {
  /**
   * このノードをHTMLElementとして扱う
   * @type {HTMLElement}
   */
  element;

  /**
   * @type {string}
   */
  defaultProperty;

  /**
   * 
   * @param {Node} node 
   * @param {Component} parentComponent 
   * @param {integer[]} viewModelIndexes 
   */
  constructor(node, parentComponent, viewModelIndexes) {
    super(node, parentComponent, viewModelIndexes);
    this.element = utils.toElement(this.node);
    if (this.element instanceof HTMLSelectElement || this.element instanceof HTMLTextAreaElement || this.element instanceof HTMLOptionElement) {
      this.defaultProperty = "value";
    } else if (this.element instanceof HTMLInputElement) {
      this.defaultProperty = (this.element.type === "radio" || this.element.type === "checkbox") ? "checked" : "value";
    } else {
      this.defaultProperty = "textContent";
    }
  }

  /**
   * 
   */
  bind() {
    const bindText = this.element.dataset["bind"] ?? "";
    let defaultNodeProperty = null;
    const isSetInputEvent  = ParseFunc.parseBinds(bindText, this.defaultProperty).map(([propName, viewModelPropName, filters]) => {
      if (propName.startsWith("on")) {
        this.bindEventHandler(propName, viewModelPropName);
      } else {
        const {nodeProperty, viewModelProperty} = this.bindProperty(propName, viewModelPropName, filters);
        (propName === "radio" || propName === "checkbox" || propName === "file" || this.defaultProperty === propName)
         && (defaultNodeProperty = nodeProperty);
        this.assignNodeValue(nodeProperty, viewModelProperty, filters);
      }
      return (propName === "oninput");
    }).filter(v => v).length > 0;

    // デフォルトイベントの設定
    if (!isSetInputEvent && this.defaultProperty !== "textContent" && defaultNodeProperty != null) {
      const nodeProperty = defaultNodeProperty;
      if (this.viewModelPropInfoByNodeProperty.has(nodeProperty)) {
        this.element.addEventListener("input", event => {
          event.stopPropagation();
          Thread.current.asyncProc(() => {
            const {viewModelProperty, filters} = this.viewModelPropInfoByNodeProperty.get(nodeProperty);
            return Reflect.apply(nodeProperty.updateViewModelFunc, this, [this.node, nodeProperty, this.viewModelProxy, viewModelProperty, filters]);
          }, this, []);
        });
      }
    }
  }

  /**
   * 
   * @param {string} propName 
   * @param {string} viewModelPropName 
   */
  bindEventHandler(propName, viewModelPropName) {
    const eventName = propName.slice(2); // "onclick" => "click"
    this.element.addEventListener(eventName, event => {
      event.stopPropagation();
      Thread.current.asyncProc(() => {
        return this.parentComponent.stackIndexes.push(this.viewModelIndexes, () => {
          return Reflect.apply(this.viewModelProxy[viewModelPropName], this.viewModelProxy, [ event, ...this.viewModelIndexes ]);
        });
      }, this, []);
    });

  }



}