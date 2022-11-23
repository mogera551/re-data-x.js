import BoundNode from "./BoundNode.js";
import { Component } from "../Component/WebComponent.js";
const SELECTOR = "[data-bind]";

/**
 * ルートノードから、nodeまでのchileNodesのインデックスリストを取得する
 * ex.
 * rootNode.childNodes[1].childNodes[3].childNodes[7].childNodes[2]
 * => [1,3,7,2]
 * @param {Node} node 
 * @returns {integer[]}
 */
const getNodeRoute = node => {
  const routeIndexes = [];
  while(node.parentNode != null) {
    routeIndexes.unshift(Array.from(node.parentNode.childNodes).indexOf(node));
    node = node.parentNode;
  }
  return routeIndexes;
};

export default class NodeSelector {
  /**
   * @type {Map<HTMLTemplateElement, integer[][]>}
   */
  static listOfRouteIndexesByTemplate = new Map();
  /**
   * テンプレートのコピーからバインドするノードを取得する
   * data-bind属性を持つ要素を取得し、そのバインドノードを作成し、data-bind属性をパースする
   * <!--@@param-->を持つコメントノードを取得し、そのバインドノードを作成し、パースする
   * テンプレートに対するキャッシュを保持する
   * @param {Component} parentComponent 
   * @param {HTMLElement} documentRoot パースを開始する要素 
   * @param {HTMLTemplateElement} template テンプレート
   * @param {BoundNode} loopNode 
   * @param {integer[]} indexes ループインデックス
   * @returns {BoundNode[]} BoundNodeの配列を返す
   */
  static select(parentComponent, documentRoot, template, loopNode = null, indexes = []) {
    //console.time("NodeSelector.select");
    /**
     * @type {BoundNode[]}
     */
    const boundNodes = [];
    const createBoundNode = node => {
      const boundNode = BoundNode.create(parentComponent, node, loopNode);
      boundNode.parse(indexes);
      return boundNode;
    };

    if (this.listOfRouteIndexesByTemplate.has(template)) {
      // キャッシュがある場合
      // querySelectorAllをせずにNodeの位置を特定できる
      const listOfRouteIndexes = this.listOfRouteIndexesByTemplate.get(template);
      const nodes = listOfRouteIndexes.map(routeIndexes => routeIndexes.reduce((node, routeIndex) => node.childNodes[routeIndex], documentRoot));

      // BoundNodeを作成する
      boundNodes.push(...nodes.map(node => createBoundNode(node)));
    } else {
      /**
       * @type {Node[]}
       */
      const nodes = [];
      /**
       * @type {integer[][]}
       */
      const listOfRouteIndexes = [];

      /**
       * @type {HTMLElement[]}
       */
      const elements = Array.from(documentRoot.querySelectorAll(SELECTOR));
      // ルートから、nodeのインデックスの順番をキャッシュに覚えておく
      listOfRouteIndexes.push(...elements.map(element => getNodeRoute(element)));

      /**
       * @type {Comment[]}
       */
      const commentNodes = [];
      const walk_ = (node) => node.childNodes.forEach(node => {
        node instanceof Comment && node.textContent[0] === "@" && node.textContent[1] === "@" && commentNodes.push(node);
        walk_(node);
      });
      walk_(documentRoot);
      listOfRouteIndexes.push(...commentNodes.map(node => getNodeRoute(node)));
  
      this.listOfRouteIndexesByTemplate.set(template, listOfRouteIndexes);
      nodes.push(...elements);
      nodes.push(...commentNodes);
  
      // BoundNodeを作成する
      boundNodes.push(...nodes.map(node => createBoundNode(node)));
    }
    //console.timeEnd("NodeSelector.select");

    //console.log(comments);

    return boundNodes;

  }


}