export default class {
  /**
   * 
   * pattern："list.*.items.*.name"
   * indexes：[5,13]
   * returns："list.5.items.13.name"
   * @param {string} pattern 
   * @param {Array<integer>} indexes 
   * @returns 
   */
  static getPath(pattern, indexes) {
//    const stack = indexes.slice();
//    return pattern.replaceAll("*", () => stack.shift() ?? "");
    let i = 0;
    return pattern.replaceAll("*", () => indexes[i++] ?? "");
  }

  /**
   * 例外を投げる
   * @param {string} message 
   */
  static raise(message) {
    throw message;
  }

  /**
   * 関数かどうかをチェック
   * @param {any} obj 
   * @returns {boolean}
   */
  static isFunction = (obj) => {
    const toString = Object.prototype.toString;
    const text = toString.call(obj).slice(8, -1).toLowerCase();
    return (text === "function" || text === "asyncfunction");
  }
  /**
   * シンボルかどうかをチェック
   * @param {any} obj 
   * @returns {boolean}
   */
  static isSymbol = (obj) => typeof obj === "symbol";

  /**
   * 
   * @param {Node} node 
   * @returns {HTMLElement}
   */
  static toElement = node => (node instanceof HTMLElement) ? node : utils.raise(`node ${node} is not HTMLElement`);
  
  /**
   * 
   * @param {Node} node 
   * @returns {HTMLTemplateElement}
   */
  static toTemplate = node => (node instanceof HTMLTemplateElement) ? node : utils.raise(`node ${node} is not HTMLTemplateElement`);
  
  /**
   * 
   * @param {Node} node 
   * @returns {HTMLInputElement}
   */
  static toInput = node => (node instanceof HTMLInputElement) ? node : utils.raise(`node ${node} is not HTMLInputElement`);
  
  static toKebabCase = text => text.replaceAll(/([A-Z])/g, (match,char,index) => (index > 0 ? "-" : "") + char.toLowerCase());
}