export default class UpdateNodeData {
  /**
   * 更新するノード
   * @type {Node}
   */
  node;
  /**
   * 更新するプロパティ名のリスト
   * @type {string[]}
   */
  props;
  /**
   * 更新を実施する関数
   * @type {()=>{}}
   */
  proc;

  /**
   * コンストラクタ
   * @param {Node} node 
   * @param {string[]} props 
   * @param {()=>{}} proc 
   */
  constructor(node, props, proc) {
    this.node = node;
    this.props = props;
    this.proc = proc;
  }
}