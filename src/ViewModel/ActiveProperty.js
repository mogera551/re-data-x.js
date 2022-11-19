import utils from "../utils.js";
import DefinedProperty from "./DefinedProperty.js";

/**
 * 実際に使用するプロパティ
 * ViewModelの初期化後、リストプロパティが変化したときに登録する
 */
export default class ActiveProperty {
  /**
   * @type {DefinedProperty} 
   */
  definedProp;
  indexes;
  path;

  /**
   * 
   * @param {DefinedProperty} prop 
   */
  constructor(definedProp, path, indexes = []) {
    this.definedProp = definedProp;
    this.name = definedProp.name
    this.path = path;
    this.indexes = indexes;
    this.parentPath = utils.getPath(definedProp.parentPath, indexes)
  }

  static propByPath = new Map();
  /**
   * 
   * @param {string} name 
   * @param {integer[]?} indexes 
   * @returns {ActiveProperty}
   */
  static createByNameAndIndexes(name, indexes = []) {
    const path = utils.getPath(name, indexes);
    if (this.propByPath.has(path)) {
      return this.propByPath.get(path);
    } else {
      const definedProp = DefinedProperty.create(name);
      const activeProperty = new ActiveProperty(definedProp, path, indexes);
      this.propByPath.set(path, activeProperty);
      return activeProperty;
    }
  }

}
