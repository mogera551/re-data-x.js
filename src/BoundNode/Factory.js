import { Component } from "../Component/WebComponent.js";
import utils from "../utils.js";
import BoundNode from "./BoundNode.js";
import BoundComponent from "./BoundComponent.js";
import BoundElement from "./BoundElement.js";
import BoundText from "./BoundText.js";
import BoundTemplate from "./BoundTemplate.js";

export default class Factory {
  /**
   * 
   * @param {Component} parentComponent
   * @param {Node} node 
   * @param {integer[]} indexes 
   * @returns {BoundNode[]}
   */
  static create(parentComponent, node, indexes) {
    if (node instanceof Component) {
      return new BoundComponent(node, parentComponent, indexes);
    } else if (node instanceof HTMLTemplateElement) {
      return new BoundTemplate(node, parentComponent, indexes);
    } else if (node instanceof HTMLElement) {
      return new BoundElement(node, parentComponent, indexes);
    } else if (node instanceof Comment) {
      return new BoundText(node, parentComponent, indexes);
    } else {
      utils.raise(`unknown node ${node}`);
    }
  };

}