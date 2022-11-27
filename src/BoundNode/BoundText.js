import BoundNode from "./BoundNode.js";
import ParseFunc from "./ParseFunc.js";

const DEFAULT_PROPERTY = "textContent";

export default class BoundText extends BoundNode {
  /**
   * バインド
   */
  bind() {
    // コメントノードをテキストノードに入れ替える
    // this.nodeを入れ替えるので注意
    const commentNode = this.node;
    const bindText = commentNode.textContent.slice(2);
    this.node = document.createTextNode("");
    commentNode.parentNode.replaceChild(this.node, commentNode);

    ParseFunc.parseBinds(bindText ?? "", DEFAULT_PROPERTY).forEach(([propName, viewModelPropName, filters]) => {
      const {nodeProperty, viewModelProperty} = this.bindProperty(propName, viewModelPropName, filters);
      this.assignNodeValue(nodeProperty, viewModelProperty, filters);
    });
  }
}