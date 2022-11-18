import Thread from "../Thread/Thread.js";
import Builder from "./Builder.js";
import utils from "../utils.js";
import WebComponent, { Component } from "../Component/WebComponent.js";
import ViewModelProperty from "./Property.js";
//import DialogComponent from "../Component/DialogComponent.js";

/**
 * @type {Symbol}
 */
const SymRaw = Symbol.for("raw");
/**
 * @type {Symbol}
 */
const SymIsProxy = Symbol.for("isProxy");

const SET_OF_PROXY_METHODS = new Set([
  "$getValue", "$setValue", "$init", "$deleteCache", "$asyncProc", "$notify",
  "$openDialog", "$closeDialog", "$cancelDialog", "$addImportProp", "$findNode",
]);

/**
 * @type {Map<string,(handler:Handler)=>any>}
 */
const getMemberFuncOfProp = new Map();
getMemberFuncOfProp.set("$indexes", handler => handler.component.stackIndexes.current);
getMemberFuncOfProp.set("$component", handler => handler.component);
getMemberFuncOfProp.set("$setOfImportProps", handler => handler.setOfImportProps);
getMemberFuncOfProp.set("$setOfArrayProps", handler => handler.setOfArrayProps);
getMemberFuncOfProp.set("$setOfRelativePropsByProp", handler => handler.setOfRelativePropsByProp);

const SET_OF_PROXY_MEMBERS = new Set([
  "$1", "$2", "$3", "$4", "$5", "$6", "$7", "$8", 
  "$indexes", "$component", "$setOfImportProps", "$setOfArrayProps", "$setOfRelativePropsByProp",
  
]);

/**
 * キャッシュ
 */
class Cache extends Map {
//  #cache = new Map;
//  #setOfImportProps;
  #debug = false;
  /**
   * 
   */
  #component;
  constructor(component) {
    super();
    this.#component = component;
  }
  has(key) {
    const result = super.has(key);
    this.#debug && !utils.isSymbol(key) && console.log(`cache.has(${key}) = ${result}, ${this.#component?.tagName}`);
    return result;
  }
  get(key) {
    const result = super.get(key);
    this.#debug && !utils.isSymbol(key) && console.log(`cache.get(${key}) = ${result}, ${this.#component?.tagName}`);
    return result;
  }
  delete(key) {
    const result = super.delete(key);
    this.#debug && !utils.isSymbol(key) && console.log(`cache.delete(${key}) = ${result}, ${this.#component?.tagName}`);
    return result;
  }

  /**
   * 要素の追加、更新
   * @param {string|Symbol} key 
   * @param {any} value 
   * @returns {Cache}
   */
  set(key, value) {
    // シンボル、*を含むプロパティ、__で始まるプロパティ、$$で始まるプロパティ、メソッドはキャッシュ対象外
    if (utils.isSymbol(key) || key.includes("*") || key.startsWith("__") || key.startsWith("$$")) return;
    // インポートしたプロパティはキャッシュ対象外
    if (this.#component.viewModelProxy.$setOfImportProps.has(key)) return;
    if (utils.isFunction(value)) return; 

    value = value?.[SymIsProxy] ? value[SymRaw] : value
    const result = super.set(key, value);
    this.#debug && !utils.isSymbol(key) && console.log(`cache.set(${key}, ${value}) = ${result}, ${this.#component?.tagName}`);
    return result;
  }

  /**
   * 関連する要素を削除
   * "キー."で始まるキーの要素が削除対象
   * @param {string} key 
   */
  deleteRelative(key) {
    this.delete(key);
    const relativeKey = `${key}.`;
    Array.from(this.keys()).filter(key => key.startsWith(relativeKey)).forEach(key => this.delete(key));
  }
}

/**
 * 配列プロキシ
 * 更新（追加・削除）があった場合、更新通知を送る機能を付加する
 */
class ArrayHandler {
  /**
   * @type {Component}
   */
  component;
  /**
   * @type {string}
   */
  prop;
  /**
   * ループインデックス
   * @type {Array{iteger}}
   */
  indexes;
  /**
   * コンストラクタ
   * @param {Component} component 
   * @param {string} prop 
   */
  constructor(component, prop) {
    this.component = component;
    this.prop = prop;
    this.indexes = component.stackIndexes.current?.slice(0);
  }

  /**
   * getter
   * SymIsProxyはtrueを返す
   * SymRawは元の配列を返す
   * @param {Array} target Array
   * @param {string} prop プロパティ
   * @param {Proxy} receiver 配列プロキシ
   * @returns 
   */
  get(target, prop, receiver) {
    if (prop === SymIsProxy) return true;
    if (prop === SymRaw) return target;
    return Reflect.get(target, prop, receiver);
  }

  /**
   * setter
   * lengthプロパティの場合、変更通知を送信する
   * @param {Object} target Array
   * @param {string} prop プロパティ
   * @param {Any} value 
   * @param {Proxy} receiver 配列プロキシ
   * @returns 
   */
  set(target, prop, value, receiver) {
    Reflect.set(target, prop, value, receiver);
    if (prop === "length") {
      Thread.current.notify(this.component, this.prop, this.indexes ?? []);
    }
    return true;
  }
}

/**
 * 配列プロキシを取得
 * 配列プロキシのプロキシといった重複をさけるため、
 * いったん元の配列を求めてからプロキシにする
 * @param {Component} component 
 * @param {string} prop 
 * @param {any} value 
 * @returns 
 */
const wrapArrayProxy = (component, prop, value) => {
  value = value?.[SymIsProxy] ? value[SymRaw] : value;
  return (value instanceof Array) ? new Proxy(value, new ArrayHandler(component, prop)) : value;
}

/**
 * ViewModelに以下の機能を付加する
 * ・プロパティ名とインデックスを指定しての値の読み書き
 * ・キャッシュ
 * ・ViewModel内からの非同期処理登録
 * ・ViewModel内からの更新通知
 * ・ViewModelの初期処理実行
 * ・コンテキスト変数（$indexes, $1～$8）
 */
class Handler {
  /**
   * @type {Component}
   */
  component;
  /**
   * @type {Cache}
   */
  cache;
  importProps = [];
  setOfImportProps = new Set;
  arrayProps;
  setOfArrayProps;
  setOfRelativePropsByProp;

  /**
   * コンストラクタ
   * @param {Component} component 
   * @param {string[]} importProps
   * @param {string[]} arrayProps
   * @param {Map<string,Set<string>>} setOfRelativePropsByProp
   */
  constructor(component, importProps, arrayProps, setOfRelativePropsByProp) {
    this.component = component;
    this.#addImportProp(...importProps);
    this.cache = new Cache(component);
    this.arrayProps = arrayProps;
    this.setOfArrayProps = new Set(arrayProps);
    this.setOfRelativePropsByProp = setOfRelativePropsByProp;
  }

  #addImportProp(...args) {
    this.importProps.push(...args);
    args.forEach(prop => this.setOfImportProps.add(prop));
  }
  $addImportProp(...args) {
    const receiver = args.pop();
    const target = args.pop();
    Reflect.apply(this.#addImportProp, this, args);
  }

  /**
   * プロパティ、インデックス配列を指定してプロパティ値を取得
   * @param {string} prop プロパティ（ex. list.*）
   * @param {integer[]} indexes インデックス配列（ex. [3]） 
   * @param {string} path パス（ex. list.3）
   * @param {Object} target ViewModel
   * @param {Proxy} receiver ViewModelProxy
   * @returns 
   */
  $getValue(prop, indexes, path, target, receiver) {
    if (!Handler.propInfoByProp.has(path)) {
      Handler.propInfoByProp.set(path, { prop, indexes, path });
    }
    path = path ?? utils.getPath(prop, indexes);
    const cache = this.cache;
    const component = this.component;
    if (cache.has(path)) {
      return wrapArrayProxy(component, prop, cache.get(path));
    }
    return component.stackIndexes.push(indexes, function () { 
      const value = Reflect.get(target, prop, receiver);
      cache.set(path, value);
      return wrapArrayProxy(component, prop, value);
    });
  }

  /**
   * プロパティ、インデックス配列を指定してプロパティに値を設定
   * 設定後、更新通知を投げる
   * @param {string} prop プロパティ（ex. list.*）
   * @param {integer[]} indexes インデックス配列（ex. [3]） 
   * @param {string} path パス（ex. list.3）
   * @param {Any} value 
   * @param {Object} target ViewModel
   * @param {Proxy} receiver ViewModelProxy
   */
  $setValue(prop, indexes, path, value, target, receiver) {
    if (!Handler.propInfoByProp.has(path)) {
      Handler.propInfoByProp.set(path, { prop, indexes, path });
    }
    path = path ?? utils.getPath(prop, indexes);
    const cache = this.cache;
    const component = this.component;
    const notify = this.$notify;
    const handler = this;
    this.component.stackIndexes.push(indexes, function () {
      Reflect.set(target, prop, value, receiver);
      cache.deleteRelative(path);
      Reflect.apply(notify, handler, [prop, indexes ?? []]);
      return true;
    });
  }

  /**
   * 非同期処理を登録
   * ViewModelから呼ばれることを想定
   * @param  {...any} args [proc, params?, receiver, target]
   */
  $asyncProc(...args) {
    const receiver = args.pop();
    const target = args.pop();
    Thread.current.asyncProc(args[0], receiver, args[1] ?? []);
  }

  /**
   * 更新を通知する
   * __で始まるプロパティは対象外
   * $$で始まるプロパティは対象外
   * インポートしたプロパティは対象外
   * ViewModelから呼ばれることを想定
   * @param {string} prop 
   * @param {Array<integer>} indexes 
   * @returns 
   */
  $notify(prop, indexes) {
    if (prop.startsWith("__")) return;
    if (prop.startsWith("$$")) return;
    if (this.setOfImportProps.has(prop)) return;
    Thread.current.notify(this.component, prop, indexes ?? []);
  }

  /**
   * ViewModelに設定した初期化処理（$onInit）を実行
   * @param {Object} target ViewModel
   * @param {Proxy} receiver ViewModelProxy
   */
  async $init(target, receiver) {
    if ("$relativeProps" in target) {
      const relativeProps = Reflect.get(target, "$relativeProps", receiver);
      relativeProps.forEach(([prop, refProps]) => {
        refProps.forEach(refProp => {
          const setOfRelativeProps = this.setOfRelativePropsByProp.get(refProp).add(prop) ?? new Set([prop]);
          this.setOfRelativePropsByProp.set(refProp, setOfRelativeProps);
        })
      });
    }

    ("$onInit" in target) && await Reflect.apply(target.$onInit, receiver,[]);
  }

  /**
   * 指定されたパスのキャッシュをクリア
   * @param {Set<string>} setOfPath 指定されたパスのセット
   */
  $deleteCache(setOfPath) {
    const cache = this.cache;
    for(const path of Array.from(setOfPath)) {
      cache.deleteRelative(path);
    }
  }

  /**
   * ダイアログ表示
   * 現行のスレッドは、ダイアログ終了まで待機するので、ダイアログ用に別スレッドを作成する（Thread.suspend）
   * ViewModelから呼ばれることを想定
   * @param {string} name ダイアログ名（プレフィックス抜き）
   * @param {Object} binds バインド情報
   * @return {Any?} 正常終了の場合、クローズ時のパラメータ、キャンセルの場合、undefined
   */
  async $openDialog(...args) {
    const receiver = args.pop();
    const target = args.pop();
    const [name, params = {}] = args;
    const parentComponent = this.component;
    Thread.suspend(parentComponent); // 別スレッド作成
    const tagName = WebComponent.tagName(name);
    const template = document.createElement("template");
    template.innerHTML = `<${tagName} data-dialog></${tagName}>`
    const clone = document.importNode(template.content, true);
    const dialogComponent = clone.querySelector(tagName);
    try {
      // ダイアログが処理終了で終わった場合、resolve
      // ダイアログがキャンセル終了で終わった場合、reject
      return await new Promise(async (resolve, reject) => {
        // コンポーネントにダイアログ情報セット
        dialogComponent.setDialogInfo(parentComponent, resolve, reject, params);
        document.body.appendChild(clone);
        await dialogComponent.initializePromise;
      });
    } catch(e) {
    } finally {
      document.body.removeChild(dialogComponent);
      Thread.resume(); // スレッド復帰
    }
  }

  /**
   * ダイアログ処理終了
   * @param {Object} data 
   */
  $closeDialog(data) {
    this.component.closeDialog(data);
  }

  /**
   * ダイアログキャンセル終了
   */
  $cancelDialog() {
    this.component.cancelDialog();
  }

  /**
   * 
   * @param {Set<string>} setOfNames 
   * @param {(key:string,node:Node)=>{}} callback 
   */
  $findNode(setOfNames, callback) {
    this.component.binder.findNode(setOfNames, callback);
  }setOfNames

  static propInfoByProp = new Map();

  /**
   * getter
   * @param {Object} target ViewModel
   * @param {string} prop プロパティ名
   * @param {Proxy} receiver VirewModelProxy
   * @returns 
   */
  get(target, prop, receiver) {
    if (SET_OF_PROXY_METHODS.has(prop)) {
      return (...args) => Reflect.apply(this[prop], this, [...args, target, receiver]);
    }
    if (SET_OF_PROXY_MEMBERS.has(prop)) {
      const getMemberFunc = getMemberFuncOfProp.get(prop);
      if (getMemberFunc) return getMemberFunc(this);
//      if (prop === "$indexes") {
//        return this.component.stackIndexes.current;
//      }
      if (utils.isSymbol(prop)) {
        return Reflect.get(this, prop);
      }
      return this.component.stackIndexes.current[parseInt(prop.slice(1)) - 1];
    }

    if (this.cache.has(prop)) {
      return wrapArrayProxy(this.component, prop, this.cache.get(prop));
    }
    if (!(prop in target)) {
      if (Handler.propInfoByProp.has(prop)) {
        const args = Handler.propInfoByProp.get(prop);
        return this.$getValue(args.prop, args.indexes, args.path, target, receiver);
      } else {
        for(const exProp of ViewModelProperty.expandableProperties) {
          const results = exProp.regexp.exec(prop);
          if (results) {
            const indexes = results.slice(1);
            Handler.propInfoByProp.set(prop, { prop:exProp.prop, indexes, path:prop });
            return this.$getValue(exProp.prop, indexes, prop, target, receiver);
            break;
          }
        }
      }
    }
    const value = Reflect.get(target, prop, receiver);
    this.cache.set(prop, value);
    return wrapArrayProxy(this.component, prop, value);
  }

  /**
   * setter
   * 値をプロパティにセットする
   * 対応するプロパティのキャッシュを削除
   * 更新通知を送る
   * @param {Object} target ViewModel
   * @param {string} prop プロパティ名
   * @param {any} value 値
   * @param {Proxy} receiver VirewModelProxy
   * @returns 
   */
   set(target, prop, value, receiver) {
    let isSet = false;
    if (!(prop in target)) {
      if (Handler.propInfoByProp.has(prop)) {
        const args = Handler.propInfoByProp.get(prop);
        this.$setValue(args.prop, args.indexes, args.path, value, target, receiver);
        return true;
      } else {
        for(const exProp of ViewModelProperty.expandableProperties) {
          const results = exProp.regexp.exec(prop);
          if (results) {
            const indexes = results.slice(1);
            Handler.propInfoByProp.set(prop, { prop:exProp.prop, indexes, path:prop });
            this.$setValue(exProp.prop, indexes, prop, value, target, receiver);
            return true;
          }
        }
      }

    }

    Reflect.set(target, prop, value, receiver);
    this.cache.deleteRelative(prop);
    const indexes = this.component.stackIndexes.current;
    this.$notify(prop, indexes);
    return true;
  }

  /**
   * プロパティの存在確認
   * @param {Object} target ViewModel
   * @param {string} prop プロパティ名
   * @param {Proxy} receiver VirewModelProxy
   * @returns 
   */
  has(target, prop, receiver) {
    if (SET_OF_PROXY_METHODS.has(prop)) return true;
    if (SET_OF_PROXY_MEMBERS.has(prop)) return true;
    if (prop in target) return true;
    return Reflect.has(target, prop, receiver);
  }
}

const ViewModelProxy = Proxy;

/**
 * ViewModelProxyの生成
 */
export default class {
  /**
   * ViewModelProxyの生成
   * @param {Component} component 
   * @param {Object} viewModel 
   * @returns {ViewModelProxy}
   */
  static create(component, viewModel = component.viewModel) {
    const { importProps, arrayProps, setOfRelativePropsByProp} = Builder.build(component);
    return new ViewModelProxy(viewModel, new Handler(component, importProps, arrayProps, setOfRelativePropsByProp));
  }
}
