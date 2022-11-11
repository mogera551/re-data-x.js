
import UpdateNodeData from "./UpdateNodeData.js";
/**
 * 更新するノードのスケジュールを変更して更新を行う
 * selectとoptionの順番を変更、option >> selectの順で更新する
 */
export default class UpdateNodeScheduler {
  /**
   * @type {UpdateNodeData[]}
   */
  queue = [];
  
  /**
   * 更新するノード情報をキューへ登録
   * @param {UpdateNodeData} updateNodeScheduleData 更新するノード情報
   * @param {UpdateNodeData[]?} [queue = this.queue] キュー
   */
  enqueue(asyncProcData, queue = this.queue) {
    queue.push(asyncProcData);
  }

  /**
   * キューの並べ替え
   * selectとoptionの順番を変更、option >> selectの順で更新する
   * selectを最後に持ってくる
   * @param {UpdateNodeData[]} queue キュー
   * @return {UpdateNodeData[]}
   */
  static reorder(queue) {
    const updateNodes = queue.slice();
    updateNodes.sort((n1, n2) => {
      if (n1.node instanceof HTMLSelectElement && n1.props.length === 1 && n1.props[0] === "value") return 1;
      return -1;
    });
    return updateNodes;
  }

  /**
   * キューのスケジューリング
   * ノード更新処理の実行
   * キューに滞留しているノード更新処理をすべて取得し実行する
   * @param {UpdateNodeData[]?} [queue = this.queue] queue キュー
   * @async
   */
  exec(queue = this.queue) {
    do {
      const updateNodes = queue.slice();
      if (updateNodes.length === 0) break;
      queue.splice(0);
      const orderedUpdateNodes = UpdateNodeScheduler.reorder(updateNodes);
      for(const updaeNode of orderedUpdateNodes) {
        updaeNode.proc();
      }
    } while(true);
  }
}