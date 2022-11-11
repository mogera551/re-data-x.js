/**
 * コンポーネントを定義するデータ
 */
export default class ComponentData {
  /**
   * HTMLテンプレートの文字列
   * @type {string} 
   */
  html;
  /**
   * CSS定義部分の文字列
   * @type {string} 
   */
  css;
  /**
   * 
   * @type {HTMLTemplateElement}
   */
  template;
  /**
   * ViewModelクラス
   * @type {Class}
   */
  ViewModel;

  /**
   * 
   * @static
   * @param {{html:string,css:string,ViewModel:Class}} data 
   * @returns {ComponentData}
   */
  static create(data) {
    const componentData = Object.assign(new ComponentData, data);
    componentData.template = componentData.template ?? 
      this.createTemplate(this.mergeHtml(componentData.html, componentData.css));
    return componentData;
  }
  
  /**
   * htmlの{param}を<!--@@param-->に置換する。
   * cssとhtmlを結合する。
   * @static
   * @param {string} html 
   * @param {string} css 
   * @returns {string}
   */
  static mergeHtml(html, css) {
    html = html.replaceAll(/\{([^\}]+)\}/g, (match, p1) => `<!--@@${p1}-->`);
    return (css ? `<style>${css}</style>` : "") + (html ?? "");
  }

  /**
   * templateオブジェクトを生成する
   * @static
   * @param {string} html 
   * @returns {HTMLTemplateElement}
   */
  static createTemplate(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    return template;
  }
}