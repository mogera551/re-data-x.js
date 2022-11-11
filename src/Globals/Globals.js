
import Binder from "../BoundNode/Binder.js";

class GlobalHandler {
  /**
   * 
   * @param {Object} target 
   * @param {string} prop 
   * @param {any} value 
   * @param {Proxy} receiver 
   * @returns {boolean} true
   */
  set(target, prop, value, receiver) {
    Reflect.set(target, prop, value, receiver);
    Binder.rootBinder.update(new Set([prop]), new Set([`$$${prop}`]));
    return true;
  }
}

/**
 * @type {Proxy}
 */
const globalProxy = new Proxy({}, new GlobalHandler);
export default globalProxy;
