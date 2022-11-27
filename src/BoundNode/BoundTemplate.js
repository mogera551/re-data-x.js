import NotifyData from "../Notify/NotifyData.js";
import utils from "../utils.js";
import BoundNode from "./BoundNode.js";
import ActiveProperty from "../ViewModel/ActiveProperty.js"
import NodeSelector from "./NodeSelector.js";

/**
 * 親要素をクローンして入れ替えて、子要素を再展開して、最後に元に戻す
 * @param {Element} element 
 * @param {()=>{}} callback 
 */
function offlineRender(element, callback) {
  const parentElement = element.parentElement;
  if (parentElement) {
    const clone = parentElement.cloneNode();
    parentElement.replaceWith(clone);
    try {
      callback();
    } finally {
      clone.replaceWith(parentElement);
    }
  } else {
    callback();
  }
}

/**
 * TEMPLATEでループを展開した子ノードの情報
 */
class LoopChild {
  /**
   * 生成したトップノードのリスト
   * @type {Node[]}
   */
  nodes = [];
  /**
   * 対応するViewModelのプロパティ値
   * @type {any}
   */
  value;
  /**
   * バインドノードのリスト
   * @type {BoundNode[]}
   */
  boundNodes = [];
  /**
   * @type {DocumentFragment}
   */
  root;
  /**
   * @type {integer}
   */
  key;

  /**
   * 親ノードからノードを削除
   */
  removeNodes() {
    this.nodes.forEach(node => node.parentNode && node.parentNode.removeChild(node));
    //this.nodes.splice(0);
  }
  
  /**
   * バインドノードのリストに対して、更新処理を行う
   * 更新処理は、コンポーネントのViewModelの更新した内容をノードへ反映する
   * @param {Set<NotifyData>} notifications 
   * @param {Set<NotifyData>} globalNotifications 
   */
  updateForNotify(notifications, globalNotifications) {
    this.boundNodes.forEach(boundNode => boundNode.updateForNotify(notifications, globalNotifications));
  }

}

export default class BoundTemplate extends BoundNode {
  /**
   * @type {HTMLTemplateElement}
   */
  template;
  /**
   * 
   * @param {Node} node 
   * @param {Component} parentComponent 
   * @param {integer[]} viewModelIndexes 
   */
  constructor(node, parentComponent, viewModelIndexes) {
    super(node, parentComponent, viewModelIndexes);
    this.template = utils.toTemplate(this.node);
  }

  /**
   * @type {ActiveProperty}
   */
  viewModelProperty;

  /**
   * @type {LoopChild[]}
   */
  loopChildren = [];

  /**
   * ループの展開
   * @param {any} loopValue
   * @param {Map<any,LoopChild[]>} loopChildsByLastValue 前の状態
   */
  expandLoop(loopValue, loopChildsByLastValue = new Map()) {
    this.loopChildren.push(...Object.entries(loopValue).map(([key, value]) => {
      let child;
      const newIndexes = this.viewModelProperty.definedProp.level === 0 ? [key] : this.viewModelProperty.indexes.concat(key);
      if (loopChildsByLastValue.has(value)) {
        // 前回の値を再利用
        const childs = loopChildsByLastValue.get(value);
        child = childs.shift();
        child.root = document.createDocumentFragment();
        child.nodes.forEach(node => child.root.appendChild(node));
        childs.length === 0 && loopChildsByLastValue.delete(value);
        child.boundNodes.forEach(boundNode => boundNode.reuseLastValue(newIndexes));
        child.key = key;
      } else {
        child = new LoopChild;
        child.root = document.importNode(this.template.content, true); // See http://var.blog.jp/archives/76177033.html
        child.boundNodes = NodeSelector.select(this.parentComponent, child.root, this.template, newIndexes);
        child.nodes = Array.from(child.root.childNodes);
        child.key = key;
        child.value = value;
      }
      return child;
    }));

    const fragment = document.createDocumentFragment();
    this.loopChildren.forEach(loopChild => fragment.appendChild(loopChild.root));
    this.template.after(fragment);
  }

  /**
   * ループの再展開
   */
  reexpandLoop() {
    const loopValue = ActiveProperty.getValue(this.viewModelProxy, this.viewModelProperty);
    // 前回の値を取得
    /**
     * @type {Map<any,LoopChild[]>}
     */
    const loopChildsByLastValue = new Map();
    if (loopValue.length > 0) {
      this.loopChildren.forEach(loopChild => 
        loopChildsByLastValue.has(loopChild.value) ? loopChildsByLastValue.get(loopChild.value).push(loopChild) : loopChildsByLastValue.set(loopChild.value, [loopChild])
      );
    }

    this.loopChildren.forEach(loopChild => loopChild.removeNodes());
    this.loopChildren = [];
    this.expandLoop(loopValue, loopChildsByLastValue);
  }

  /**
   * 
   */
  bind() {
    const bindText = this.template.dataset["bind"] ?? "";
    this.viewModelProperty = ActiveProperty.create(bindText, this.viewModelIndexes);
    const loopValue = ActiveProperty.getValue(this.viewModelProxy, this.viewModelProperty);
    offlineRender(this.template, () => {
      this.expandLoop(loopValue);
    });
  }

  /**
   * @param {Set<NotifyData>} notifications
   * @param {Set<NotifyData>} globalNotifications 
   */
  updateForNotify(notifications, globalNotifications) {
    if (notifications.has(this.viewModelProperty.path)) {
      offlineRender(this.template, () => {
        this.reexpandLoop();
      });
    } else {
      this.loopChildren.forEach(loopChild => loopChild.updateForNotify(notifications, globalNotifications));      
    }
  }

  /**
   * 前回の値を元に更新する
   * @param {integer[]} viewModelIndexes 
   */
  reuseLastValue(viewModelIndexes) {
    this.changeViewModelIndexes(viewModelIndexes);
    offlineRender(this.template, () => {
      this.reexpandLoop();
    });
  }

}