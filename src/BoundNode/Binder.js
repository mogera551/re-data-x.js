import NodeSelector from "./NodeSelector.js";
import { Component } from "../Component/WebComponent.js";
import BoundNode from "./BoundNode.js";
import BoundTemplate from "./BoundTemplate.js";
import utils from "../utils.js";

//const initializer = boundNode => boundNode.init();
const updator = (notifications, globalNotifications) => boundNode => boundNode.updateForNotify(notifications, globalNotifications);

/**
 * @type {(boundNode:BoundNode)=>BoundTemplate}
 */
const toBoundTemplate = boundNode => (boundNode instanceof BoundTemplate) ? boundNode : utils.raise(`${boundNode} is not BoundTemplate`);
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
//  init() {
//    this.boundNodes.forEach(initializer);
//  }

  /**
   * バインドノードのリストに対して、更新処理を行う
   * コンポーネントのViewModelの更新した内容をノードへ反映する
   * @param {Set<NotifyData>} notifications
   * @param {Set<NotifyData>} globalNotifications
   */
  updateForNotify(notifications, globalNotifications) {
    this.boundNodes.forEach(updator(notifications, globalNotifications));
  }

  /**
   * バインドノードのリストの巡回を行う
   * @async
   * @param {(boundNode:BoundNode)=>{}} callback
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
        if (boundNode instanceof BoundTemplate) {
          const boundTemplate = toBoundTemplate(boundNode);
          for(const loopChild of boundTemplate.loopChildren) {
            await walk_(loopChild.boundNodes);
          }
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
      const viewModelPaths = Array.from(boundNode.nodePropertiesByViewModelPath.keys());
      for(const viewModelPath of viewModelPaths.filter(path => setOfNames.has(path))) {
        await callback(viewModelPath, boundNode.node);
      }
    });
  }

  /**
   * @type {Binder}
   */
  static rootBinder = new Binder(null);
}