import FilterData from "../Filter/FilterData.js";

const SAMENAME = "@";
const DEFAULT = "$";

/**
 * トリム関数
 * @param {string} s 
 * @returns {string}
 */
const trim = s => s.trim();

/**
 * 長さチェック関数
 * @param {string} s 
 * @returns {string}
 */
const has = s => s.length > 0;

  /**
 * フィルターのパース
 * "eq,100|falsey" ---> [FilterData(eq, [100]), FilterData(falsey)]
 * @param {string} text 
 * @returns {FilterData[]}
 */
const parseFilter = text => {
  const [name, ...options] = text.split(",").map(trim);
  return Object.assign(new FilterData, {name, options});
};

/**
 * ViewModelプロパティのパース
 * "value|eq,100|falsey" ---> ["value", FilterData[]]
 * @param {string} text 
 * @returns {[viewModelProp:string,FilterData[]]}
 */
const parseViewModelProp = text => {
  const [viewModelProp, ...filterTexts] = text.split("|").map(trim);
  return [viewModelProp, filterTexts.map(text => parseFilter(text))];
};

/**
 * 式のパース
 * "textContent:value|eq,100|falsey" ---> ["textContent", "value", FilterData[eq, falsey]]
 * @param {string} expr 
 * @param {string} defaultName 
 * @returns {[prop:string,viewModelProp:string,filters:FilterData[]]}
 */
const parseBind = (expr, defaultName) => {
  const [prop, viewModelPropText] = [defaultName].concat(...expr.split(":").map(trim)).splice(-2);
  const [viewModelProp, filters] = parseViewModelProp(viewModelPropText);
  return [prop, viewModelProp, filters];
};

/**
 * data-bind属性をパースする関数群
 */
export default class {
  /**
   * @type {Map<string,Array>}
   */
  static cache = new Map();
  /**
   * 属性値のパース
   * @param {string} text 属性値
   * @param {string} defaultName prop:を省略時、デフォルトのプロパティ値
   * @returns {[prop:string,viewModelProp:string,filters:FilterData[]][]}
   */
  static parseBinds = (text, defaultName) => {
    const key = `${text}\t${defaultName}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    } else {
      const binds = text.split(";").map(trim).filter(has).map(s => { 
        let [prop, viewModelProp, filters] = parseBind(s, DEFAULT);
        viewModelProp = viewModelProp === SAMENAME ? prop : viewModelProp;
        prop = prop === DEFAULT ? defaultName : prop;
        return [prop, viewModelProp, filters];
      });
      this.cache.set(key, binds);
      return binds;
    }

  };
}