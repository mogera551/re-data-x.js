import WebComponent from "./Component/WebComponent.js";
import ComponentData from "./Component/ComponentData.js";
import globalData from "./Globals/Globals.js";

export default class Framework {
  /**
   * タグプレフィックスを設定する
   * @static
   * @param {string} prefix 
   * @returns {Framework}
   */
  static prefix = prefix => {
    WebComponent.prefix = prefix;
    return this;
  }
  /**
   * @typedef {{css:string,html:string,ViewModel:class}} ComponentInputData
   */
  /**
   * コンポーネントデータを登録
   * @static
   * @param {Object<string,ComponentInputData>} components 
   * @returns {Framework}
   */
  static components = components => {
    for(const [name, data] of Object.entries(components)) {
      const componentData = ComponentData.create(data);
      WebComponent.registComponentData(WebComponent.tagName(name), componentData);
    }
    return this;
  }
  /**
   * グローバル変数の登録
   * @param {{key:any}} params 
   * @returns {Framework}
   */
  static globals = params => {
    Object.assign(globalData, params);
    return this;
  }
}