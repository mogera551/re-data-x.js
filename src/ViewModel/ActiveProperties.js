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
    return activeProperties.filter(activeProperty => activeProperty.indexes.slice(0, indexes.length).toString() === compString);
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
      activeProperties.forEach(activeProperty => {
        callback(activeProperty);
        walk(activeProperty.path);
      })
    }
    walk(parentPath);
  }

  /**
   * 
   */
  build() {
    const activePropertiesByName = this.activePropertiesByName;
    const activePropertiesByParentPath = this.activePropertiesByParentPath;
    this.forEach(activeProperty => {
      let activeProperties;
      if (activePropertiesByParentPath.has(activeProperty.parentPath)) {
        activeProperties = activePropertiesByParentPath.get(activeProperty.parentPath);
      } else {
        activeProperties = [];
        activePropertiesByParentPath.set(activeProperty.parentPath, activeProperties);
      }
      activeProperties.push(activeProperty);

      let tempActiveProperties;
      if (activePropertiesByName.has(activeProperty.name)) {
        tempActiveProperties = activePropertiesByName.get(activeProperty.name);
      } else {
        tempActiveProperties = [];
        activePropertiesByName.set(activeProperty.name, tempActiveProperties);
      }
      tempActiveProperties.push(activeProperty);
    });
  }

  /**
   * 
   * @param {ViewModelProxy} viewModel 
   */
  static create(viewModel) {
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
        sameLevelProps.forEach(prop => expandsByName.set(prop.name, [ActiveProperty.createByNameAndIndexes(prop.name)]));
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
                return ActiveProperty.createByNameAndIndexes(targetProp.name, parentProp.indexes.concat(key));
              });
              expandPropsOnTarget.push(...addProps);
            });
            expandsByName.set(targetProp.name, expandPropsOnTarget);
          })
        } else {
          const values = viewModel.$getValue(expandProp.parentPath, [], expandProp.parentPath);
          targetProps.forEach(targetProp => {
            const addProps = Object.keys(values).map(key => {
              return ActiveProperty.createByNameAndIndexes(targetProp.name, [key]);
            });
            expandsByName.set(targetProp.name, addProps);
          });
  
        }
      })

    }
    const activeProperties =  new ActiveProperties(Array.from(expandsByName.values()).flatMap(value => value).map(value => [value.path, value]));
    activeProperties.build();
    return activeProperties;
  }


}