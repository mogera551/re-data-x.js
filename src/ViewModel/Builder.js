import utils from "../utils.js";
import globals from "../Globals/Globals.js";
import ViewModelProperty from "./Property.js";
import {Component} from "../Component/WebComponent.js";

/**
 * デフォルトのgetter
 * @param {Component} component 
 * @param {Proxy?} viewModelProxy 
 * @returns {(path:string,last:string)=>(()=>any)}
 */
const defaultGetter = (component, viewModelProxy = component.viewModelProxy) => (path, last) => () => {
  const indexes = component.stackIndexes.current ?? [];
  const lastIndex = (last === "*") ? indexes.at(path.match(/\*/g)?.length) : last;
  return viewModelProxy[path]?.[lastIndex] ?? "";
}

/**
 * デフォルトのsetter
 * @param {Component} component 
 * @param {Proxy} viewModelProxy 
 * @returns {(path:string,last:string)=>((value:any)=>true)}
 */
const defaultSetter = (component, viewModelProxy = component.viewModelProxy) => (path, last) => value => {
  const indexes = component.stackIndexes.current ?? [];
  const lastIndex = (last === "*") ? indexes.at(path.match(/\*/g)?.length) : last;
  viewModelProxy[path][lastIndex] = value;
  return true;
}

/**
 * デフォルトのgetter
 * @param {Component} component 
 * @param {Proxy?} viewModelProxy 
 * @returns {(path:string)=>(()=>any)}
 */
const defaultGetterPrimitive = (component, viewModelProxy = component.viewModelProxy) => path => () => {
  const privatePath = `__${path}`;
  return viewModelProxy?.[privatePath] ?? "";
}

/**
 * デフォルトのsetter
 * @param {Component} component 
 * @param {Proxy} viewModelProxy 
 * @returns {(path:string)=>((value:any)=>true)}
 */
const defaultSetterPrimitive = (component, viewModelProxy = component.viewModelProxy) => path => value => {
  const privatePath = `__${path}`;
  viewModelProxy[privatePath] = value;
  return true;
}

/**
 * デフォルトのgetter
 * @param {string} path 
 * @returns {any}
 */
const defaultGetterGlobalPrimitive = path => () => {
  const propName = path.slice(2); // 先頭$$をスキップ
  return globals?.[propName] ?? "";
}

/**
 * デフォルトのsetter
 * @param {string} path 
 * @returns {(value:any)=>true}
 */
const defaultSetterGlobalPrimitive = path => value => {
  const propName = path.slice(2); // 先頭$$をスキップ
  globals[propName] = value;
  return true;
}

const applyGetter = (component, viewModelProxy = component.viewModelProxy) => getter => () => {
  return Reflect.apply(getter, viewModelProxy, []);
}

const applySetter = (component, viewModelProxy = component.viewModelProxy) => setter => value => {
  return Reflect.apply(setter, viewModelProxy, [value]);
}

const createDefaultDesc = 
  component => 
  (path, last) => {
    return {
      get: () => defaultGetter(component)(path, last)(),
      set: v => defaultSetter(component)(path, last)(v),
      enumerable: true, 
      configurable: true,
    }
  }
;

const createDefaultPrimitiveDesc = 
  component => 
  path => {
    return {
      get: () => defaultGetterPrimitive(component)(path)(),
      set: v => defaultSetterPrimitive(component)(path)(v),
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
    const descByProp = new Map;
    const setOfPrivateProps = new Set(Object.keys(viewModel).filter(prop => prop.startsWith("__")));
    const importProps = [];
    //const arrayProps = [];

    const createDesc = (prop, value = null) => {
      const paths = prop.split(".");
      if (paths.length > 1) {
        const last = paths.pop();
//        const path = paths.join(".");
        const path = prop.slice(0, - last.length - 1);
        descByProp.set(prop, createDefaultDesc(component)(path, last));
      } else {
        const path = prop;
        if (path.startsWith("$$")) {
          descByProp.set(prop, createDefaultGlobalPrimitiveDesc(path));
        } else {
          descByProp.set(prop, createDefaultPrimitiveDesc(component)(path));
          const privatePath = `__${path}`;
          if (!setOfPrivateProps.has(privatePath)) {
            //descByProp.set(privatePath, createPrivateDesc(value));
            Object.defineProperty(viewModel, privatePath, createPrivateDesc(value));
            setOfPrivateProps.add(privatePath);
          }
        }
      }
    };
    
    for(const [prop, value] of Object.entries(viewModel)) {
      if (setOfPrivateProps.has(prop)) continue;
      if (value === Symbol.for("import")) {
        // importなのでdata-bindプロパティの展開処理
        importProps.push(prop);
        continue;
      }
      createDesc(prop, value);
    }

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

    const removeProps = Object.keys(viewModel).filter(prop => !setOfPrivateProps.has(prop));
    removeProps.forEach(prop => delete viewModel[prop]);
    for(const [prop, desc] of descByProp.entries()) {
      Object.defineProperty(viewModel, prop, desc);
      ViewModelProperty.create(prop);
    }
    const publicProps = Object.keys(viewModel);
    // 配列と思われるプロパティの取得
    const arrayProps = publicProps.filter(prop => `${prop}.*` in viewModel);
    // 関係のあるプロパティ
    const setOfRelativePropsByProp = new Map;
    publicProps
      .reduce((map, prop) => {
        const relateProp = `${prop}.`;
        map.set(prop, new Set(publicProps.filter(_prop => _prop.startsWith(relateProp))));
        return map;
      }, setOfRelativePropsByProp);
//console.log(arrayProps.join(","));
    return { importProps, arrayProps, setOfRelativePropsByProp };

  }

}