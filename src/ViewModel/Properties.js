import DefinedProperty from "./DefinedProperty.js";
import utils from "../utils.js";
import "./types.js"
import ActiveProperty from "./ActiveProperty.js";

export default class Properties {
  /**
   * @type {DefinedProperty[]}
   */
  definedProperties;
  /**
   * @type {Map<string,DefinedProperty>}
   */
  propertyByName;
  /**
   * @type {DefinedProperty[]}
   */
  variableProperties;
  /**
   * @type {RegExp[]}
   */
  variableRegExps;
  /**
   * @type {Map<RegExp,DefinedProperty>}
   */
  propertyByRegExp;
  /**
   * @type {ViewModelProxy}
   */
  viewModelProxy;

  /**
   * 
   * @param {ViewModelProxy} viewModelProxy 
   */
  constructor(viewModelProxy) {
    this.viewModelProxy = viewModelProxy;
    this.definedProperties = viewModelProxy.$definedProperties;
    this.propertyByName = new Map(this.definedProperties.map(property => [property.name, property]));
    this.variableProperties = definedProperties.filter(property => property.isVariable);
    this.variableRegExps = this.variableProperties.map(property => property.regexp);
    this.propertyByRegExp = new Map(this.variableProperties.map(property => [property.regexp, property]));
  }

  /**
   * 
   * @param {DefinedProperty} definedProp 
   * @param {integer[]} indexes 
   */
  getByDefinedPropIndexes(definedProp, indexes) {
    const parentDefinedProp = this.propertyByName.get(definedProp.parentPath);
    if (parentDefinedProp == null) utils.raise(`unknown property ${definedProp.parentPath}`);
    const parentValue = (parentDefinedProp.level > 0) ? this.getByDefinedPropIndexes(parentDefinedProp, indexes) : this.getByDefinedProperty(parentDefinedProp);
    const last = definedProp.last === "*" ? indexes[definedProp.level - 1] : definedProp.last;
    return parentValue[last];
  }

  /**
   * 
   * @param {DefinedProperty} definedProp 
   */
  getByDefinedProperty(definedProp) {
    if (definedProp.isVariable) utils.raise(`property ${definedProp.name} must not be variable `);
    if (definedProp.isObjective) {
      return this.getByName(definedProp.parentPath)[definedProp.last];
    } else {
      return this.viewModelProxy[definedProp.name];
    }
  }
  /**
   * 
   * @param {string} name 
   * @returns {any}
   */
  getByName(name) {
    const definedProp = this.propertyByName.get(name);
    if (definedProp != null) {
      return this.getByDefinedProperty(definedProp);
    }
    for(let i = 0; i < this.variableRegExps.length; i++) {
      const regexp = this.variableRegExps[i];
      const indexes = regexp.exec(name)?.slice(1);
      if (indexes) {
        const definedProp = this.propertyByRegExp.get(regexp);
        return this.getByDefinedPropIndexes(definedProp, indexes);
      }
    }
    utils.raise(`unknown property ${name}`);
  }

  /**
   * 
   * @param {string} name 
   * @returns {ActiveProperty}
   */
  getActiveProperty(name) {
    const definedProp = this.propertyByName.get(name);
    if (definedProp != null) {
      return ActiveProperty.createByDefinedProperty(definedProp, []);
    }
    for(let i = 0; i < this.variableRegExps.length; i++) {
      const regexp = this.variableRegExps[i];
      const indexes = regexp.exec(name)?.slice(1);
      if (indexes) {
        const definedProp = this.propertyByRegExp.get(regexp);
        return ActiveProperty.createByDefinedProperty(definedProp, indexes);
      }
    }
    return null;
  }


  
  getRelativeProperties(name, indexes) {
    


  }


}