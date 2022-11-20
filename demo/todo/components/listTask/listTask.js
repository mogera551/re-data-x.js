import html from "../../../../dist/importText.js?path=./components/listTask/listTask.html";
import Task from "../../Task.js";

class ViewModel {
  "userName" = Symbol.for("import");

  "listTask" = [];
  "listTask.*";
  "listTask.*.text";
  "listTask.*.status";

  "text";

  add() {
    this.listTask.push(Object.assign(new Task, this));
    this.text = "";
  }

  delete(e, $1) {
    if (!confirm("削除しますか？")) return;
    this.listTask.splice($1, 1);
  }

}

export default { ViewModel, html }
