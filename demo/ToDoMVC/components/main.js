
const html = `
<section class="todoapp">
  <header class="header">
    <h1>todos</h1>
    <input class="new-todo" data-bind="content; onkeypress:keypress" placeholder="What needs to be done?" autofocus="">
  </header>
  <section class="main" data-bind="style.display:todoItems.length|truthy|styleDisplay;">
    <input class="toggle-all" id="toggle-all" type="checkbox" data-bind="onclick:toggleCompleteAll">
    <label for="toggle-all">Mark all as complete</label>
    <ul class="todo-list">
    <template data-bind="todoItems">
      <li data-bind="class.completed:todoItems.*.completed">
        <div class="view">
          <input class="toggle" type="checkbox" data-bind="todoItems.*.completed; oninput:completeItem">
          <label data-bind="class.completed:todoItems.*.completed">{todoItems.*.content}</label>
          <button class="destroy" data-bind="onclick:deleteItem"></button>
        </div>
      </li>
    </template>
    </ul>
  </section>
  <footer class="footer" data-bind="style.display:all.length|truthy|styleDisplay;">
    <span class="todo-count"><strong>{activeItems.length}</strong> item left</span>
    <ul class="filters">
      <li>
        <a data-bind="onclick:selectAll; class.selected:status|eq,all">All</a>
      </li>
      <li>
        <a data-bind="onclick:selectActive; class.selected:status|eq,active">Active</a>
      </li>
      <li>
        <a data-bind="onclick:selectCompleted; class.selected:status|eq,completed">Completed</a>
      </li>
    </ul>
  </footer>  
</section>
`;

class TodoItem {
  completed = false;
  content;
  constructor(content) {
    this.content = content;
  }
}

const ENTER_KEY = 13;
const [ active, completed, all ] = [ item => !item.completed, item => item.completed, () => true ];

class ViewModel {
  "content";

  "all" = [];
  "all.*";
  "all.*.completed";
  "all.length";

  get "todoItems"() {
    const filters = { active, completed, all };
    return this.all.filter(filters[this.status]);
  } 
  "todoItems.*";
  "todoItems.*.completed";
  "todoItems.*.content";
  "todoItems.length";

  get "activeItems"() {
    return this.all.filter(active);
  }
  "activeItems.length";

  "status" = "all"; // all/active/completed

  completeItem(e) {
    this["todoItems.*.completed"] = e.target.checked;
    this.$notify("all");
  }

  keypress(e) {
    if (e.keyCode !== ENTER_KEY || this.content.length === 0) return;
    this.all.push(new TodoItem(this.content));
    this.content = "";
  }

  deleteItem() {
    const index = this.all.findIndex(todoItem => todoItem === this[`todoItems.*`]);
    (index >= 0) && this.all.splice(index, 1);
  }

  selectAll() {
    this["status"] = "all";
  }

  selectActive() {
    this["status"] = "active";
  }

  selectCompleted() {
    this["status"] = "completed";
  }

  toggleCompleteAll(e) {
    for(let i = 0; i < this.all.length; i++) {
      this[`all.${i}.completed`] = e.target.checked;
    }
    this.$notify("all");
  }

  $relativeProps = [
    [ "todoItems", [ "all", "status" ] ],
    [ "activeItems", [ "all" ] ],
  ];
}

export default { ViewModel, html };
