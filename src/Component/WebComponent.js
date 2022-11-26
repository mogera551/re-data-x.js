import BaseComponent from "./BaseComponent.js";
import ComponentData from "./ComponentData.js";
import utils from "../utils.js";

/**
 * タグ名とコンポーネントデータの関連付けを保存する。
 */
class ComponentDataByTagName extends Map {
  /**
   * タグ名とコンポーネントデータの関連付けする。
   * コンポーネントクラスを作成し、カスタムエレメンツに登録する
   * @param {string} lowerTagName 
   * @param {CompoentnData} componentData 
   */
  set(lowerTagName, componentData) {
    super.set(lowerTagName.toUpperCase(), componentData);
    const componentClass = class extends Component {}; // 同じクラスを登録できないため
    customElements.define(lowerTagName, componentClass);
  }
}

/**
 * カスタムエレメンツに登録するコンポーネント
 */
export class Component extends BaseComponent {
  /**
   * コンストラクタ
   * タグから、登録されたコンポーネントの情報を取得し、コンポーネントを構築する
   */
  constructor() {
    super();
    super.build(WebComponent.getComponentDataByTagName(this.tagName));
  }
}

/**
 * WebComponentを管理するクラス
 * Prefixの格納、タグ名とコンポーネントデータの関連付け
 */
export default class WebComponent {
  /**
   * @type {string}
   */
  static #prefix;
  /**
   * @return {string}
   */
  static get prefix() {
    return this.#prefix;
  }
  /**
   * @param {string} value
   */
  static set prefix(value) {
    this.#prefix = value;
  }
  /**
   * 
   * @param {string} name 
   * @returns {string}
   */
  static tagName(name) {
    return this.#prefix ? `${this.#prefix}-${name}` : name;
  }

  /**
   * @type {ComponentDataByTagName}
   */
  static #componentDataByTagName = new ComponentDataByTagName();
  /**
   * タグ名からコンポーネントデータを取得する
   * @param {string} tagName 
   * @returns {ComponentData}
   */
  static getComponentDataByTagName(tagName) {
    return this.#componentDataByTagName.get(tagName);
  }
  /**
   * タグ名とコンポーネントデータの関連付けを登録する
   * @param {string} name 
   * @param {ComponentData} componentData 
   */
  static registComponentData(name, componentData) {
    this.#componentDataByTagName.set(utils.toKebabCase(name), componentData);
  }

}
