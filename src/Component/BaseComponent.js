import ViewModelProxy from "../ViewModel/Proxy.js";
import View from "../View/View.js";
import DialogView from "../View/DialogView.js";
import Binder from "../BoundNode/Binder.js";
import Stack from "./Stack.js";
import Thread from "../Thread/Thread.js";
import DefinedProperty from "../ViewModel/DefinedProperty.js";
import ActiveProperty from "../ViewModel/ActiveProperty.js";
import ActiveProperties from "../ViewModel/ActiveProperties.js";
import BoundComponent from "../BoundNode/BoundComponent.js";
import BoundNode from "../BoundNode/BoundNode.js";

/**
 * Componentのベース、HTMLElementを拡張します。
 * 以下の機能を付加する。
 * シャドウルート、View、ViewModel、ViewModelProxyを生成する。
 * binder、stackを生成する。
 * connectedCallback時、
 * 親コンポーネントの初期化完了後、
 * ViewModelの初期化を行い、Viewのレンダリングを実行する。
 */
export default class BaseComponent extends HTMLElement {
  /**
   * @type {BaseComponent}
   */
  #parentComponent;
  /**
   * @type {Promise}
   */
  #initializePromise;
  /**
   * @type {function}
   */
  #initializeResolve;
  /**
   * @type {function}
   */
  #initializeReject;
  #isInitializing;
 
  #resolveForDialog;
  #rejectForDialog;
  #componentForDialog;
  #paramsForDialog;

  /**
   * @type {HTMLTemplateElement}
   */
  template;
  /**
   * @type {Object}
   */
  viewModel;
  /**
   * @type {Proxy}
   */
  viewModelProxy;
  /**
   * @type {View}
   */
  view;
  /**
   * @type {Binder}
   */
  binder;
  /**
   * @type {integer[]}
   */
  stackIndexes;
  /**
   * @type {ActiveProperties}
   */
  activeProperties;
  /**
   * @type {DefinedProperty[]}
   */
  definedProperties;
  /**
   * @type {Map<string,DefinedProperty>}
   */
  definedPropertyByName;
 
  /**
   * コンストラクタ
   */
  constructor() {
    super();
    this.#isInitializing = true;
    this.#initializePromise = new Promise((resolve, reject) => {
      this.#initializeResolve = resolve;
      this.#initializeReject = reject;
    });
  }

  /**
   * Viewオブジェクトの生成
   * @returns {View}
   */
  createView() {
    return ("dialog" in this.dataset) ? new DialogView(this) : new View(this);
  }

  /**
   * 構築
   * shadowルートの作成
   * 各種オブジェクト生成
   * ViewModelProxyの生成
   * @param {ComponentData} componentData 
   */
  build(componentData) {
    this.withoutShadowRoot || this.attachShadow({mode: 'open'});
    this.template = componentData.template;
    this.viewModel = Reflect.construct(componentData.ViewModel, []);
    this.viewModelProxy = ViewModelProxy.create(this);
    this.view = this.createView();
    this.binder = new Binder(this);
    this.stackIndexes = new Stack();
    this.definedProperties = this.viewModelProxy.$definedProperties;
    this.definedPropertyByName = new Map(this.definedProperties.map(prop => [prop.name, prop]))
    this.activeProperties = new ActiveProperties(this.viewModelProxy.$definedProperties);
    this.updateActiveProperty(); 
  }
  
  /**
   * 親コンポーネント
   * @type {BaseComponent}
   */
  get parentComponent() {
    if (typeof this.#parentComponent === "undefined") {
      let node = this;
      do {
        node = node.parentNode;
        if (node == null) break;
        if (node instanceof ShadowRoot) {
          node = node.host;
          break;
        }
        if (node instanceof BaseComponent) break;
      } while(true);
      this.#parentComponent = node;
    }
    return this.#parentComponent;
  }
  set parentComponent(component) {
    this.#parentComponent = component;
  }

  /**
   * shadowRootを使ってカプセル化をしない(true)
   * @type {boolean}
   */
  get withoutShadowRoot() {
    return this.hasAttribute("without-shadowroot");
  }

  set withoutShadowRoot(value) {
    if (value) {
      this.setAttribute("without-shadowroot", "");
    } else {
      this.removeAttribute("without-shadowroot");
    }
  }

  /**
   * 初期化用プロミス
   * 子コンポーネントは親コンポーネントの初期化用プロミスをwaitする
   * @type {Promise}
   */
  get initializePromise() {
    return this.#initializePromise;
  }
  get isInitializing() {
    return this.#isInitializing;
  }
  /**
   * ダイアログ情報をセット
   * ダイアログをオープンしたコンポーネントがこの情報を持つ
   * @param {Component} component ダイアログをオープンしたコンポーネント
   * @param {(returnValue:any)=>{}} resolve 正常終了のためのresolve
   * @param {()=>{}} reject キャンセルのためのreject
   * @param {Object<string,any>} params 入力情報
   */
  setDialogInfo(component, resolve, reject, params) {
    this.#componentForDialog = component;
    this.#resolveForDialog = resolve;
    this.#rejectForDialog = reject;
    this.#paramsForDialog = params;
  }
  get resolveForDialog() {
    return this.#resolveForDialog;
  }
  get rejectForDialog() {
    return this.#rejectForDialog;
  }
  get paramsForDialog() {
    return this.#paramsForDialog;
  }
  get componentForDialog() {
    return this.#componentForDialog;
  }
  
  /**
   * ダイアログ正常終了
   * @param {Any} data 戻りデータ
   */
  closeDialog(data) {
    this.resolveForDialog(data);
  }

  /**
   * ダイアログキャンセル終了
   */
  cancelDialog() {
    this.rejectForDialog();
  }

  /**
   * ダイアログコンポーネント初期処理
   * このコンポーネントのBoundNodeを生成し
   * viewのレンダリングを行う
   */
  async dialogComponentInit() {
    Thread.current.asyncProc(async () => {
      const boundNode = new BoundComponent(this, this.componentForDialog);
      boundNode.bind(this.paramsForDialog);
      await this.viewModelProxy.$init();
      this.updateActiveProperty();
      this.view.render();
    }, this, []);
  }

  /**
   * 親コンポーネントがない場合のコンポーネント初期処理
   * このコンポーネントのBoundNodeを生成し、rootBinderへ登録する
   */
  async topComponentInit() {
    Thread.current.asyncProc(async () => {
      const boundNode = new BoundComponent(this, null, []);
      boundNode.bind();
      await this.viewModelProxy.$init();
      this.updateActiveProperty();
      Binder.rootBinder.add(boundNode);
      this.view.render();
    }, this, []);
  }

  /**
   * デフォルトのコンポーネント初期化処理
   * 親コンポーネントの初期化終了を待つ
   * viewModelの初期化
   * viewのレンダリングを行う
   * @async
   */
  async defaultComponentInit() {
    Thread.current.asyncProc(async () => {
      await this.parentComponent.initializePromise;
      await this.viewModelProxy.$init();
      this.updateActiveProperty();
      this.view.render();
    }, this, []);
  }

  /**
   * コンポーネント初期化
   * @async
   */
  async componentInit() {
    try {
      if ("dialog" in this.dataset) {
        await this.dialogComponentInit();
      } else if (this.parentComponent == null) {
        await this.topComponentInit();
      } else {
        await this.defaultComponentInit();
      }
    } finally {
      this.#isInitializing = false;
      this.#initializeResolve(true);
    }
  }


  /**
   * @type {Map<string,ActiveProperty>}
   */
  updateActiveProperty() {
    this.activeProperties.build(this.viewModelProxy);
  }
  /**
   * 接続時コールバック
   */
  async connectedCallback() {
//    console.log(`${this.tagName}.connectedCallback()`);
    await this.componentInit();
  }
    
  disconnectedCallback() {
//    console.log(`${this.tagName}.disconnectedCallback()`);
  }
    
  adoptedCallback() {
//    console.log(`${this.tagName}.adoptedCallback()`);
  }
    
  attributeChangedCallback(name, oldValue, newValue) {
//    console.log(`${this.tagName}.attributeChangedCallback(${name}, ${oldValue}, ${newValue})`);
  }
}