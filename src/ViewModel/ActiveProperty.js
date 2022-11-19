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

  static buildByViewModel(viewModel) {
    const isPrivateOrGlobalOrSpecial = name => (name[0] === "_" && name[1] === "_") || (name[0] === "$");
    const names = Object.keys(viewModel).filter(name => !isPrivateOrGlobalOrSpecial(name));
    const definedProps = names.map(name => DefinedProperty.create(name));
    const maxLevel = definedProps.reduce((max, prop) => (max === null || max < prop.level) ? prop.level : max, null);

    /**
     * @type {Map<string,ActiveProperty[]>}
     */
    const expandsByName = new Map();
    for(let level = 0; level <= maxLevel; level++) {
      const sameLevelProps = definedProps.filter(prop => prop.level === level);
      if (level === 0) {
        sameLevelProps.forEach(prop => expandsByName.set(prop.name, [this.createByNameAndIndexes(prop.name)]));
        continue;
      }
      const expandableProps = sameLevelProps.filter(prop => prop.last === "*");
      expandableProps.forEach(expandableProp => {
        // リストの展開
        // 対象となるプロパティ
        const targetProps = [expandableProp].concat(sameLevelProps.filter(prop => prop.setOfExpandPath.has(expandableProp.parentPath)));
        if (expandsByName.has(expandableProp.parentPath)) {
          const parentProps = expandsByName.get(expandableProp.parentPath);
          targetProps.forEach(targetProp => {
            const expandPropsOnTarget = [];
            parentProps.forEach(parentProp => {
              const values = viewModel.$getValue(parentProp.definedProp.name, parentProp.indexes, parentProp.path);
              const addProps = Object.keys(values).map(key => {
                return this.createByNameAndIndexes(targetProp.name, parentProp.indexes.concat(key));
              });
              expandPropsOnTarget.push(...addProps);
            });
            expandsByName.set(targetProp.name, expandPropsOnTarget);
          })
        } else {
          const values = viewModel.$getValue(expandProp.parentPath, [], expandProp.parentPath);
          targetProps.forEach(targetProp => {
            const addProps = Object.keys(values).map(key => {
              return this.createByNameAndIndexes(targetProp.name, [key]);
            });
            expandsByName.set(targetProp.name, addProps);
          });
  
        }
      })

    }
    const activePropertyByPath =  new Map(Array.from(expandsByName.values()).flatMap(value => value).map(value => [value.path, value]));
    const activePropertiesByParentPath =new Map();

    activePropertyByPath.forEach(activeProperty => {
      let activeProperties;
      if (activePropertiesByParentPath.has(activeProperty.parentPath)) {
        activeProperties = activePropertiesByParentPath.get(activeProperty.parentPath);
      } else {
        activeProperties = [];
        activePropertiesByParentPath.set(activeProperty.parentPath, activeProperties);
      }
      activeProperties.push(activeProperty);
    });

    return {
      activePropertyByPath, activePropertiesByParentPath
    }
    //console.log(new Map(Array.from(expandsByName.values()).flatMap(value => value).map(value => [value.path, value])));
  }
}
