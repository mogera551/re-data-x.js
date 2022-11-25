import utils from "../utils.js";

/**
 * 定義済みプロパティ
 * ViewModelのbuild時に登録してもらう
 */
export default class DefinedProperty {
  name; // "list", "list.*"
  paths = [];
  level;
  regexp;
  /**
   * コンストラクタ
   * @param {string} name プロパティ名
   */
  constructor(name) {
    // name = list.*.id
    // paths = [list, *, id]
    // last = id
    // level = 1
    // regexp = ^list\.[w+]\.id$
    // parentPaths = [ list, * ]
    // parentPath = list.*
    // listParentPaths = [ [ list, * ], [ list ] ]
    // parentPathsByPath = { "list.*" => [ list, * ], "list" => [ list ] }
    // setOfParentPath = { "list.*" , "list"  }
    // setOfExpandPath = { "list.*" }
    // isPrimitive = false
    // isParentPrimitive = false
    // privateName = null
    this.name = name;
    this.paths = name.split(".");
    this.last = this.paths.at(-1);
    this.level = name.match(/\*/g)?.length ?? 0;
    this.regexp = (this.level > 0) ? new RegExp("^" + name.replaceAll("*", "(\\w+)").replaceAll(".", "\\.") + "$") : null;
    this.listParentPaths = [];
    //this.listParentPaths.push(this.paths);
    for(let i = 1; i < this.paths.length; i++) {
      this.listParentPaths.push(this.paths.slice(0, -i));
    }
    this.parentPathsByPath = new Map();
    this.setOfParentPath = new Set();
    this.setOfExpandPath = new Set();
    this.listParentPaths.forEach(paths => {
      const path = paths.join(".");
      this.setOfParentPath.add(path);
      path.at(-1) === "*" && this.setOfExpandPath.add(path.slice(0, -2));
      this.parentPathsByPath.set(path, paths);
    });
    this.parentPaths = this.listParentPaths[0] ?? [];
    this.parentPath = this.parentPaths.join(".");
    this.isPrimitive = this.parentPaths.length === 0;
    this.isParentPrimitive = this.parentPaths.length === 1;
    this.privateName = this.isPrimitive ? "__" + name : null;
  }

  /**
   * 
   * @param {integer[]} indexes 
   */
  getNameByIndexes(indexes) {
    return utils.getPath(this.name, indexes);
  }

  /**
   * @type {Map<string,DefinedProperty>}
   */
  static propByName = new Map();
  /**
   * ViewModelのBuild時、定義されたプロパティを登録
   * @param {string} name プロパティ名
   * @returns 
   */
  static create(name) {
    if (this.propByName.has(name)) {
      return this.propByName.get(name);
    } else {
      const prop = new DefinedProperty(name);
      this.propByName.set(name, prop);
      return prop;
    }
  }
}
