/**
 * 非同期処理を実行するための情報
 */
export default class AsyncProcData {
  /**
   * 非同期関数
   * @type {()=>{}} 
   */
  target;
  /**
   * thisを指すオブジェクト
   * @type {Object} 
   */
  thisArg;
  /**
   * 引数配列
   * @type {any[]} 
   */
  args;

  /**
   * コンストラクタ
   * @param {()=>{}} target 
   * @param {Object} thisArg 
   * @param {any[]} args 
   */
  constructor(target, thisArg, args) {
    this.target = target;
    this.thisArg = thisArg;
    this.args = args;
  }

}