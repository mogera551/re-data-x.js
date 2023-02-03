import { Component } from "../Component/WebComponent.js";
import BoundNode from "./BoundNode.js";
import Factory from "./Factory.js";
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

const isComment = node => node instanceof Comment && node.textContent[0] === "@" && node.textContent[1] === "@";
const getCommentNodes = node => Array.from(node.childNodes).flatMap(node => getCommentNodes(node).concat(isComment(node) ? node : null)).filter(node => node);

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
   * そのあとバインドノードに対してbind()を実行する
   * @param {Component} parentComponent 
   * @param {HTMLElement} documentRoot パースを開始する要素 
   * @param {HTMLTemplateElement} template テンプレート
   * @param {integer[]} indexes ループインデックス
   * @returns {BoundNode[]} BoundNodeの配列を返す
   */
  static select(parentComponent, documentRoot, template, indexes = []) {
    /**
     * @type {Node[]}
     */
    let nodes;

    if (this.listOfRouteIndexesByTemplate.has(template)) {
      // キャッシュがある場合
      // querySelectorAllをせずにNodeの位置を特定できる
      const listOfRouteIndexes = this.listOfRouteIndexesByTemplate.get(template);
      nodes = listOfRouteIndexes.map(routeIndexes => routeIndexes.reduce((node, routeIndex) => node.childNodes[routeIndex], documentRoot));
    } else {
      // data-bindを持つノード、コメントのノードを取得しリストを作成する
      nodes = Array.from(documentRoot.querySelectorAll(SELECTOR)).concat(getCommentNodes(documentRoot));
  
      // ルートから、nodeのインデックスの順番をキャッシュに覚えておく
      this.listOfRouteIndexesByTemplate.set(template, nodes.map(node => getNodeRoute(node)));
    }
    /**
     * @type {BoundNode[]}
     */
    // ノードからバインドノードを生成
    const boundNodes = nodes.map(node => Factory.create(parentComponent, node, indexes));
    // バインドノードに対してbind()を実行する
    boundNodes.forEach(boundNode => boundNode.bind());
    return boundNodes;
  }
}