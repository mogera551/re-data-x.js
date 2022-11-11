import NodeSelector from "./NodeSelector.js";
import BoundNode from "./BoundNode.js";
import { Component } from "../Component/WebComponent.js";

const initializer = boundNode => boundNode.init();
const updator = (setOfNotification, setOfGlobalNotification) => boundNode => boundNode.update(setOfNotification, setOfGlobalNotification);

/**
 * コンポーネントがバインドしているノードを管理する。
 * バインドノードがTEMPLATEで、子ノードを展開する場合、TEMPLATE側で子ノードの管理を行う。
 */
export default class Binder {
  /**
   * バインドノードのリスト
   * @type {BoundNode[]}
   */
  boundNodes = [];
  /**
   * @type {Component}
   */
  component;

  /**
   * コンストラクタ
   * @param {Component} component 
   */
  constructor(component) {
    this.component = component;
  }

  /**
   * バインドノードのリストに追加する
   * @param {BoundNode} boundNode 
   */
  add(boundNode) {
    this.boundNodes.push(boundNode);
  }

  /**
   * バインドするノードを取得し、バインドノードを生成し、リストに追加する
   * @param {HTMLElement} documentRoot 
   */
  bind(documentRoot) {
    this.boundNodes.push(...NodeSelector.select(this.component, documentRoot, this.component.template));
  }

  /**
   * バインドノードのリストに対して、初期化を行う
   */
  init() {
    this.boundNodes.forEach(initializer);
  }

  /**
   * バインドノードのリストに対して、更新処理を行う
   * コンポーネントのViewModelの更新した内容をノードへ反映する
   * @param {Set<NotifyData>} setOfNotification 
   * @param {Set<NotifyData>} setOfGlobalNotification 
   */
  update(setOfNotification, setOfGlobalNotification) {
    this.boundNodes.forEach(updator(setOfNotification, setOfGlobalNotification));
  }

  /**
   * バインドノードのリストの巡回を行う
   * @async
   * @param {async ()=>{}}
   */
  async walk(callback) {
    /**
     * 
     * @async
     * @param {BoundNode[]} boundNodes 
     * @returns 
     */
    const walk_ = async boundNodes => {
      for(const boundNode of boundNodes) {
        await callback(boundNode);
        for(const loopChild of boundNode.loopChildren) {
          await walk_(loopChild.boundNodes);
        }
      }
    }
    await walk_(this.boundNodes);
  }
  
  /**
   * ViewModelのプロパティ（setOfNames）をバインドしているBoundNodeをコールバックで返す
   * @async
   * @param {Set<string>} setOfNames 
   * @param {async(key:string, node:Node)=>{}} callback 
   */
  async findNode(setOfNames, callback) {
    await this.walk(async boundNode => {
      const keys = Array.from(boundNode.propsByViewModelPath.keys());
      for(const key of keys.filter(key => setOfNames.has(key))) {
        await callback(key, boundNode.node);
      }
    });
  }

  /**
   * @type {Binder}
   */
  static rootBinder = new Binder(null);
}