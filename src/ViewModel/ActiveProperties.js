import ActiveProperty from "./ActiveProperty.js";
import DefinedProperty from "./DefinedProperty.js";

export default class ActiveProperties extends Map {
  activePropertiesByName = new Map();
  activePropertiesByParentPath = new Map();

  /**
   * 
   * @param {string} name 
   * @param {integer[]} indexes 
   * @returns {ActiveProperty[]}
   */
  search(name, indexes) {
    const activeProperties = this.activePropertiesByName.get(name) ?? [];
    const compString = indexes.toString();
    return activeProperties.filter(property => indexes.length === 0 ? true : property.indexesStrings[indexes.length - 1] === compString);
  }

  /**
   * 
   * @param {string} parentPath 
   * @param {(activeProperty:ActiveProperty)=>{}} callback 
   */
  walkByParentPath(parentPath, callback) {
    const activePropertiesByParentPath = this.activePropertiesByParentPath;
    const walk = parentPath => {
      const activeProperties = activePropertiesByParentPath.get(parentPath) ?? [];
      activeProperties.forEach(property => {
        callback(property);
        walk(property.path);
      })
    }
    walk(parentPath);
  }

  /**
   * 
   */
  build() {
    const mapByName = this.activePropertiesByName;
    this.forEach(prop => mapByName.has(prop.name) ? mapByName.get(prop.name).push(prop) : mapByName.set(prop.name, [prop]));
    const mapByPath = this.activePropertiesByParentPath;
    this.forEach(prop => mapByPath.has(prop.parentPath) ? mapByPath.get(prop.parentPath).push(prop) : mapByPath.set(prop.parentPath, [prop]));
  }

  /**
   * 定義済みプロパティからプロパティを展開する
   * @param {ViewModelProxy} viewModel 
   * @returns {ActiveProperties}
   */
  static create(viewModel) {
    const isPrivateOrGlobalOrSpecial = name => (name[0] === "_" && name[1] === "_") || (name[0] === "$");
    const names = Object.keys(viewModel).filter(name => !isPrivateOrGlobalOrSpecial(name));
    const definedProps = names.map(name => DefinedProperty.create(name));
    const maxLevel = definedProps.reduce((max, prop) => (max === null || max < prop.level) ? prop.level : max, null);

    /**
     * @type {map<string,integer[]>}
     */
    const cacheKeysByPath = new Map();
    /**
     * 
     * @param {string} name 
     * @param {integer[]} indexes 
     * @param {string} path 
     * @returns {integer[]}
     */
    const getKeys = (name, indexes, path) => {
      if (cacheKeysByPath.has(path)) return cacheKeysByPath.get(path);
      const value = viewModel.$getValue(name, indexes, path);
      const keys = Object.keys(value);
      cacheKeysByPath.set(path, keys);
      return keys;
    };
    /**
     * @type {ActiveProperty[]}
     */
    const listActiveProperty = [];
    /**
     * 
     * @param {string} name 
     * @param {integer[]} indexes 
     * @returns {ActiveProperty}
     */
    const createActiveProperty = (name, indexes) => {
      const activeProperty = ActiveProperty.create(name, indexes);
      listActiveProperty.push(activeProperty);
      return activeProperty;
    }
    /**
     * @type {Map<string,ActiveProperty[]>}
     */
    const expandsByName = new Map();
    // レベル：＊の数
    // 定義済みプロパティをレベルの数で分類
    const definedPropsByLevel = definedProps.reduce((map, prop) => map.has(prop.level) ? (map.get(prop.level).push(prop), map) : map.set(prop.level, [prop]), new Map);
    // レベル毎に処理
    for(let level = 0; level <= maxLevel; level++) {
      const sameLevelDefinedProps = definedPropsByLevel.get(level) ?? [];
      if (level === 0) {
        sameLevelDefinedProps.forEach(prop => expandsByName.set(prop.name, [createActiveProperty(prop.name)]));
        continue;
      }
      // 展開可能な定義済みプロパティ → 最後が＊で終わっているもの ex. list.*、list.*.names.*など
      const expandableProps = sameLevelDefinedProps.filter(prop => prop.last === "*");
      expandableProps.forEach(expandableProp => {
        // リストの展開
        // 対象となる定義済みプロパティ → 展開可能な定義済みプロパティとそのプロパティ名を含むプロパティ
        // ex. 展開可能な定義済みプロパティ：list.*.names.*
        //     そのプロパティを親にもつプロパティ：list.*.names.*.first、list.*.names.*.family
        const targetDefinedProps = [expandableProp].concat(sameLevelDefinedProps.filter(prop => prop.setOfExpandPath.has(expandableProp.parentPath)));
        // 展開可能な定義済みプロパティの親要素（すでに展開されている）の展開したプロパティ
        // ex. 展開可能な定義済みプロパティの親要素：list.*.names
        //     展開したプロパティ：list.0.names、list.1.names、list.2.names
        const parentProps = expandsByName.get(expandableProp.parentPath);
        targetDefinedProps.forEach(definedProp => {
          const expandPropsOnTarget = [];
          parentProps.forEach(parentProp => {
            // 展開したプロパティの値のインデックス配列を取得
            // ex. list.0.namesの値のインデックス配列
            //     list.1.namesの値のインデックス配列
            //     list.n.namesの値のインデックス配列
            const indexes = getKeys(parentProp.name, parentProp.indexes, parentProp.path);
            // インデックス配列分ループ
            indexes.forEach(index => expandPropsOnTarget.push(createActiveProperty(definedProp.name, parentProp.indexes.concat(index))));
          });
          expandsByName.set(definedProp.name, expandPropsOnTarget);
        })
      })
    }
    /**
     * @type {ActiveProperties}
     */
    const activeProperties =  new ActiveProperties(listActiveProperty.map(value => [value.path, value]));
    activeProperties.build();
    return activeProperties;
  }


}