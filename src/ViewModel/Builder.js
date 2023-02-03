import utils from "../utils.js";
import globals from "../Globals/Globals.js";
import DefinedProperty from "./DefinedProperty.js";
import {Component} from "../Component/WebComponent.js";
import CheckPoint from "../CheckPoint/CheckPoint.js";
import "../types.js";

/**
 * デフォルトのgetter
 * @param {Component} component 
 * @param {string} parentName
 * @param {string} last
 * @param {integer} level
 * @returns {()=>any}
 */
const defaultGetter = (component, parentName, last, level) => () => {
  const viewModelProxy = component.viewModelProxy;
  const viewModel = component.viewModel;
  const lastIndex = (last === "*") ? component.stackIndexes.current[level - 1] : last;
  let result;
  if (level === 0) {
    result = viewModelProxy[parentName]?.[lastIndex];
  } else {
    result = Reflect.get(viewModel, parentName, viewModelProxy)?.[lastIndex];
  }
  return result;
}

/**
 * デフォルトのsetter
 * @param {Component} component 
 * @param {string} parentName
 * @param {string} last
 * @param {integer} level
 * @returns {(value:any)=>true}
 */
const defaultSetter = (component, parentName, last, level) => value => {
  const viewModelProxy = component.viewModelProxy;
  const viewModel = component.viewModel;
  const lastIndex = (last === "*") ? component.stackIndexes.current[level - 1] : last;
  if (level === 0) {
    viewModelProxy[parentName][lastIndex] = value;
  } else {
    Reflect.get(viewModel, parentName, viewModelProxy)[lastIndex] = value;
  }
  return true;
}

/**
 * デフォルトのgetter
 * @param {Component} component 
 * @param {string} name 
 * @returns {()=>any}
 */
const defaultGetterPrimitive = (component, name) => () => {
  const viewModelProxy = component.viewModelProxy;
  const viewModel = component.viewModel;
  return Reflect.get(viewModel, "__" + name, viewModelProxy);
}

/**
 * デフォルトのsetter
 * @param {Component} component 
 * @param {string} name 
 * @returns {(value:any)=>true)}
 */
const defaultSetterPrimitive = (component, name) => value => {
  const viewModelProxy = component.viewModelProxy;
  const viewModel = component.viewModel;
  Reflect.set(viewModel, "__" + name, value, viewModelProxy);
  return true;
}

/**
 * デフォルトのgetter
 * @param {string} name 
 * @returns {any}
 */
const defaultGetterGlobalPrimitive = name => () => {
  const propName = name.slice(2); // 先頭$$をスキップ
  return globals?.[propName];
}

/**
 * デフォルトのsetter
 * @param {string} name 
 * @returns {(value:any)=>true}
 */
const defaultSetterGlobalPrimitive = name => value => {
  const propName = name.slice(2); // 先頭$$をスキップ
  globals[propName] = value;
  return true;
}

const applyGetter = (component) => getter => () => {
  const viewModelProxy = component.viewModelProxy;
  return Reflect.apply(getter, viewModelProxy, []);
}

const applySetter = (component) => setter => value => {
  const viewModelProxy = component.viewModelProxy;
  return Reflect.apply(setter, viewModelProxy, [value]);
}

/**
 * @typedef {{getter:()=>any,setter:(value:any)=>boolean,enumerable:boolean,configurable:boolean}} PropertyDescriptor
 */
/**
 * 
 * @param {Component} component 
 * @param {DefinedProperty} definedProperty 
 * @returns {PropertyDescriptor}
 */
const createDefaultDesc = (component, definedProperty) => {
  const { parentPath, last, level } = definedProperty;
  return {
    get: () => defaultGetter(component, parentPath, last, level)(),
    set: v => defaultSetter(component, parentPath, last, level)(v),
    enumerable: true, 
    configurable: true,
  }
};

/**
 * 
 * @param {Component} component 
 * @param {string} name 
 * @returns {PropertyDescriptor}
 */
const createDefaultPrimitiveDesc = (component, name) => {
  return {
    get: () => defaultGetterPrimitive(component, name)(),
    set: v => defaultSetterPrimitive(component, name)(v),
    enumerable: true, 
    configurable: true,
  }
};

/**
 * 
 * @param {string} name 
 * @returns {PropertyDescriptor}
 */
const createDefaultGlobalPrimitiveDesc = name => {
  return {
    get: () => defaultGetterGlobalPrimitive(name)(),
    set: v => defaultSetterGlobalPrimitive(name)(v),
    enumerable: true, 
    configurable: true,
  }
};

/**
 * 
 * @param {any} value 
 * @returns {PropertyDescriptor}
 */
const createPrivateDesc = value => ({
  value,
  writable: true, 
  enumerable: false, 
  configurable: true,
});

export default class {

  /**
   * 
   * @param {Component} component 
   * @param {ViewModel?} viewModel 
   * @returns {{importProps:string[], arrayProps:string[], setOfRelativePropsByProp:Map<string,string[]>, definedProperties:DefinedProperty[]}}
   */
  static build(component, viewModel = component.viewModel) {
    // プライベートプロパティ __で始まる
    // コンテキストプロパティ $で始まる
    // グローバルプロパティ $$で始まる
    /**
     * @type {Map<string,PropertyDescriptor>}
     */
    const descByProp = new Map;
    /**
     * @type {Set<string>}
     */
    const setOfPrivateProps = new Set(Object.keys(viewModel).filter(prop => prop.startsWith("__")));
    /**
     * @type {Set<string>}
     */
    const setOfContextProps = new Set(Object.keys(viewModel).filter(prop => prop[0] === "$" && prop[1] !== "$"));
    /**
     * @type {Set<string>}
     */
    const setOfGlobalProps = new Set(Object.keys(viewModel).filter(prop => prop.startsWith("$$")));
    const importProps = [];

    /**
     * 
     * @param {string} name 
     * @param {any} value 
     */
    const createDesc = (name, value = null) => {
      let desc;
      if (setOfGlobalProps.has(name)) {
        desc = createDefaultGlobalPrimitiveDesc(name);
      } else {
        const definedProperty = DefinedProperty.create(name);
        if (!definedProperty.isPrimitive) {
          desc = createDefaultDesc(component, definedProperty);
        } else {
          desc = createDefaultPrimitiveDesc(component, name);
          if (!setOfPrivateProps.has(definedProperty.privateName)) {
            Object.defineProperty(viewModel, definedProperty.privateName, createPrivateDesc(value));
            setOfPrivateProps.add(definedProperty.privateName);
          }
        }
      }
      return desc;
    };
    
    // ViewModelオブジェクトのプロパティを取得
    for(const [prop, value] of Object.entries(viewModel)) {
      // 
      if (setOfPrivateProps.has(prop) || setOfContextProps.has(prop)) continue;
      if (value === Symbol.for("import")) {
        // importなのでdata-bindプロパティの展開処理
        importProps.push(prop);
        continue;
      }
      descByProp.set(prop, createDesc(prop, value));
    }

    // ViewModelのアクセサのthisをViewModelProxyにする
    for(const [prop, desc] of Object.entries(Object.getOwnPropertyDescriptors(Object.getPrototypeOf(viewModel)))) {
      if (prop === "constructor") continue;
      if (utils.isFunction(desc.value)) continue;

      let curDesc = descByProp.get(prop);
      if (typeof curDesc === "undefined") {
        curDesc = createDesc(prop);
        descByProp.set(prop, curDesc);
      }
/*
      if (!descByProp.has(prop)) {
        createDesc(prop);
      }
      const curDesc = descByProp.get(prop);
*/
      if (desc.get) {
        curDesc.get = () => applyGetter(component)(desc.get)();
      }
      if (desc.set) {
        curDesc.set = v => applySetter(component)(desc.set)(v);
      }
    }

    /**
     * @type {String[]}
     */
    const removeProps = Object.keys(viewModel).filter(prop => !setOfPrivateProps.has(prop) && !setOfContextProps.has(prop));
    removeProps.forEach(prop => delete viewModel[prop]);
    Array.from(descByProp.entries()).forEach(([prop, desc]) => Object.defineProperty(viewModel, prop, desc));
    /**
     * @type {String[]}
     */
    const publicProps = Object.keys(viewModel).concat(importProps);
    /**
     * @type {DefinedProperty[]}
     */
    const definedProperties = publicProps.map(name => DefinedProperty.create(name))
      .sort((p1, p2) => p1.level === p2.level ? p1.paths.length - p2.paths.length : p1.level - p2.level);
    // 配列と思われるプロパティの取得
    const arrayProps = publicProps.filter(prop => `${prop}.*` in viewModel);
    // 関係のあるプロパティ(配列は含めない)
    const setOfRelativePropsByProp = new Map;
    definedProperties
      .reduce((map, prop) => {
        map.set(prop.name, new Set(definedProperties.filter(_prop => _prop.setOfParentPath.has(prop.name)).map(prop => prop.name)));
        return map;
      }, setOfRelativePropsByProp);
    return { importProps, arrayProps, setOfRelativePropsByProp, definedProperties };

  }

}