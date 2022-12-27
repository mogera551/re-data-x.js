import Task from "../Task.js";

const html = `
<h1>タスクリストアプリケーションへようこそ、{userName}！</h1>
<h3>{userName}のタスクリスト：</h3>

<div>
  <input placeholder="新しく追加するタスク" data-bind="text">
  <button data-bind="onclick:add; disabled:text|falsey">追加</button>
</div>

<div>
  <template data-bind="listTask">
    <div>
      <input type="checkbox" data-bind="listTask.*.status">
      <span data-bind="class.complete:listTask.*.status">{listTask.*.text}</span>
      <button data-bind="onclick:delete">削除</button>
    </div>
  </template>
</div>
`;

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
