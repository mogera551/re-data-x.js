import utils from "../utils.js";
import ParseFunc from "./ParseFunc.js";
import NodeSelector from "./NodeSelector.js";
import Thread from "../Thread/Thread.js";
import {Component} from "../Component/WebComponent.js";
import globalData from "../Globals/Globals.js";
import FilterData from "../Filter/FilterData.js";
import Proxy from "../ViewModel/Proxy.js";
import ActiveProperty from "../ViewModel/ActiveProperty.js";
import UpdateFunc from "./UpdateFunc.js";
import CheckPoint from "../CheckPoint/CheckPoint.js";
import NodeProperty from "./NodeProperty.js";

const setOfInputableTagName = new Set(["INPUT", "SELECT", "TEXTAREA", "OPTION"]);
const setOfCheckableTypeName = new Set(["radio", "checkbox"]);
/**
 * デフォルトプロパティの決定
 * @param {Node} node 
 * @returns {string}
 */
const getDefaultProp = node => {
  if (node instanceof HTMLElement) {
    const element = utils.toElement(node);
    return setOfInputableTagName.has(element.tagName) ? (setOfCheckableTypeName.has(element.type) ? "checked" : "value") : "textContent";
  } else {
    return "textContent";
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
   * @param {Set<NotifyData>} setOfNotification 
   * @param {Set<NotifyData>} setOfGlobalNotification 
   */
  update(setOfNotification, setOfGlobalNotification) {
    this.boundNodes.forEach(boundNode => boundNode.update(setOfNotification, setOfGlobalNotification));
  }

  /**
   * バインドノードのリストに対して、初期化を行う。
   */
  init() {
    this.boundNodes.forEach(boundNode => boundNode.init());
  }
}

/**
 * バインドしたノードに以下の機能を提供する。
 * ・data-bind属性をパースする。
 * ・templateの場合、templateの中身を展開する。
 * ・プロパティとViewModelのプロパティをバインドし情報を保持する。
 * ・イベントリスナのハンドラにViewModelのメソッドを登録する。
 * ・初期化処理
 * 　　デフォルトイベントの登録、イベント発生時デフォルトプロパティ値でViewModelのプロパティを更新する。
 * 　　イベントリスナの登録。
 * 　　初期値の反映。
 * 　　templateの場合、展開した子要素の初期化処理を行う。
 * ・更新処理
 * 　　更新通知を受けて、更新するプロパティにViewModelのプロパティ値で更新する。
 */
export default class BoundNode {
  /**
   * @type {Node}
   */
  node;
  /**
   * this.nodeをHTMLElementにキャスト
   * @type {HTMLElement}
   */
  get element() {
    return utils.toElement(this.node);
  }
  /**
   * this.nodeをHTMLTemplateElementにキャスト
   * @type {HTMLTemplateElement}
   */
  get template() {
    return utils.toTemplate(this.node);
  }
  /**
   * this.nodeをComponentにキャスト
   * @type {Component}
   */
  get component() {
    return (this.node instanceof Component) ? this.node : utils.raise(`node ${this.node} is not component`);
  }
  /**
   * @type {HTMLInputElement}
   */
  get input() {
    return utils.toInput(this.node);
  }
  /**
   * @type {Component}
   */
  parentComponent;
  /**
   * @type {Proxy}
   */
  viewModelProxy;
  /**
   * ループ元(template)となるHTML要素
   * @type {BoundNode}
   */
  loopNode;

  /**
   * 配列のインデックス、コンテキスト変数
   * @type {ineteger[]}
   */
  viewModelIndex;
  /**
   * @type {string}
   */
  defaultProperty;
  /**
   * @type {string}
   */
  defaultEvent = "click";

  /**
   * ViewModelとDOM要素のプロパティの対応
   * １：多はありうる、optionのvalueとtextContentに同じものを使うなど
   * 多：１はなし
   * @type {Map<string,ActiveProperty>}
   */
  viewModelPropByProp = new Map();
  /**
   * ViewModelのパスとDOM要素のプロパティ配列の対応
   * 更新通知で、ViewModelのパスから、DOM要素のプロパティを取得するために使う
   * @type {Map<string,string[]>}
   */
  propsByViewModelPath = new Map();
  /**
   * @type {Set<string>}
   */
  setOfNodeProps = new Set;

  /**
   * @type {ActiveProperty}
   */
  loopViewModelProp = null;
  /**
   * @type {LoopChild[]}
   */
  loopChildren = [];
  /**
   * @type {any}
   */
  loopValue;

  // ViewModelと要素のイベントの対応
  // １：１
  // Event
  /**
   * @type {Map<string,string>}
   */
  viewModelHandlerByEvent = new Map();

  /**
   * コンストラクタ
   * @param {Component} component 
   * @param {Node} node 
   * @param {BoundNode} loopNode 
   */
  constructor(component, node, loopNode) {
    this.parentComponent = component;
    this.node = node;
    this.loopNode = loopNode;
    this.viewModelProxy = component?.viewModelProxy ?? null;
    this.defaultProperty = getDefaultProp(node);
  }

  /**
   * ループの展開
   * @param {Map<any,LoopChild[]>} loopChildsByValue 前の状態
   */
  #expandLoop(loopChildsByValue = new Map()) {
    //console.time("BoundNode.expandLoop");
    const template = this.template;
    const loopNode = this;
    const viewModelProxy = this.viewModelProxy;
    const loopViewModelProp = this.loopViewModelProp;
    const loopChildren = this.loopChildren;
    const component = this.parentComponent;
    
    this.loopValue = ActiveProperty.getValue(viewModelProxy, loopViewModelProp);
    loopChildren.push(...Object.entries(this.loopValue).map(([key, value]) => {
      let child;
      const newIndexes = loopViewModelProp.definedProp.level === 0 ? [key] : loopViewModelProp.indexes.concat(key);
      if (loopChildsByValue.has(value)) {
        const childs = loopChildsByValue.get(value);
        child = childs.shift();
        child.root = document.createDocumentFragment();
        child.nodes.forEach(node => child.root.appendChild(node));
        childs.length === 0 && loopChildsByValue.delete(value);
        child.boundNodes.forEach(boundNode => boundNode.change(newIndexes));
        child.key = key;
      } else {
        child = new LoopChild;
        child.root = document.importNode(template.content, true); // See http://var.blog.jp/archives/76177033.html
        child.boundNodes = NodeSelector.select(component, child.root, template, loopNode, newIndexes);
        child.nodes = Array.from(child.root.childNodes);
        child.key = key;
        child.value = value;
        child.init();
      }
      return child;
    }));

    const fragment = document.createDocumentFragment();
    loopChildren.forEach(loopChild => fragment.appendChild(loopChild.root));
    template.after(fragment);
  }

  /**
   * ループの再展開
   */
  #reexpandLoop() {
    const loopValue = ActiveProperty.getValue(this.viewModelProxy, this.loopViewModelProp);
    // 前回の値を取得
    /**
     * @type {Map<any,LoopChild[]>}
     */
    const loopChildsByValue = new Map();
    if (loopValue.length > 0) {
      this.loopChildren.forEach(loopChild => 
        loopChildsByValue.has(loopChild.value) ? loopChildsByValue.get(loopChild.value).push(loopChild) : loopChildsByValue.set(loopChild.value, [loopChild])
      );
    }

    this.loopChildren.forEach(loopChild => loopChild.removeNodes());
    this.loopChildren = [];
    this.#expandLoop(loopChildsByValue);
  }

  /**
   * 親要素をクローンして入れ替えて、子要素を再展開して、最後に元に戻す
   * @param {Element} element 
   * @param {()=>{}} callback 
   */
  #offlineRender(element, callback) {
    const parentElement = element.parentElement;
    const clone = parentElement.cloneNode();
    parentElement.replaceWith(clone);
    try {
      callback();
    } finally {
      clone.replaceWith(parentElement);
    }
  }

  /**
   * ループのdata-bind属性のパース
   * @param {string} bindText 
   */
  #parseLoop(bindText) {
    const viewModelPropName = bindText.trim();
    this.loopViewModelProp = ActiveProperty.create(viewModelPropName, this.viewModelIndexes);
  }

  /**
   * プロパティをバインドする。
   * viewModelPropByProp、propsByViewModelPath、nodePropsへバインド情報を登録する。
   * @param {string} propName 
   * @param {string} viewModelPropName 
   * @param {integer[]} viewModelIndexes 
   * @param {FilterData[]} filters 
   * @param {Object<string,any>?} params
   */
  #bindProp(propName, viewModelPropName, viewModelIndexes, filters, params = {}) {
    const viewModelProp = ActiveProperty.create(viewModelPropName, viewModelIndexes);

    this.viewModelPropByProp.set(propName, {viewModelProp, filters});

    const [propByPath, path] = [this.propsByViewModelPath, viewModelProp.path];
    propByPath.has(path) ? propByPath.get(path).push(propName) : propByPath.set(path, [propName]);

    this.setOfNodeProps.add(propName);

    // 副作用
    // 自ノードがコンポーネントの場合、
    // 自ノード（コンポーネント）にバインドするプロパティを生成
    if (this.node instanceof Component) {
      const component = this.component;
      const viewModelProxy = this.viewModelProxy; // 親コンポーネントのViewModelProxyを指していることに注意
      if ("dialog" in component.dataset) {
        // ダイアログの場合、入力パラメータを参照
        Object.defineProperty(component.viewModel, propName, {
          get: () => Reflect.get(params, viewModelProp.name),
          set: value => Reflect.set(params, viewModelProp.name, value),
        });
      } else if (viewModelProxy) {
        // 親コンポーネントがある場合、親コンポーネントのプロパティを参照する
        component.viewModelProxy.$addImportProp(propName); // キャッシュしないようにする
        Object.defineProperty(component.viewModel, propName, {
          get: () => ActiveProperty.getValue(viewModelProxy, viewModelProp),
          set: value => ActiveProperty.setValue(viewModelProxy, viewModelProp, value),
        });
      } else {
        // 親コンポーネントがない場合、グローバルのプロパティを参照する
        Object.defineProperty(component.viewModel, propName, {
          get: () => Reflect.get(globalData, viewModelProp.name),
          set: value => Reflect.set(globalData, viewModelProp.name, value),
        });
      }
      Thread.current.notify(component, propName, []);

    } else {
      // 初期値を設定
      const {updateNodeFunc, paths} = NodeProperty.create(propName);
      Reflect.apply(updateNodeFunc, this, [this.viewModelProxy, viewModelProp, this.node, propName, paths, filters]);
    }
  }

  /**
   * data-bind属性の値をパースする
   * @param {string} bindText 
   */
  #parseProp(bindText) {
    ParseFunc.parseBinds(bindText ?? "", this.defaultProperty).forEach(([propName, viewModelPropName, filters]) => {
      if (propName[0] === "o" && propName[1] === "n") {
        this.viewModelHandlerByEvent.set(propName, viewModelPropName);
      } else {
        this.#bindProp(propName, viewModelPropName, this.viewModelIndexes, filters);
      }
    });
  }

  /**
   * @param {string} bindText 
   */
  #parseComment(bindText) {
    ParseFunc.parseBinds(bindText ?? "", this.defaultProperty).forEach(([propName, viewModelPropName, filters]) => {
      this.#bindProp(propName, viewModelPropName, this.viewModelIndexes, filters);
    });
  }

  /**
   * data-bind属性のパースを行う
   * TEMPLATEの場合、リストを展開する
   * そのためViewModelProxyの初期処理が終わって値が入っていること
   * @param {integer[]} viewModelIndexes 
   * @param {Object<string,any>?} params 入力情報、ダイアログの場合
   */
  parse(viewModelIndexes, params = {}) {
    this.viewModelIndexes = viewModelIndexes;
    if (this.node instanceof Comment) {
      // コメントノードをテキストノードに入れ替える
      // this.nodeを入れ替えるので注意
      const commentNode = this.node;
      const bindText = commentNode.textContent.slice(2);
      this.node = document.createTextNode("");
      commentNode.parentNode.replaceChild(this.node, commentNode);
      this.#parseComment(bindText);
    } else {
      const element = this.element;
      if (element instanceof HTMLTemplateElement) {
        if ("bind" in element.dataset) {
          this.#parseLoop(element.dataset["bind"]);
          this.#offlineRender(element, () => {
            this.#expandLoop();
          });
        }
      }
      else {
        if ("dialog" in element.dataset) {
          for(const propName of Object.keys(params)) {
            // 同じ名前でバインド
            this.#bindProp(propName, propName, this.viewModelIndexes, [], params);
          }
        } else if ("bind" in element.dataset) {
          this.#parseProp(element.dataset["bind"]);
        }
      }
    }
  }

  /**
   * ノード更新処理
   * ViewModelの値をノードへ反映する
   * @param {Object} viewModel ViewModel 
   * @param {string} viewModelProp ViewModelのプロパティ
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {FilterData[]} filters フィルターのリスト
   */
  #updateNode(viewModel, viewModelProp, node, nodeProp, filters) {
    if (node instanceof Component) {
      // コンポーネントの場合、更新通知を送る
      const thisComponent = node;
      Thread.current.notify(thisComponent, nodeProp, []);
    } else {
      const nodeProperty = NodeProperty.create(nodeProp);
      !nodeProperty && utils.raise(`unknown property ${nodeProp}`);
      return Reflect.apply(nodeProperty.updateNodeFunc, this, [viewModel, viewModelProp, node, nodeProp, nodeProperty.paths, filters]);
    }
  }

  /**
   * ViewModel更新処理
   * ノードの値をViewModelへ反映する
   * @param {Node} node 
   * @param {string} nodeProp 
   * @param {Object} viewModel 
   * @param {ActiveProperty} viewModelProp 
   * @param {Array<FilterData>} filters 
   */
  #updateViewModel(node, nodeProp, viewModel, viewModelProp, filters) {
    const nodeProperty = NodeProperty.create(nodeProp);
    !nodeProperty && utils.raise(`unknown property ${prop}`);
    return Reflect.apply(nodeProperty.updateViewModelFunc, this, [node, nodeProp, nodeProperty.paths, viewModel, viewModelProp, filters]);
  }

  /**
   * 初期化
   * 名前がよくない？
   * デフォルトのイベント処理設定
   * イベントハンドラを設定
   * 初期値を反映
   * ループ展開した子要素に対して初期化処理
   */
  init() {
    if (this.node instanceof Text) return;

    // デフォルトイベント
    // ※DOM側でイベントが発生したら、ViewModel側の更新を自動で行う
    // デフォルトのプロパティがバインドされていなければ、イベントの登録は行わない
    if (!this.viewModelHandlerByEvent.has("input")) {
      const property = this.setOfNodeProps.has("file") ? "file" : this.setOfNodeProps.has("radio") ? "radio" : this.setOfNodeProps.has("checkbox") ? "checkbox" : this.defaultProperty;
      if (property !== "textContent") {
        const { viewModelProp, filters } = this.viewModelPropByProp.get(property) ?? {};
        if (viewModelProp != null) {
          this.element.addEventListener("input", event => {
            event.stopPropagation();
            Thread.current.asyncProc(() => {
              return this.#updateViewModel(this.node, property, this.viewModelProxy, viewModelProp, filters);
            }, this, []);
          });
        }
      }
    }
    // イベントハンドラを設定
    for(const [eventOnName, viewModelHandler] of this.viewModelHandlerByEvent.entries()) {
      const eventName = eventOnName.slice(2); // "onclick" => "click"
      this.element.addEventListener(eventName, event => {
        event.stopPropagation();
        Thread.current.asyncProc(() => {
          return this.parentComponent.stackIndexes.push(this.viewModelIndexes, () => {
            return Reflect.apply(this.viewModelProxy[viewModelHandler], this.viewModelProxy, [ event, ...this.viewModelIndexes ]);
          });
        }, this, []);
      });
    }
    // ループで展開した子要素を初期化する
    this.loopChildren.forEach(loopChild => loopChild.init());
  }

  /**
   * 更新通知に従って更新する
   * @param {Set<NotifyData>} setOfNotification 
   * @param {Set<NotifyData>} setOfGlobalNotification 
   */
  update(setOfNotification, setOfGlobalNotification) {
    if (this.loopViewModelProp != null) {
      if (setOfNotification.has(this.loopViewModelProp.path)) {
        this.#offlineRender(this.element, () => {
          this.#reexpandLoop();
        });
      } else {
        this.loopChildren.forEach(loopChild => loopChild.update(setOfNotification, setOfGlobalNotification));
      }
    } else {
      for(const [viewModelPath, props] of this.propsByViewModelPath.entries()) {
        if (setOfNotification.has(viewModelPath) || setOfGlobalNotification.has(viewModelPath)) {
          props.forEach(prop => {
            const { viewModelProp, filters } = this.viewModelPropByProp.get(prop);
            this.#updateNode(this.viewModelProxy, viewModelProp, this.node, prop, filters);
          });
        }
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
    Array.from(this.viewModelPropByProp.values()).forEach((info) => {
      const lastViewModelProperty = info.viewModelProp;
      info.viewModelProp = ActiveProperty.create(info.viewModelProp.name, viewModelIndexes);
      const props = this.propsByViewModelPath.get(lastViewModelProperty.path);
      this.propsByViewModelPath.delete(lastViewModelProperty.path);
      this.propsByViewModelPath.set(info.viewModelProp.path, props);
    });
  }

  /**
   * 前回の値を元に更新する
   * @param {integer[]} viewModelIndexes 
   */
  change(viewModelIndexes) {
    this.changeViewModelIndexes(viewModelIndexes);
    if (this.loopViewModelProp != null) {
      this.#offlineRender(this.element, () => {
        this.#reexpandLoop();
      });
    } else {
      for(const [viewModelPath, props] of this.propsByViewModelPath.entries()) {
        props.forEach(prop => {
          const { viewModelProp, filters } = this.viewModelPropByProp.get(prop);
          this.#updateNode(this.viewModelProxy, viewModelProp, this.node, prop, filters);
        });
      }
    }
  }

  /**
   * バインドノードの生成
   * @param {Component} component 親コンポーネント
   * @param {Node} node 
   * @param {BoundNode} loopNode 
   * @returns {BoundNode}
   */
  static create(component, node, loopNode = null) {
    return new BoundNode(component, node, loopNode);
  }
}
