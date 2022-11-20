import utils from "../utils.js";
import ParseFunc from "./ParseFunc.js";
import NodeSelector from "./NodeSelector.js";
import Thread from "../Thread/Thread.js";
import {Component} from "../Component/WebComponent.js";
import globalData from "../Globals/Globals.js";
import Filter from "../Filter/Filter.js";
import FilterData from "../Filter/FilterData.js";
import Proxy from "../ViewModel/Proxy.js";
import FileReaderEx from "./FileReaderEx.js";
import ActiveProperty from "../ViewModel/ActiveProperty.js";

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
   * 親ノードからノードを削除
   */
  removeNodes() {
    this.nodes.forEach(node => node.parentNode.removeChild(node));
    this.nodes.splice(0);
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
   * @type {HTMLElement}
   */
  get element() {
    return utils.toElement(this.node);
  }
  /**
   * @type {HTMLTemplateElement}
   */
  get template() {
    return utils.toTemplate(this.node);
  }
  /**
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
   * @typedef {(viewModel:{},viewModelProp:string,node:Node,prop:string,paths:string[],filters:FilterData[])=>{}} UpdateNodeFunc
   */
  /**
   * @typedef {(node:Node,prop:string,paths:string[],viewModel:{},viewModelProp:string,filters:FilterData[])=>{}} UpdateViewModelFunc
   */
    /**
   * @type {Map<string,{updateNodeFunc:UpdateNodeFunc,updateViewModelFunc:UpdateViewModelFunc,paths:string[]}>}
   */
  pathsByProp = new Map();

  /**
   * @type {ActiveProperty}
   */
  loopViewModelProp = null;
  /**
   * @type {LoopChild[]}
   */
  loopChildren = [];

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
   */
  #expandLoop() {
    const template = this.template;
    const loopNode = this;
    const viewModelProxy = this.viewModelProxy;
    const loopViewModelProp = this.loopViewModelProp;
    const loopChildren = this.loopChildren;
    const component = this.parentComponent;
    const fragment = document.createDocumentFragment();
    
    const viewModelValue = ActiveProperty.getValue(viewModelProxy, loopViewModelProp);
    for(const [key, value] of Object.entries(viewModelValue)) {
      const child = new LoopChild;
      const newIndexes = loopViewModelProp.definedProp.level === 0 ? [key] : loopViewModelProp.indexes.concat(key);
      const childRoot = document.importNode(template.content, true); // See http://var.blog.jp/archives/76177033.html
      const boundNodes = NodeSelector.select(component, childRoot, template, loopNode, newIndexes);
      loopChildren.push(child);
      child.boundNodes.push(...Array.from(boundNodes));
      child.nodes.push(...Array.from(childRoot.childNodes));
      child.value = value;
      fragment.appendChild(childRoot);
    }
    template.after(fragment);
  }

  /**
   * ループの再展開
   */
  #reexpandLoop() {
    this.loopChildren.forEach(loopChild => loopChild.removeNodes());
    this.loopChildren = [];
    this.#expandLoop();
    for(const loopChild of this.loopChildren) {
      loopChild.init();
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
   * viewModelPropByProp、propsByViewModelPath、pathsByPropへバインド情報を登録する。
   * @param {string} propName 
   * @param {string} viewModelPropName 
   * @param {integer[]} viewModelIndexes 
   * @param {FilterData[]} filters 
   * @param {Object<string,any>?} params
   */
  #bindProp(propName, viewModelPropName, viewModelIndexes, filters, params = {}) {
    const viewModelPropByProp = this.viewModelPropByProp;
    const propsByViewModelPath = this.propsByViewModelPath;
    const pathsByProp = this.pathsByProp;
    const viewModelProp = ActiveProperty.create(viewModelPropName, viewModelIndexes);
    viewModelPropByProp.set(propName, {viewModelProp, filters});
    const props = propsByViewModelPath.get(viewModelProp.path);
    props ? props.push(propName) : propsByViewModelPath.set(viewModelProp.path, [propName]);
    if (!pathsByProp.has(propName)) {
      const paths = propName.split(".");
      let [ updateNodeFunc, updateViewModelFunc ] = [null, null];
      if (paths.length === 2 && paths[0] === "class") {
        [ updateNodeFunc, updateViewModelFunc ] = [ this.#updateNodeClass, this.#updateViewModelClass ];
      } else if (propName === "radio") {
        [ updateNodeFunc, updateViewModelFunc ] = [ this.#updateNodeRadio, this.#updateViewModelRadio ];
      } else if (propName === "checkbox") {
        [ updateNodeFunc, updateViewModelFunc ] = [ this.#updateNodeCheckbox, this.#updateViewModelCheckbox ];
      } else if (propName === "file") {
        [ updateNodeFunc, updateViewModelFunc ] = [ this.#updateNodeFile, this.#updateViewModelFile ];
      } else if (paths.length === 1) {
        [ updateNodeFunc, updateViewModelFunc ] = [ this.#updateNode1, this.#updateViewModel1 ];
      } else if (paths.length === 2) {
        [ updateNodeFunc, updateViewModelFunc ] = [ this.#updateNode2, this.#updateViewModel2 ];
      } else {
        console.error(`unknown property name ${propName}`);
      }
      pathsByProp.set(propName, {
        updateNodeFunc,
        updateViewModelFunc,
        paths
      })

    }

    // 自ノードがコンポーネントの場合、
    // 自ノード（コンポーネント）にバインドするプロパティを生成
    if (this.node instanceof Component) {
      const component = this.component;
      const viewModelProxy = this.viewModelProxy; // 親コンポーネントのViewModelProxyを指していることに注意
      if ("dialog" in component.dataset) {
        // ダイアログの場合、入力パラメータを参照
        Object.defineProperty(component.viewModel, propName, {
          get: () => Reflect.get(params, viewModelProp.prop),
          set: value => Reflect.set(params, viewModelProp.prop, value),
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
          get: () => Reflect.get(globalData, viewModelProp.prop),
          set: value => Reflect.set(globalData, viewModelProp.prop, value),
        });
      }
    }
  }

  /**
   * data-bind属性の値をパースする
   * @param {string} bindText 
   */
  #parseProp(bindText) {
    const viewModelIndexes = this.viewModelIndexes;
    const viewModelHandlerByEvent = this.viewModelHandlerByEvent;
    ParseFunc.parseBinds(bindText ?? "", this.defaultProperty).forEach(([propName, viewModelPropName, filters]) => {
      if (propName.startsWith("on")) {
        viewModelHandlerByEvent.set(propName, viewModelPropName);
      } else {
        this.#bindProp(propName, viewModelPropName, viewModelIndexes, filters);
      }
    });
  }

  /**
   * @param {string} bindText 
   */
  #parseComment(bindText) {
    const viewModelIndexes = this.viewModelIndexes;
    ParseFunc.parseBinds(bindText ?? "", this.defaultProperty).forEach(([propName, viewModelPropName, filters]) => {
      this.#bindProp(propName, viewModelPropName, viewModelIndexes, filters);
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
    const node = this.node;
    if (node instanceof Comment) {
      this.#parseComment(node.textContent.slice(2));
      const newNode = document.createTextNode("");
      const parentNode = node.parentNode;
      parentNode.replaceChild(newNode, node);
      this.node = newNode;
    } else {
      const element = this.element;
      if (element instanceof HTMLTemplateElement) {
        if ("bind" in element.dataset) {
          this.#parseLoop(element.dataset["bind"]);
          this.#expandLoop();
        }
      }
      else {
        if ("dialog" in element.dataset) {
          for(const propName of Object.keys(params)) {
            const viewModelPropName = propName;
            this.#bindProp(propName, viewModelPropName, viewModelIndexes, [], params);
          }
        } else if ("bind" in element.dataset) {
          this.#parseProp(element.dataset["bind"]);
        }
      }
    }
  }

  /**
   * ノードプロパティが１階層の場合のノード更新処理
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {FilterData[]} filters フィルターのリスト
   */
  #updateNode1(viewModel, viewModelProp, node, nodeProp, paths, filters) {
    const value = Filter.applyForOutput(ActiveProperty.getValue(viewModel, viewModelProp), filters);
    Thread.current.updateNode(node, [nodeProp], () => {
      node[nodeProp] = value;
    });
  }

  /**
   * ノードプロパティが２階層の場合のノード更新処理
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {FilterData[]} filters フィルターのリスト
   */
  #updateNode2(viewModel, viewModelProp, node, nodeProp, paths, filters) {
    const value = Filter.applyForOutput(ActiveProperty.getValue(viewModel, viewModelProp), filters);
    Thread.current.updateNode(node, paths, () => {
      node[paths[0]][paths[1]] = value;
    });
  }

  /**
   * ノードプロパティがクラス指定の場合のノード更新処理
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {FilterData[]} filters フィルターのリスト
   */
  #updateNodeClass(viewModel, viewModelProp, node, nodeProp, paths, filters) {
    const element = utils.toElement(node);
    const value = Filter.applyForOutput(ActiveProperty.getValue(viewModel, viewModelProp), filters);
    Thread.current.updateNode(node, ["classList"], () => {
      value ? element.classList.add(paths[1]) : element.classList.remove(paths[1]);
    });
  }

  /**
   * ノードプロパティがラジオの場合のノード更新処理
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {FilterData[]} filters フィルターのリスト
   */
  #updateNodeRadio(viewModel, viewModelProp, node, nodeProp, paths, filters) {
    const element = utils.toElement(node);
    const value = Filter.applyForOutput(ActiveProperty.getValue(viewModel, viewModelProp), filters);
    Thread.current.updateNode(node, ["checked"], () => {
      element.checked = element.value == value;
    });
  }

  /**
   * ノードプロパティがチェックボックスの場合のノード更新処理
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {FilterData[]} filters フィルターのリスト
   */
  #updateNodeCheckbox(viewModel, viewModelProp, node, nodeProp, paths, filters) {
    const element = utils.toElement(node);
    const values = Filter.applyForOutput(ActiveProperty.getValue(viewModel, viewModelProp), filters);
    Thread.current.updateNode(node, ["checked"], () => {
      element.checked = values.find(value => value == element.value) ? true : false;
    });
  }

  /**
   * ノードプロパティがファイルの場合のノード更新処理
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {FilterData[]} filters フィルターのリスト
   */
  #updateNodeFile(viewModel, viewModelProp, node, nodeProp, paths, filters) {

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
    if (this.node instanceof Component) {
      const thisComponent = this.node;
      Thread.current.notify(thisComponent, nodeProp, []);
    } else {
      const { paths, updateNodeFunc } = this.pathsByProp.get(nodeProp);
      !updateNodeFunc && utils.raise(`unknown property ${nodeProp}`);
      return Reflect.apply(updateNodeFunc, this, [viewModel, viewModelProp, node, nodeProp, paths, filters]);
    }
  }

  /**
   * ノードプロパティが１階層の場合のViewModel更新処理
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {FilterData[]} filters フィルターのリスト
   */
  #updateViewModel1(node, nodeProp, paths, viewModel, viewModelProp, filters) {
    ActiveProperty.setValue(viewModel, viewModelProp, Filter.applyForInput(node[nodeProp], filters));
  }

  /**
   * ノードプロパティが２階層の場合のViewModel更新処理
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {FilterData[]} filters フィルターのリスト
   */
  #updateViewModel2(node, nodeProp, paths, viewModel, viewModelProp, filters) {
    ActiveProperty.setValue(viewModel, viewModelProp, Filter.applyForInput(node[paths[0]][paths[1]], filters));
  }

  /**
   * ノードプロパティがクラス指定の場合のViewModel更新処理
   * DOM側から更新されることはないので、何もしない
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {FilterData[]} filters フィルターのリスト
   */
  #updateViewModelClass(node, nodeProp, paths, viewModel, viewModelProp, filters) {
    //
  }

  /**
   * ノードプロパティがラジオの場合のViewModel更新処理
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {FilterData[]} filters フィルターのリスト
   */
  #updateViewModelRadio(node, nodeProp, paths, viewModel, viewModelProp, filters) {
    const element = utils.toElement(node);
    element.checked && ActiveProperty.setValue(viewModel, viewModelProp, Filter.applyForInput(element.value, filters));
  }

  /**
   * ノードプロパティがチェックボックスの場合のViewModel更新処理
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {FilterData[]} filters フィルターのリスト
   */
  #updateViewModelCheckbox(node, nodeProp, paths, viewModel, viewModelProp, filters) {
    const element = utils.toElement(node);
    const values = ActiveProperty.getValue(viewModel, viewModelProp);
    const value = Filter.applyForInput(element.value, filters);
    if (element.checked) {
      values.push(value);
    } else {
      const index = values.findIndex(v => v == value);
      (index >= 0) && values.splice(index, 1);
    } 
  }

  /**
   * ノードプロパティがファイルの場合のViewModel更新処理
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {FilterData[]} filters フィルターのリスト
   */
  async #updateViewModelFile(node, nodeProp, paths, viewModel, viewModelProp, filters) {
    const input = utils.toInput(node);
    if (input.files.length == 0) return;
    const reader = new FileReaderEx();
    const data = await reader.readAsText(input.files[0]);
    const value = Filter.applyForInput(data, filters);
    ActiveProperty.setValue(viewModel, viewModelProp, value);
  }

  /**
   * ViewModel更新処理
   * ノードの値をViewModelへ反映する
   * @param {Node} node 
   * @param {string} prop 
   * @param {Object} viewModel 
   * @param {ActiveProperty} viewModelProp 
   * @param {Array<FilterData>} filters 
   */
  #updateViewModel(node, prop, viewModel, viewModelProp, filters) {
    const { paths, updateViewModelFunc } = this.pathsByProp.get(prop);
    !updateViewModelFunc && utils.raise(`unknown property ${prop}`);
    return Reflect.apply(updateViewModelFunc, this, [node, prop, paths, viewModel, viewModelProp, filters]);
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
    const component = this.parentComponent;
    const node = this.node;
    const viewModelProxy = this.viewModelProxy;
    const viewModelIndexes = this.viewModelIndexes;
    const defaultProperty = this.defaultProperty;
    const pathsByProp = this.pathsByProp;
    if (node instanceof Text) {
      // Textノードの場合
      // 初期値を反映
      for(const [prop, { viewModelProp, filters }] of this.viewModelPropByProp.entries()) {
        this.#updateNode(viewModelProxy, viewModelProp, node, prop, filters);
      }
      return;
    }

    const element = this.element;
    // デフォルトイベント
    // ※DOM側でイベントが発生したら、ViewModel側の更新を自動で行う
    // デフォルトのプロパティがバインドされていなければ、イベントの登録は行わない
    if (!this.viewModelHandlerByEvent.has("input")) {
      const property = pathsByProp.has("file") ? "file" : pathsByProp.has("radio") ? "radio" : pathsByProp.has("checkbox") ? "checkbox" : defaultProperty;
      const { viewModelProp, filters } = this.viewModelPropByProp.get(property) ?? {};
      if (viewModelProp != null) {
        element.addEventListener("input", event => {
          event.stopPropagation();
          Thread.current.asyncProc(() => {
            return this.#updateViewModel(node, property, viewModelProxy, viewModelProp, filters);
          }, this, []);
        });
      }
    }
    // イベントハンドラを設定
    for(const [eventOnName, viewModelHandler] of this.viewModelHandlerByEvent.entries()) {
      const eventName = eventOnName.slice(2); // "onclick" => "click"
      element.addEventListener(eventName, event => {
        event.stopPropagation();
        Thread.current.asyncProc(() => {
          return component.stackIndexes.push(viewModelIndexes, () => {
            return Reflect.apply(viewModelProxy[viewModelHandler], viewModelProxy, [ event, ...viewModelIndexes ]);
          });
        }, this, []);
      });
    }
    // 初期値を反映
    for(const [prop, { viewModelProp, filters }] of this.viewModelPropByProp.entries()) {
      this.#updateNode(viewModelProxy, viewModelProp, node, prop, filters);
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
    //console.log(`update ${this.node.tagName}`);
    if (this.loopViewModelProp != null) {
      if (setOfNotification.has(this.loopViewModelProp.path)) {
        this.#reexpandLoop();
      } else {
        this.loopChildren.forEach(loopChild => loopChild.update(setOfNotification, setOfGlobalNotification));
      }
    } else {
      const node = this.node;
      const viewModelProxy = this.viewModelProxy;
      for(const [viewModelPath, props] of this.propsByViewModelPath.entries()) {
        if (setOfNotification.has(viewModelPath) || setOfGlobalNotification.has(viewModelPath)) {
          props.forEach(prop => {
            const { viewModelProp, filters } = this.viewModelPropByProp.get(prop);
            this.#updateNode(viewModelProxy, viewModelProp, node, prop, filters);
          });
        }
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
