import { Component } from "../Component/WebComponent.js";
import utils from "../utils.js";
import ActiveProperty from "../ViewModel/ActiveProperty.js";
import BoundNode from "./BoundNode.js";
import globalData from "../Globals/Globals.js";
import Thread from "../Thread/Thread.js";
import ParseFunc from "./ParseFunc.js";

const DEFAULT_PROPERTY = "textContent";

export default class BoundComponent extends BoundNode {
  /**
   * このノードをコンポーネントとして扱う
   * @type {Component}
   */
  component;
  
  /**
   * 
   * @param {Node} node 
   * @param {Component} parentComponent 
   * @param {integer[]} viewModelIndexes 
   */
  constructor(node, parentComponent, viewModelIndexes) {
    super(node, parentComponent, viewModelIndexes);
    this.component = (this.node instanceof Component) ? this.node : utils.raise(`node ${this.node} is not Component`);
  }

  /**
   * バインド
   */
  bind(params = {}) {
    const isDialog = ("dialog" in this.component.dataset);
    const bindText = isDialog ? Object.keys(params).map(prop => `${prop}:${prop};`).join("") : (this.component.dataset["bind"] ?? "");
    ParseFunc.parseBinds(bindText, DEFAULT_PROPERTY).forEach(([propName, viewModelPropName, filters]) => {
      const {viewModelProperty} = this.bindProperty(propName, viewModelPropName, filters);

      if (isDialog) {
        // ダイアログの場合、入力パラメータを参照
        Object.defineProperty(this.component.viewModel, propName, {
          get: () => Reflect.get(params, viewModelProperty.name),
          set: value => Reflect.set(params, viewModelProperty.name, value),
        });
      } else if (this.viewModelProxy) {
        // 親コンポーネントがある場合、親コンポーネントのプロパティを参照する
        this.component.viewModelProxy.$addImportProp(propName); // キャッシュしないようにする
        Object.defineProperty(this.component.viewModel, propName, {
          get: () => ActiveProperty.getValue(this.viewModelProxy, viewModelProperty),
          set: value => ActiveProperty.setValue(this.viewModelProxy, viewModelProperty, value),
        });
      } else {
        // 親コンポーネントがない場合、グローバルのプロパティを参照する
        Object.defineProperty(this.component.viewModel, propName, {
          get: () => Reflect.get(globalData, viewModelProperty.name),
          set: value => Reflect.set(globalData, viewModelProperty.name, value),
        });
      }
      Thread.current.notify(this.component, propName, []);
    });
  }

  /**
   * 変更通知をノードに値を反映
   * @param {Set<NotifyData>} notifications
   * @param {Set<NotifyData>} globalNotifications 
   */
  updateForNotify(notifications, globalNotifications) {
    for(const [viewModelPath, nodeProperties] of this.nodePropertiesByViewModelPath.entries()) {
      if (notifications.has(viewModelPath) || globalNotifications.has(viewModelPath)) {
        nodeProperties.forEach(nodeProperty => {
          const { viewModelProperty, filters } = this.viewModelPropInfoByNodeProperty.get(nodeProperty);
          // 更新通知を送る
          Thread.current.notify(this.component, nodeProperty.name, []);
        });
      }
    }
  }

}
