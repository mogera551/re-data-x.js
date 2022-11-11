/**
 * スタック
 */
export default class Stack {
  stack = [];
  
  /**
   * スタックを積んで、callbackを実行
   * @param {any} value 
   * @param {()=>{}} callback 
   * @returns 
   */
  push(value, callback) {
    let result;
    this.stack.push(value);
    try {
      result = callback();
    } finally {
      this.stack.pop();
    }
    return result;
  }

  /**
   * 現在のスタック
   * @type {any}
   */
  get current() {
    return this.stack.at(-1); 
  }
}