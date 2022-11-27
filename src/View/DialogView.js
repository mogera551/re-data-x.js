import View from "./View.js";

export default class DialogView extends View {
  /**
   * 背景とフレームのCSS
   */
  get css() {
    return `
.bg {
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background-color: rgba(0, 0, 0, 0.5);
  left: 0;
  top: 0;
  height: 100vh;
  width: 100vw;
  z-index: fixed;
  position: fixed;
  position: 499;
}
.fg {
  background-color: white;
  border-radius: .375rem;
  padding: 3rem;
}
    `;
  }

  /**
   * レンダリング
   * パースしバインド情報を生成、初期化（子要素へ値を反映）
   * templateのクローンは、importNodeで行う
   * ダイアログ用の背景とフレームを生成する
   * イベントハンドラを設定
   * @param {Component?} component 
   * @param {Binder?} binder 
   * @param {HTMLTemplateElement?} template 
   * @param {ShadowRoot?} rootElement 
   */
  render(component = this.component, binder = component.binder, template = component.template, rootElement = component.shadowRoot ?? component) {
    const clone = document.importNode(template.content, true); // See http://var.blog.jp/archives/76177033.html
    binder.bind(clone);
//    binder.init();

    const style = document.createElement("style");
    style.innerHTML = this.css;
    rootElement.appendChild(style);
    const bg = document.createElement("div");
    bg.classList.add("bg");
    const fg = document.createElement("div");
    fg.classList.add("fg");
    bg.appendChild(fg);
    fg.appendChild(clone);
    rootElement.appendChild(bg);

    // 背景クリック時、ダイアログ消去
    bg.addEventListener("click", () => component.cancelDialog());
    // フレームクリック時、イベント伝播中止（背景までイベントが伝播しないように）
    fg.addEventListener("click", e => e.stopPropagation());
  }
    
}