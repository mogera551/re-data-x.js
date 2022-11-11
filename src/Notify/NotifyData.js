import Utils from "../utils.js";
/**
 * 更新したViewModelのプロパティの情報
 */
export default class NotifyData {
  /**
   * コンポーネント
   * @type {BaseComponent} 
   */
  component;
  /**
   * 更新したViewModelのプロパティ名
   * @type {string} 
   */
  prop;
  /**
   * 更新したViewModelのループインデックス
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
   * コンポーネント内でのユニークキー（同一プロパティの重複を排除したいので）
   * 書式：
   * プロパティ名\tループインデックスのjoin(\t)
   * @type {string}
   */
  key;

  /**
   * コンストラクタ
   * @param {BaseComponent} component 
   * @param {string} prop 
   * @param {Array<integer>} indexes 
   */
  constructor(component, prop, indexes) {
    // console.log("NotifyData", component.tagName, prop, (indexes ?? []).join(","))
    const safeIndexes = indexes ?? [];
    this.component = component;
    this.prop = prop;
    this.indexes = safeIndexes;
    this.path = Utils.getPath(prop, safeIndexes);
    this.indexesKey = this.indexes.join("\t");
    this.key =`${this.prop}\t${this.indexesKey}`;
  }
}