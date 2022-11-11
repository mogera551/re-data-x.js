import html from "../importText.js?path=./components/main/main.html";

class ViewModel {
  "count" = 0;
  get "doubled"() {
    return this.count * 2;
  }
  get "quadrupled"() {
    return this.doubled * 2;
  }
  handleClick() {
    this.count++;
  }

  [Symbol.for("onNotify")]({prop}) {
    if (prop === "count") return [
      { prop:"doubled" },
      { prop:"quadrupled" },
    ];
  }

}

export default { ViewModel, html };
