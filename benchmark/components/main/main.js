import html from "../../../src/tool/importText.js?path=./components/main/main.html";
import buildData from "../../buildData.js";

class ViewModel {
  "list" = [];
  "list.*";
  "list.*.id";
  "list.*.label";
  get "list.*.selected"() {
    return this["list.*.id"] === this.selected;
  }

  "selected" = null;

  selectItem(e, $1) {
    const index = this.list.findIndex(item => item.id === this.selected);
    index != null && this.$notify("list.*.selected", [index]);
    this.selected = this.list[$1].id;
  }
  removeItem(e, $1) {
    this.list.splice($1, 1);
  }
  create1000() {
    this.list = buildData(1000);
    this.selected = null;
  }
  create10000() {
    this.list = buildData(10000);
    this.selected = null;
  }
  add() {
    this.list.push(...buildData(1000));
  }
  update() {
    for(let i = 0; i < this.list.length; i += 10) {
      this[`list.${i}.label`] += ` !!!`;     
    }
  }
  clear() {
    this.list = [];
  }
  swapRows() {
    if (this.list.length > 998) {
      const row = this["list.1"];
      this["list.1"] = this["list.998"];
      this["list.998"] = row;
    }
  }

  $relativeProps = [
    [ "list.*.selected", [ "selected" ] ],
  ]
}

export default { ViewModel, html }