import html from "../importText.js?path=./components/main/main.html";

class ViewModel {
  "count" = 0;

  handleClick() {
    this.count++;
  }
}

export default { ViewModel, html };
