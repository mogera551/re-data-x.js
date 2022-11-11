import FilterData from "../Filter/FilterData.js";

const SAMENAME = "@";
const DEFAULT = "$";

/**
 * data-bind属性をパースする関数群
 */
export default class {
  /**
   * @type {Map<string,Array>}
   */
  static cache = new Map();
  /**
   * トリム関数
   * @param {string} s 
   * @returns {string}
   */
  static trim = s => s.trim();
  /**
   * 長さチェック関数
   * @param {string} s 
   * @returns {string}
   */
  static has = s => s.length > 0;
  /**
   * フィルターのパース
   * "eq,100|falsey" ---> [FilterData(eq, [100]), FilterData(falsey)]
   * @param {string} text 
   * @returns {FilterData[]}
   */
  static parseFilter = text => {
    const [name, ...options] = text.split(",").map(this.trim);
    return Object.assign(new FilterData, {name, options});
  }
  /**
   * ViewModelプロパティのパース
   * "value|eq,100|falsey" ---> ["value", FilterData[]]
   * @param {string} text 
   * @returns {[viewModelProp:string,FilterData[]]}
   */
  static parseViewModelProp = text => {
    const [viewModelProp, ...filterTexts] = text.split("|").map(this.trim);
    return [viewModelProp, filterTexts.map(text => this.parseFilter(text))];
  }
  /**
   * 式のパース
   * "textContent:value|eq,100|falsey" ---> ["textContent", "value", FilterData[]]
   * @param {string} expr 
   * @param {string} defaultName 
   * @returns {[prop:string,viewModelProp:string,filters:FilterData[]]}
   */
  static parseBind = (expr, defaultName) => {
    const [prop, viewModelPropText] = [defaultName].concat(...expr.split(":").map(this.trim)).splice(-2);
    const [viewModelProp, filters] = this.parseViewModelProp(viewModelPropText);
    return [prop, viewModelProp, filters];
  }
  /**
   * 属性値のパース
   * @param {string} text 属性値
   * @param {string} defaultName prop:を省略時、デフォルトのプロパティ値
   * @returns {[prop:string,viewModelProp:string,filters:FilterData[]][]}
   */
  static parseBinds = (text, defaultName) => {
//    return text.split(";").map(this.trim).filter(this.has).map(s => this.parseBind(s, defaultName));
    const key = `${text}\t${defaultName}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    } else {
      const binds = text.split(";").map(this.trim).filter(this.has).map(s => this.parseBind(s, DEFAULT))
      .map(([prop, viewModelProp, filters]) => {
        viewModelProp = viewModelProp === SAMENAME ? prop : viewModelProp;
        prop = prop === DEFAULT ? defaultName : prop;
        return [prop, viewModelProp, filters];
      });
      this.cache.set(key, binds);
      return binds;
    }

  };
}