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
    this.last = this.paths[this.paths.length - 1] ?? null;
    this.level = name.match(/\*/g)?.length ?? 0;
    this.regexp = (this.level > 0) ? new RegExp("^" + name.replaceAll("*", "(\\w+)").replaceAll(".", "\\.") + "$") : null;
    this.closestListName = null;
    this.listPaths = [ this.paths ];
    for(let i = 1; i < this.paths.length; i++) {
      this.listPaths.push(this.paths.slice(0, -i));
    }
    for(let i = 0; i < this.paths.length; i++) {
      const paths = this.listPaths[i];
      if (paths[paths.length - 1] === "*" && this.closestListName === null) {
        this.closestListName = paths.slice(0, -1).join(".");
      }
    }

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
      if (path.at(-1) === "*") {
        const expandPath = path.slice(0, -2);
        this.setOfExpandPath.add(expandPath);
      }
      this.parentPathsByPath.set(path, paths);
    });
    this.parentPaths = this.listParentPaths[0] ?? [];
    this.parentPath = this.parentPaths.join(".");
    this.isPrimitive = this.parentPaths.length === 0;
    this.isParentPrimitive = this.parentPaths.length === 1;
    this.privateName = this.isPrimitive ? "__" + name : null;
    this.isExpandable = this.level > 0;
    this.isObjective = !this.isExpandable && this.paths.length > 0;
    this.isVariable = this.level > 0;
    this.isGlobal = this.name.startsWith("$$");
    this.isContext = !this.isGlobal && this.name[0] === "$";
  }

  /**
   * 
   * @param {integer[]} indexes 
   */
  getNameByIndexes(indexes) {
    return utils.getPath(this.name, indexes);
  }

  /**
   * @param {DefinedProperty} comp
   */
  compare(comp) {
    if (this === comp) return 0;
    const diffLevel = this.level - comp.level;
    if (diffLevel !== 0) return diffLevel;
    const diffPaths = this.paths.length - comp.paths.length;
    if (diffPaths !== 0) return diffPaths;
    for(let i = 0; i < this.paths.length; i++) {
      if (this.paths[i] === comp.paths[i]) continue;
      return (this.paths[i] < comp.paths[i]) ? -1 : 1;
    }
    return 0;
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
