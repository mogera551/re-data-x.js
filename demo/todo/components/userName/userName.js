import html from "../../../../dist/importText.js?path=./components/userName/userName.html";

class ViewModel {
  "userName" = Symbol.for("import");
  "lastName" = "";
  "firstName" = "";

  get "isComplete"() {
    return this.lastName && this.firstName;
  }

  setUserName() {
    this.userName = `${this.lastName} ${this.firstName}`;
  }

  $relativeProps = [
    [ "isComplete", [ "lastName", "firstName" ] ],
  ];
}

export default { ViewModel, html }
