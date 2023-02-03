import UpdateFunc from "./UpdateFunc.js";

export default class NodeProperty {
  name;
  paths;
  updateViewModelFunc;
  updateNodeFunc;
  /**
   * ノードのプロパティについて、パス要素、ViewModel・ノード更新関数を取得
   * @param {string} name 
   */
  constructor(name) {
    this.name = name;
    this.paths = name.split(".");
    const [updateViewModelFunc, updateNodeFunc] = (this.paths.length === 2 && this.paths[0] === "class") ? UpdateFunc.className :
      (name === "radio" || name === "checkbox" || name === "file") ? UpdateFunc[name] : 
      (this.paths.length === 1 || this.paths.length === 2) ? UpdateFunc["param" + this.paths.length] : console.error(`unknown property name ${name}`);
    Object.assign(this, {updateViewModelFunc, updateNodeFunc});
  }

  /**
   * @type {Map<string,NodeProperty>}
   */
  static cacheNodePropertyByName = new Map();
  /**
   * 
   * @param {string} name 
   * @returns {NodeProperty}
   */
  static create(name) {
    let nodeProperty = this.cacheNodePropertyByName.get(name);
    if (typeof nodeProperty === "undefined") {
      nodeProperty = new NodeProperty(name);
      this.cacheNodePropertyByName.set(name, nodeProperty);
    }
    return nodeProperty;
  }
}