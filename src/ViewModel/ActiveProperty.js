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
  /**
   * @type {string}
   */
  name;
  /**
   * @type {string}
   */
  path;
  /**
   * @type {integer[]}
   */
  indexes;
  /**
   * @type {string} indexes.toString()の値
   */
  indexesString;
  /**
   * @type {string[]}
   */
  indexesStrings;
  /**
   * @type {string}
   */
  prentPath;

  /**
   * 
   * @param {DefinedProperty} definedProp 
   * @param {string} path
   * @param {integer[]}
   */
  constructor(definedProp, path, indexes = []) {
    this.definedProp = definedProp;
    this.name = definedProp.name
    this.path = path;
    this.indexes = indexes;
    this.indexesString = indexes.toString();
    this.indexesStrings = Array(indexes.length);
    for(let i = 0; i < indexes.length; i++) this.indexesStrings[i] = indexes.slice(0, i + 1).toString();
    this.parentPath = utils.getPath(definedProp.parentPath, indexes);
  }

  static propByPath = new Map();
  /**
   * 
   * @param {string} name 
   * @param {integer[]?} indexes 
   * @returns {ActiveProperty}
   */
  static create(name, indexes = []) {
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

  /**
   * 
   * @param {Proxy} viewModelProxy 
   * @param {ActiveProperty} property 
   * @returns {any}
   */
  static getValue(viewModelProxy, property) {
    return viewModelProxy.$getValue(property.name, property.indexes, property.path);
  }

  /**
   * 
   * @param {Proxy} viewModelProxy 
   * @param {ActiveProperty} property 
   * @returns {true}
   */
  static setValue(viewModelProxy, property, value) {
    viewModelProxy.$setValue(property.name, property.indexes, property.path, value);
    return true;
  }
  
}
