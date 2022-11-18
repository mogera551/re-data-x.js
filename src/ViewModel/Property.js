import Utils from "../utils.js";

/**
 * 
 */
export default class ViewModelProperty {
  /**
   * プロパティ名
   * @type {string}
   */
  prop;
  /**
   * ループのインデックス
   * @type {Array<integer>}
   */
  indexes;
  /**
   * プロパティ名をループインデックス展開したもの
   * 例
   * prop: "list.*.name"
   * indexes: [12]
   * path: "list.12.name"
   * @type {string}
   */
  path;
  /**
   * @type {RegExp}
   */
  regexp;
  /**
   * *の数
   * @type {integer}
   */
  level;
  
  /**
   * コンストラクタ
   * @param {string} prop プロパティ名
   * @param {integer[]} indexes ループインデックス
   * @param {string} path パス：プロパティ名をループインデックス展開したもの
   * @param {boolean?} isExpandable プロパティが展開可能かどうか（prop.*が存在する場合、true）
   */
  constructor(prop, indexes, path, isExpandable = false) {
    this.prop = prop;
    this.indexes = indexes?.slice(0) ?? [];
    this.path = path;
    //console.log(prop, indexes, path);
    this.isExpandable = isExpandable;
    this.regexp = isExpandable ? new RegExp("^" + this.prop.replaceAll("*", "(\\w+)").replaceAll(".", "\\.") + "$") : null;
    this.level = this.prop.match(/\*/g)?.length ?? 0;
    this.propIndexes = this.indexes.slice(- this.level) ?? [];
    const paths = path.split(".").slice(-1);
    const parentPaths = [ paths.join(".") ];
    for(let i = 1; i < paths.length; i++) {
      parentPaths.push(paths.slice(0, - i).join("."));
    }
    this.setOfParentPaths = new Set(parentPaths);
  }

  /**
   * 
   * @param {Proxy} viewModelProxy 
   * @param {ViewModelProperty} viewModelProperty 
   * @returns {any}
   */
  static getValue(viewModelProxy, viewModelProperty) {
    return viewModelProxy.$getValue(viewModelProperty.prop, viewModelProperty.indexes, viewModelProperty.path);
  }

  /**
   * 
   * @param {Proxy} viewModelProxy 
   * @param {ViewModelProperty} viewModelProperty 
   * @returns {true}
   */
  static setValue(viewModelProxy, viewModelProperty, value) {
    viewModelProxy.$setValue(viewModelProperty.prop, viewModelProperty.indexes, viewModelProperty.path, value);
    return true;
  }

  /**
   * @type {Map<string,ViewModelProperty>}
   */
  static cache = new Map();
  /**
   * @type {Array<ViewModelProperty>}
   */
  static expandableProperties = [];

  static create(prop, indexes = null) {
    const path = indexes ? Utils.getPath(prop, indexes) : prop;
    const isExpandable = prop === path && prop.includes("*");
    const viewModelProperty = new ViewModelProperty(prop, indexes, path, isExpandable);
    if (isExpandable) this.expandableProperties.push(viewModelProperty);
    return viewModelProperty;
/*
    const viewModelProperty = this.cache.get(path);
    if (viewModelProperty != null) return viewModelProperty;

    const isExpandable = prop === path && prop.includes("*");
    let newViewModelProperty;
    if (isExpandable) {
      newViewModelProperty = new ViewModelProperty(prop, indexes, path, isExpandable);
      this.expandableProperties.push(newViewModelProperty)
    } else {
      const maybeArray = prop.includes(".");
      if (maybeArray) {
        for(const exProp of this.expandableProperties) {
          const results = exProp.regexp.exec(prop);
          if (results) {
            indexes = results.slice(1);
            newViewModelProperty = new ViewModelProperty(exProp.prop, indexes, prop);
            break;
          }
        }
      }
      if (newViewModelProperty == null) {
        newViewModelProperty = new ViewModelProperty(prop, [], prop);
      }
    }

    this.cache.set(path, newViewModelProperty);
    return newViewModelProperty;
*/
  }

}
