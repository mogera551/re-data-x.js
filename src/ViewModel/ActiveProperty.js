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
   * @param {integer[]} indexes
   * @param {string} indexesString
   * @param {string} key
   */
  constructor(definedProp, path, indexes, indexesString, key) {
    this.definedProp = definedProp;
    this.name = definedProp.name
    this.path = path;
    this.indexes = indexes;
    this.indexesString = indexesString;
    this.key = key;
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
    const indexesString = indexes.toString();
    const key = name + "\t" + indexesString;
    if (this.propByPath.has(key)) {
      return this.propByPath.get(key);
    } else {
      const path = utils.getPath(name, indexes);
      const definedProp = DefinedProperty.create(name);
      const activeProperty = new ActiveProperty(definedProp, path, indexes, indexesString, key);
      this.propByPath.set(key, activeProperty);
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
