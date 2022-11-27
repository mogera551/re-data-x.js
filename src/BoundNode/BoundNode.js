import { Component } from "../Component/WebComponent.js";
import FilterData from "../Filter/FilterData.js";
import NotifyData from "../Notify/NotifyData.js";
import ActiveProperty from "../ViewModel/ActiveProperty.js";
import NodeProperty from "./NodeProperty.js";
import "../types.js";

export default class BoundNode {
  /**
   * インデックス配列
   * @type {integer[]}
   */
  viewModelIndexes;
  /**
   * 親コンポーネント
   * @type {Component}
   */
  parentComponent;
  /**
   * ノード
   * @type {Node}
   */
  node;
  /**
   * ノードのプロパティとバインドしているViewModelのプロパティ
   * @type {Map<NodeProperty,ViewModelPropertyInfo>}
   */
  viewModelPropInfoByNodeProperty = new Map;
  /**
   * ViewModelのパスとバインドしているノードのプロパティリスト
   * @type {Map<string,NodeProperty[]>}
   */
  nodePropertiesByViewModelPath = new Map;

  /**
   * ViewModelProxy
   * @return {ViewModelProxy?}
   */
  get viewModelProxy() {
    return this.parentComponent?.viewModelProxy ?? null;
  }

  /**
   * ViewModel
   * @return {Object<string,any>}
   */
  get viewModel() {
    return this.parentComponent?.viewModel ?? null;
  }

  /**
   * コンストラクタ
   * @param {Node} node 
   * @param {Component} parentComponent 
   * @param {integer[]} viewModelIndexes 
   */
  constructor(node, parentComponent, viewModelIndexes) {
    this.node = node;
    this.parentComponent = parentComponent;
    this.viewModelIndexes = viewModelIndexes;
  }

  /**
   * プロパティのバインド
   * @param {string} nodePropName 
   * @param {string} viewModelPropName 
   * @param {FilterData[]} filters 
   * @return {{viewModelProperty:ActiveProperty,nodeProperty:NodeProperty,filters:FilterData[]}}
   */
  bindProperty(nodePropName, viewModelPropName, filters) {
    const viewModelProperty = ActiveProperty.create(viewModelPropName, this.viewModelIndexes);
    const nodeProperty = NodeProperty.create(nodePropName);

    this.viewModelPropInfoByNodeProperty.set(nodeProperty, {viewModelProperty, filters});
  
    const [propsByPath, path] = [this.nodePropertiesByViewModelPath, viewModelProperty.path];
    propsByPath.has(path) ? propsByPath.get(path).push(nodeProperty) : propsByPath.set(path, [nodeProperty]);

    return {viewModelProperty, nodeProperty, filters};
  }

  /**
   *
   * @param {NodeProperty} nodeProperty 
   * @param {ActiveProperty} viewModelProperty 
   * @param {FilterData[]} filters 
   */
  assignNodeValue(nodeProperty, viewModelProperty, filters) {
    // ノードに値を設定
    return Reflect.apply(nodeProperty.updateNodeFunc, this, [this.viewModelProxy, viewModelProperty, this.node, nodeProperty, filters]);
  }

  /**
   * バインド
   */
  bind() {
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
          // ノードに値を設定
          return this.assignNodeValue(nodeProperty, viewModelProperty, filters);
        });
      }
    }
  }

  /**
   * インデックス配列を変更する
   * @param {integer[]} viewModelIndexes 
   */
  changeViewModelIndexes(viewModelIndexes) {
    if (this.viewModelIndexes.toString() === viewModelIndexes.toString()) return;
    this.viewModelIndexes = viewModelIndexes;
    Array.from(this.viewModelPropInfoByNodeProperty.values()).forEach((info) => {
      const lastViewModelProperty = info.viewModelProperty;
      info.viewModelProperty = ActiveProperty.create(info.viewModelProperty.name, viewModelIndexes);
      const props = this.nodePropertiesByViewModelPath.get(lastViewModelProperty.path);
      this.nodePropertiesByViewModelPath.delete(lastViewModelProperty.path);
      this.nodePropertiesByViewModelPath.set(info.viewModelProperty.path, props);
    });
  }
  
  /**
   * 前回の値を元に更新する
   * @param {integer[]} viewModelIndexes 
   */
  reuseLastValue(viewModelIndexes) {
    this.changeViewModelIndexes(viewModelIndexes);
    for(const [viewModelPath, nodeProperties] of this.nodePropertiesByViewModelPath.entries()) {
      nodeProperties.forEach(nodeProperty => {
        const { viewModelProperty, filters } = this.viewModelPropInfoByNodeProperty.get(nodeProperty);
        this.assignNodeValue(nodeProperty, viewModelProperty, filters);
      });
    }
  }
}