import AsyncProcData from "./AsyncProcData.js";
/**
 * 非同期処理クラス
 * キューに実行する非同期処理を登録し、execで非同期処理を実行する
 */
export default class AsyncProc {
  /**
   * @type {AsyncProcData[]}
   */
  queue = [];
  
  /**
   * 非同期処理をキューへ登録
   * @param {AsyncProcData} asyncProcData 登録する非同期処理
   * @param {AsyncProcData[]?} [queue = this.queue] キュー
   */
  enqueue(asyncProcData, queue = this.queue) {
    queue.push(asyncProcData);
  }

  /**
   * 非同期処理の実行
   * キューに滞留している非同期処理をすべて取得し実行する
   * @param {AsyncProcData[]?} [queue = this.queue] queue キュー
   * @async
   */
  async exec(queue = this.queue) {
//    console.log(`exec() start`);
    do {
      const procs = queue.slice();
      if (procs.length === 0) break;
      queue.splice(0);
      for(const proc of procs) {
        await proc.exec();
      }
    } while(true);
//    console.log(`exec() end`);
  }
}