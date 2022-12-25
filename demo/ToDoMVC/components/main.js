
const html = `
<div>
  <input data-bind="content; onkeypress:keypress">
</div>

<div>
  <ul>
    <template data-bind="todoItems">
      <li>
        <div class="view">
          <input type="checkbox" data-bind="todoItems.*.completed; oninput:completeItem">
          <label data-bind="class.completed:todoItems.*.completed">{todoItems.*.content}</label>
          <button type="button" data-bind="onclick:deleteItem">X</button>
        </div>
      </li>
    </template>
  </ul>

  <div>
    <label>
      <input type="radio" name="satus" value="all" data-bind="radio:status">all
    </label>
    <label>
      <input type="radio" name="satus" value="active" data-bind="radio:status">active
    </label>
    <label>
      <input type="radio" name="satus" value="completed" data-bind="radio:status">completed
    </label>
  </div>
</div>
`;

class ToDoItem {
  completed = false;
  content;
  constructor(content) {
    this.content = content;
  }
}

const ENTER_KEY = 13;

class ViewModel {
  "content";

  "all" = [];
  get "todoItems"() {
    const [ active, completed, all ] 
      = [ item => !item.completed, item => item.completed, () => true ];
    const filters = { active, completed, all };
    return this.all.filter(filters[this.status]);
  } 
  "todoItems.*";
  "todoItems.*.completed";
  "todoItems.*.content";

  "status" = "all"; // all/active/completed

  completeItem(e) {
    this["todoItems.*.completed"] = e.target.checked;
    this.$notify("todoItems");
  }

  keypress(e) {
    if (e.keyCode !== ENTER_KEY || this.content.length === 0) return;
    this.all.push(new ToDoItem(this.content));
    this.content = "";
  }

  deleteItem() {
    const index = this.all.findIndex(todoItem => todoItem === this[`todoItems.*`]);
    (index >= 0) && this.all.splice(index, 1);
  }

  $relativeProps = [
    [ "todoItems", [ "all", "status" ] ],
  ];
}

export default { ViewModel, html }
