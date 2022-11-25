import utils from "../utils.js";
import globals from "../Globals/Globals.js";
import DefinedProperty from "./DefinedProperty.js";
import {Component} from "../Component/WebComponent.js";
import CheckPoint from "../CheckPoint/CheckPoint.js";

/**
 * デフォルトのgetter
 * @param {Component} component 
 * @param {Proxy?} viewModelProxy 
 * @returns {(path:string,last:string)=>(()=>any)}
 */
const defaultGetter = (component, path, last, level, isParentPrimitive) => () => {
  const viewModelProxy = component.viewModelProxy;
  const viewModel = component.viewModel;
  let result;
  if (isParentPrimitive) {
    result = viewModelProxy[path];
  } else {
    const indexes = component.stackIndexes.current ?? [];
    const lastIndex = (last === "*") ? indexes[level] : last;
    result = Reflect.get(viewModel, path, viewModelProxy)?.[lastIndex];
  }
  return result;
}

/**
 * デフォルトのsetter
 * @param {Component} component 
 * @param {Proxy} viewModelProxy 
 * @returns {(path:string,last:string)=>((value:any)=>true)}
 */
const defaultSetter = (component, path, last, level, isParentPrimitive) => value => {
  const viewModelProxy = component.viewModelProxy;
  const viewModel = component.viewModel;
  if (isParentPrimitive) {
    viewModelProxy[path] = value;
  } else {
    const indexes = component.stackIndexes.current ?? [];
    const lastIndex = (last === "*") ? indexes[level] : last;
    Reflect.get(viewModel, path, viewModelProxy)[lastIndex] = value;
  }
  return true;
}

/**
 * デフォルトのgetter
 * @param {Component} component 
 * @returns {(name:string)=>(()=>any)}
 */
const defaultGetterPrimitive = (component, name) => () => {
  const viewModelProxy = component.viewModelProxy;
  const viewModel = component.viewModel;
  return Reflect.get(viewModel, "__" + name, viewModelProxy);
}

/**
 * デフォルトのsetter
 * @param {Component} component 
 * @returns {(name:string)=>((value:any)=>true)}
 */
const defaultSetterPrimitive = (component, name) => value => {
  const viewModelProxy = component.viewModelProxy;
  const viewModel = component.viewModel;
  Reflect.set(viewModel, "__" + name, value, viewModelProxy)
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

const createDefaultDesc = 
  (component, definedProperty) => {
    const { path, last, level, isParentPrimitive } = definedProperty;
    return {
      get: () => defaultGetter(component, path, last, level, isParentPrimitive)(),
      set: v => defaultSetter(component, path, last, level, isParentPrimitive)(v),
      enumerable: true, 
      configurable: true,
    }
  }
;

const createDefaultPrimitiveDesc = 
  (component, name) => {
    return {
      get: () => defaultGetterPrimitive(component, name)(),
      set: v => defaultSetterPrimitive(component, name)(v),
      enumerable: true, 
      configurable: true,
    }
  }
;

const createDefaultGlobalPrimitiveDesc = 
  path => {
    return {
      get: () => defaultGetterGlobalPrimitive(path)(),
      set: v => defaultSetterGlobalPrimitive(path)(v),
      enumerable: true, 
      configurable: true,
    }
  }
;

const createPrivateDesc = value => ({
  value,
  writable: true, 
  enumerable: true, 
  configurable: true,
});

export default class {

  static build(component, viewModel = component.viewModel) {
    // プライベートプロパティ __で始まる
    // コンテキストプロパティ $で始まる
    // グローバルプロパティ $$で始まる
    const descByProp = new Map;
    const setOfPrivateProps = new Set(Object.keys(viewModel).filter(prop => prop.startsWith("__")));
    const setOfContextProps = new Set(Object.keys(viewModel).filter(prop => prop[0] === "$" && prop[1] !== "$"));
    const setOfGlobalProps = new Set(Object.keys(viewModel).filter(prop => prop.startsWith("$$")));
    const importProps = [];

    const createDesc = (name, value = null) => {
      if (setOfGlobalProps.has(name)) {
        descByProp.set(name, createDefaultGlobalPrimitiveDesc(name));
      } else {
        const definedProperty = DefinedProperty.create(name);
        if (!definedProperty.isPrimitive) {
          descByProp.set(name, createDefaultDesc(component, definedProperty));
        } else {
          descByProp.set(name, createDefaultPrimitiveDesc(component, name));
          if (!setOfPrivateProps.has(definedProperty.privateName)) {
            Object.defineProperty(viewModel, definedProperty.privateName, createPrivateDesc(value));
            setOfPrivateProps.add(definedProperty.privateName);
          }
        }
      }
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
      createDesc(prop, value);
    }

    // ViewModelのアクセサのthisをViewModelProxyにする
    for(const [prop, desc] of Object.entries(Object.getOwnPropertyDescriptors(Object.getPrototypeOf(viewModel)))) {
      if (prop === "constructor") continue;
      if (utils.isFunction(desc.value)) continue;

      if (!descByProp.has(prop)) {
        createDesc(prop);
      }
      const curDesc = descByProp.get(prop);
      if (desc.get) {
        curDesc.get = () => applyGetter(component)(desc.get)();
      }
      if (desc.set) {
        curDesc.set = v => applySetter(component)(desc.set)(v);
      }
    }

    const removeProps = Object.keys(viewModel).filter(prop => !setOfPrivateProps.has(prop) && !setOfContextProps.has(prop));
    removeProps.forEach(prop => delete viewModel[prop]);
    Array.from(descByProp.entries()).forEach(([prop, desc]) => Object.defineProperty(viewModel, prop, desc));
    const publicProps = Object.keys(viewModel).concat(importProps);
    const definedProperties = publicProps.map(name => DefinedProperty.create(name));
    // 配列と思われるプロパティの取得
    const arrayProps = publicProps.filter(prop => `${prop}.*` in viewModel);
    // 関係のあるプロパティ
    const setOfRelativePropsByProp = new Map;
    definedProperties
      .reduce((map, prop) => {
        map.set(prop.name, new Set(definedProperties.filter(_prop => _prop.setOfParentPath.has(prop.name)).map(prop => prop.name)));
        return map;
      }, setOfRelativePropsByProp);
    return { importProps, arrayProps, setOfRelativePropsByProp, definedProperties };

  }

}