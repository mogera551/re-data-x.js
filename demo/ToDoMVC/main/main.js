import html from "../../../dist/importText.js?path=./main/main.html";

class ToDo {
  completed = false;
  content;
  constructor(content) {
    this.content = content;
  }
}

class ViewModel {
  "content";

  "all" = [];
  get "todos"() {
    const active = todo => !todo.completed;
    const completed = todo => todo.completed;
    const all = todo => true;
    const filters = { active, completed, all };
    return this.all.filter(filters[this.status]);
  } 
  "todos.*";
  "todos.*.completed";
  "todos.*.content";

  "status" = "all"; // all/active/completed

  complete(e) {
    this["todos.*.completed"] = e.target.checked;
    this.$notify("todos", []);
  }

  enter(e) {
    if (e.keyCode === 13 && this.content.length > 0) {
      this.all.push(new ToDo(this.content));
      this.content = "";
    }
  }

  delete(e, $1) {
    const deleteTodo = this[`todos.*`];
    const index = this.all.findIndex(todo => todo === deleteTodo);
    (index >= 0) && this.all.splice(index, 1);
  }

  $relativeProps = [
    [ "todos", [ "all", "status" ] ],
  ];
}

export default { ViewModel, html }
