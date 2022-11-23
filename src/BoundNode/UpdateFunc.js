import CheckPoint from "../CheckPoint/CheckPoint.js";
import Filter from "../Filter/Filter.js";
import FilterData from "../Filter/FilterData.js";
import Thread from "../Thread/Thread.js";
import utils from "../utils.js";
import ActiveProperty from "../ViewModel/ActiveProperty.js";
import FileReaderEx from "./FileReaderEx.js";

class UpdateViewModel {
  /**
   * ノードプロパティが１階層の場合のViewModel更新処理
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {FilterData[]} filters フィルターのリスト
   */
  static param1(node, nodeProp, paths, viewModel, viewModelProp, filters) {
    ActiveProperty.setValue(viewModel, viewModelProp, Filter.applyForInput(node[nodeProp], filters));
  }

  /**
   * ノードプロパティが２階層の場合のViewModel更新処理
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {FilterData[]} filters フィルターのリスト
   */
  static param2(node, nodeProp, paths, viewModel, viewModelProp, filters) {
    ActiveProperty.setValue(viewModel, viewModelProp, Filter.applyForInput(node[paths[0]][paths[1]], filters));
  }

  /**
   * ノードプロパティがクラス指定の場合のViewModel更新処理
   * DOM側から更新されることはないので、何もしない
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {FilterData[]} filters フィルターのリスト
   */
  static className(node, nodeProp, paths, viewModel, viewModelProp, filters) {
    //
  }

  /**
   * ノードプロパティがラジオの場合のViewModel更新処理
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {FilterData[]} filters フィルターのリスト
   */
  static radio(node, nodeProp, paths, viewModel, viewModelProp, filters) {
    const element = utils.toElement(node);
    element.checked && ActiveProperty.setValue(viewModel, viewModelProp, Filter.applyForInput(element.value, filters));
  }

  /**
   * ノードプロパティがチェックボックスの場合のViewModel更新処理
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {FilterData[]} filters フィルターのリスト
   */
  static checkbox(node, nodeProp, paths, viewModel, viewModelProp, filters) {
    const element = utils.toElement(node);
    const values = ActiveProperty.getValue(viewModel, viewModelProp);
    const value = Filter.applyForInput(element.value, filters);
    if (element.checked) {
      values.push(value);
    } else {
      const index = values.findIndex(v => v == value);
      (index >= 0) && values.splice(index, 1);
    } 
  }

  /**
   * ノードプロパティがファイルの場合のViewModel更新処理
   * @async
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {FilterData[]} filters フィルターのリスト
   */
  static async file(node, nodeProp, paths, viewModel, viewModelProp, filters) {
    const input = utils.toInput(node);
    if (input.files.length == 0) return;
    const reader = new FileReaderEx();
    const data = await reader.readAsText(input.files[0]);
    const value = Filter.applyForInput(data, filters);
    ActiveProperty.setValue(viewModel, viewModelProp, value);
  }

}

class UpdateNode {
  /**
   * ノードプロパティが１階層の場合のノード更新処理
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {FilterData[]} filters フィルターのリスト
   */
  static param1(viewModel, viewModelProp, node, nodeProp, paths, filters) {
    const result = ActiveProperty.getValue(viewModel, viewModelProp);
    const value = Filter.applyForOutput(result, filters);
    Thread.current.updateNode(node, [nodeProp], () => {
      node[nodeProp] = value;
    });
  }

  /**
   * ノードプロパティが２階層の場合のノード更新処理
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {FilterData[]} filters フィルターのリスト
   */
  static param2(viewModel, viewModelProp, node, nodeProp, paths, filters) {
    const value = Filter.applyForOutput(ActiveProperty.getValue(viewModel, viewModelProp), filters);
    Thread.current.updateNode(node, paths, () => {
      node[paths[0]][paths[1]] = value;
    });
  }

  /**
   * ノードプロパティがクラス指定の場合のノード更新処理
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {FilterData[]} filters フィルターのリスト
   */
  static className(viewModel, viewModelProp, node, nodeProp, paths, filters) {
    const element = utils.toElement(node);
    const value = Filter.applyForOutput(ActiveProperty.getValue(viewModel, viewModelProp), filters);
    Thread.current.updateNode(node, ["classList"], () => {
      value ? element.classList.add(paths[1]) : element.classList.remove(paths[1]);
    });
  }

  /**
   * ノードプロパティがラジオの場合のノード更新処理
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {FilterData[]} filters フィルターのリスト
   */
  static radio(viewModel, viewModelProp, node, nodeProp, paths, filters) {
    const element = utils.toElement(node);
    const value = Filter.applyForOutput(ActiveProperty.getValue(viewModel, viewModelProp), filters);
    Thread.current.updateNode(node, ["checked"], () => {
      element.checked = element.value == value;
    });
  }

  /**
   * ノードプロパティがチェックボックスの場合のノード更新処理
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {FilterData[]} filters フィルターのリスト
   */
  static checkbox(viewModel, viewModelProp, node, nodeProp, paths, filters) {
    const element = utils.toElement(node);
    const values = Filter.applyForOutput(ActiveProperty.getValue(viewModel, viewModelProp), filters);
    Thread.current.updateNode(node, ["checked"], () => {
      element.checked = values.find(value => value == element.value) ? true : false;
    });
  }

  /**
   * ノードプロパティがファイルの場合のノード更新処理
   * @param {Object} viewModel ViewModel
   * @param {ActiveProperty} viewModelProp ViewModelのプロパティ
   * @param {Node} node ノード
   * @param {string} nodeProp ノードのプロパティ
   * @param {string[]} paths ノードプロパティを.で区切ったもの
   * @param {FilterData[]} filters フィルターのリスト
   */
  static file(viewModel, viewModelProp, node, nodeProp, paths, filters) {

  }
}

/**
 * @typedef {(node:Node, nodeProp:string, paths:string[], viewModel:Object, viewModelProp:ActiveProperty, filters:FilterData[])=>{}} UpdateViewModelFunc
 */
/**
 * @typedef {(viewModel:Object, viewModelProp:ActiveProperty, node:Node, nodeProp:string, paths:string[], filters:FilterData[])=>{}} UpdateNodeFunc
 */
/**
 * @type {Object<string,[UpdateViewModelFunc, UpdateNodeFunc]>}
 */
export default {
  "param1" : [UpdateViewModel.param1, UpdateNode.param1],
  "param2" : [UpdateViewModel.param2, UpdateNode.param2],
  "className" : [UpdateViewModel.className, UpdateNode.className],
  "radio" : [UpdateViewModel.className, UpdateNode.className],
  "checkbox" : [UpdateViewModel.className, UpdateNode.className],
  "file" : [UpdateViewModel.className, UpdateNode.className],
}