import utils from "../utils.js";
import ActiveProperty from "./ActiveProperty.js";
import DefinedProperty from "./DefinedProperty.js";

// path ... list.1.name
// name ... list.*.name

class ActivePropertyProfile {
  /**
   * @type {ActiveProperty}
   */
  activeProperty;
  /**
   * @type {integer[]}
   */
  keys;
  /**
   * @type {}
   */

  /**
   * 
   * @param {ActivePropertyProfile} comp 
   */
  compare(comp) {
    return this.activeProperty.compare(comp.activeProperty);
  }

}

export default class ActiveProperties2 {
  /**
   * @type {ActiveProperty[]}
   */
  fixedActiveProperties = [];
  /**
   * @type {Map<DefinedProperty,ActiveProperty[]>}
   */
  variableActivePropertiesByProp = new Map;
  /**
   * @type {ActiveProperty[]}
   */
  activeProperties = [];
  /**
   * @type {Map<path,ActiveProperty>}
   */
  activePropertyByPath = new Map;
  /**
   * @type {Map<name,ActiveProperty[]>}
   */
  activePropertiesByName = new Map;
  /**
   * @type {Map<name,ActiveProperty[]>}
   */
  activePropertiesByParentPath = new Map;

  /**
   * $,$$は含まない
   * @type {DefinedProperty[]}
   */
  definedProperties;
  /**
   * @type {Map<string,DefinedProperty>}
   */
  definedPropertyByName;
  /**
   * 配列の値を持つプロパティ
   * ex. 
   *   list.* => list
   *   list.*.names.* => list.*.names
   * @type {DefinedProperty[]} 
   */
  definedPropertiesOfList;

  /**
   * @type {ActivePropertyProfile[]}
   */
  lastProfiles = [];

  /**
   * 
   * @param {string} path 
   * @returns {ActiveProperty}
   */
  get(path) {
    return this.activePropertyByPath.get(path);
  }

  /**
   * 
   * @param {string} path 
   * @returns {boolean}
   */
  has(path) {
    return this.activePropertyByPath.has(path);
  }

  /**
   * 
   * @param {string} name 
   * @param {integer[]} indexes 
   * @returns {ActiveProperty[]}
   */
   search(name, indexes) {
    const activeProperties = this.activePropertiesByName.get(name) ?? [];
    const compString = indexes.toString();
    const isTopLevel = indexes.length === 0;
    return activeProperties.filter(property => isTopLevel ? true : property.indexesStrings[indexes.length - 1] === compString);
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
   * @param {DefinedProperty[]} definedProperties 
   */
  constructor(definedProperties) {
    this.definedProperties = definedProperties.filter(prop => !prop.isGlobal && !prop.isContext);
    this.definedPropertyByName = new Map(this.definedProperties.map(prop => [prop.name, prop]));
    this.definedPropertiesOfList = 
      this.definedProperties.filter(prop => prop.last === "*").map(prop => this.definedPropertyByName.get(prop.parentPath));
    this.definedPropertiesByClosestListName = new Map();
    this.definedPropertyByName.forEach(prop => {
      if (this.definedPropertiesByClosestListName.has(prop.closestListName)) {
        this.definedPropertiesByClosestListName.get(prop.closestListName).push(prop);
      } else {
        this.definedPropertiesByClosestListName.set(prop.closestListName, [prop]);
      }
    });
    this.fixedActiveProperties = this.definedProperties.filter(prop => !prop.isVariable).map(prop => ActiveProperty.create(prop.name, []));
  }

  /**
   * 
   * @param {Object<string,any>} viewModel 
   */
  build(viewModel) {
    /**
     * @type {ActivePropertyProfile[]}
     */
    const profiles = [];
    this.definedPropertiesOfList.filter(prop => prop.level === 0).forEach(parentProp => {
      const walk = (parentProp, indexes) => {
        const activeProperty = ActiveProperty.create(parentProp.name, indexes);
        //console.log(activeProperty);
        const values = viewModel.$getValue(activeProperty);
        const keys = Object.keys(values);
        profiles.push(Object.assign(new ActivePropertyProfile, { activeProperty, keys }));
        const closestChildProps = this.definedPropertiesOfList.filter(prop => prop.closestListName === parentProp.name);
        for(const closestChildProp of closestChildProps) {
          for(const key in keys) {
            walk(closestChildProp, indexes.concat(key));
          }
        }
      }
      walk(parentProp, []);

    });
    profiles.sort((p1, p2) => p1.compare(p2))
    let changed = false;

    /**
     * 
     * @param {ActivePropertyProfile} profile 
     * @param {integer[]} diffKeys 
     * @returns {[DefinedProperty,ActiveProperty[]]}
     */
    const appendProperties = (profile, diffKeys) => {
      const definedProps = this.definedPropertiesByClosestListName.get(profile.activeProperty.name);
      return definedProps.map(definedProp => {
        const appendProperties = diffKeys.map(key => ActiveProperty.create(definedProp.name, profile.activeProperty.indexes.concat(key)));
        if (this.variableActivePropertiesByProp.has(definedProp)) {
          this.variableActivePropertiesByProp.get(definedProp).push(...appendProperties);
        } else {
          this.variableActivePropertiesByProp.set(definedProp, appendProperties);
        }
        changed = true;
//        return [definedProp, appendProperties];
      });
    };
    /**
     * 
     * @param {ActivePropertyProfile} profile 
     * @param {integer[]} diffKeys 
     * @returns {[DefinedProperty,string[]]}
     */
    const removeProperties = (profile, start) => {
      const definedProps = this.definedPropertiesByClosestListName.get(profile.activeProperty.name);
      return definedProps.map(definedProp => {
        //const removeKeys = diffKeys.map(key => parentDefinedProp.name + "\t" + profile.activeProperty.indexes.concat(key).toString());
        if (this.variableActivePropertiesByProp.has(definedProp)) {
          if (start === null) {
            this.variableActivePropertiesByProp.delete(definedProp);
          } else {
            const array = this.variableActivePropertiesByProp.get(definedProp);
            array.splice(start);
          }
          changed = true;
        }
//        return [definedProp, diffKeys];
      });
    };

    const lastProfiles = this.lastProfiles;
    let [counter, lastCounter] = [ 0, 0 ];
    /**
     * @type { [ActivePropertyProfile,ActivePropertyProfile] }
     */
    let [profile, lastProfile] = [ null, null ];
    while(profiles[counter] != null || lastProfiles[lastCounter] != null) {
      profile = profiles[counter] ?? null;
      lastProfile = lastProfiles[lastCounter] ?? null;
      if (profile === null && lastProfile !== null) {
        removeProperties(lastProfile, null);
        lastCounter++;
      } else if (profile !== null && lastProfile === null) {
        appendProperties(profile, profile.keys);
        counter++;
      } else {
        const resultComp = profile.compare(lastProfile);
        if (resultComp < 0) {
          appendProperties(profile, profile.keys);
          counter++;
        } else if (resultComp > 0) {
          removeProperties(lastProfile, null);
          lastCounter++;
        } else {
          if (profile.keys.length === lastProfile.keys.length) {
          } else {
            const diff = profile.keys.length - lastProfile.keys.length;
            if (diff > 0) {
              const appendKeys = profile.keys.slice(lastProfile.keys.length, profile.keys.length);
              appendProperties(profile, appendKeys);
            } else {
              removeProperties(lastProfile, profile.keys.length);
            }
          }
          counter++;
          lastCounter++;
        }
      }

    }
    //console.log(appendingProperties);
    //console.log(deletingProperties);
    this.lastProfiles = profiles;
    if (changed || (this.fixedActiveProperties.length > 0 && this.activeProperties.length === 0)) {
      const activeProperties = this.fixedActiveProperties.slice();
      this.variableActivePropertiesByProp.forEach(properties => {
        activeProperties.push(...properties);
      });
      const mapByPath = new Map(activeProperties.map(prop => [prop.path, prop]));
      const mapByName = new Map;
      activeProperties.forEach(prop => mapByName.has(prop.name) ? mapByName.get(prop.name).push(prop) : mapByName.set(prop.name, [prop]));
      const mapByParentPath = new Map;
      activeProperties.forEach(prop => mapByParentPath.has(prop.parentPath) ? mapByParentPath.get(prop.parentPath).push(prop) : mapByParentPath.set(prop.parentPath, [prop]));
      this.activeProperties = activeProperties;
      this.activePropertyByPath = mapByPath;
      this.activePropertiesByName = mapByName;
      this.activePropertiesByParentPath = mapByParentPath;
    }
  }

}