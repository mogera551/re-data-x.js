import AsyncProcData from "../AsyncProc/AsyncProcData.js";
import AsyncProc from "../AsyncProc/AsyncProc.js";
import NotifyData from "../Notify/NotifyData.js";
import Notify from "../Notify/Notify.js";
import UpdateNodeData from "../UpdateNodeSchedule/UpdateNodeData.js";
import UpdateNodeScheduler from "../UpdateNodeSchedule/UpdateNodeScheduler.js";
import { Component } from "../Component/WebComponent.js";

/**
 * 更新処理実行
 */
class Updator {
  asyncProc = new AsyncProc();
  notify = new Notify();
  updateNodeScheduler = new UpdateNodeScheduler();

  /**
   * コンストラクタ
   */
  constructor() {
  }

  /**
   *  非同期処理データのキューイング
   * @param {AsyncProc} data 
   */
  enqueueAsyncProc(data) {
    this.asyncProc.enqueue(data);
  }

  /**
   *  更新通知のキューイング
   * @param {NotifyData} data 
   */
  enqueueNotify(data) {
    this.notify.enqueue(data);
  }

  /**
   *  ノード更新のキューイング
   * @param {UpdateNodeData} data 
   */
   enqueueUpdateNode(data) {
    this.updateNodeScheduler.enqueue(data);
  }

  /**
   * 実行
   * 非同期処理を実行し、更新通知に従いViewを更新し、ノード更新処理を実行する
   */
  async exec() {
    do {
      console.time("update.exec()");
      // 非同期処理実行
      await this.asyncProc.exec();
      console.timeLog("update.exec()");
      // View更新
      this.notify.updateElements();
      console.timeLog("update.exec()");
      // ノード更新処理実行
      this.updateNodeScheduler.exec();
      console.timeEnd("update.exec()");
      if (this.asyncProc.queue.length == 0 
        && this.notify.queue.length == 0 
        && this.updateNodeScheduler.queue.length == 0 ) break;
    } while(true);
  }

}

/**
 * 実行スレッド
 * 通常一つだが、ダイアログを生成したら、新たに実行スレッドを作成する。
 */
export default class Thread {
  resolve;
  reject;
  updator;
  component;
  /**
   * コンストラクタ
   * @param {Component?} component 
   */
  constructor(component = null) {
    this.component = component;
    this.main();
  }

  /**
   * Updatorを指定し、実行待ちを解除する
   * @param {Updator} updator 
   */
  wakeup(updator) {
    this.resolve(updator);
  }

  /**
   * スレッドの実行を停止する
   */
  stop() {
    this.reject();
  }

  /**
   * プロミスを返す
   * resolveとrejectをセットする
   * @returns {Promise}
   */
  sleep() {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  /**
   * メインループ
   * 実行待ち、更新通知もしくは非同期処理を登録されたら、その実行を行う
   * 実行後、再び実行待ちの戻る
   */
  async main() {
    do {
      try {
        this.updator = await this.sleep();
        try {
          console.time("update");
          await this.updator.exec();
          console.timeEnd("update");
        } finally {
          this.updator = null;
        }
      } catch(e) {
        console.error(e);
        break;
      }
    } while(true);
  }

  /**
   * 非同期処理の登録
   * @param {()=>{}} target 
   * @param {Object} thisArg 
   * @param {any[]} args 
   */
  asyncProc(target, thisArg, args) {
    const updator = this.updator ?? new Updator;
    updator.enqueueAsyncProc(new AsyncProcData(target, thisArg, args));
    this.updator || this.wakeup(updator);
  }

  /**
   * 更新通知の登録
   * @param {Component} component 通知するコンポーネント
   * @param {string} prop 更新するプロパティ
   * @param {integer[]} indexes 更新するプロパティのインデックス配列
   */
  notify(component, prop, indexes) {
    const updator = this.updator ?? new Updator;
    updator.enqueueNotify(new NotifyData(component, prop, indexes));
    this.updator || this.wakeup(updator);
  }

  /**
   * ノード更新の登録
   * @param {Node} node 更新するノード
   * @param {string[]} props 更新するノードプロパティのリスト
   * @param {()=>{}} proc 更新処理
   */
  updateNode(node, prop, proc) {
    const updator = this.updator ?? new Updator;
    updator.enqueueUpdateNode(new UpdateNodeData(node, prop, proc));
    this.updator || this.wakeup(updator);
  }

  /**
   * スレッドのキュー
   * @type {Thread[]}
   */
  static queue = [ new Thread ];

  /**
   * 現在のスレッド
   * @type {Thread} 
   */
  static get current() {
    return this.queue.at(-1);
  }

  /**
   * 別スレッドを作成する
   * @param {Component?} component 
   */
  static suspend(component) {
    this.queue.push(new Thread(component));
  }

  /**
   * 現在のスレッドを停止し、元のスレッドを復帰
   */
  static resume() {
    const curThread = this.queue.pop();
    curThread.stop();
  }

}

