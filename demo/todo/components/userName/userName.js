import html from "../../../../src/tool/importText.js?path=./components/userName/userName.html";

const SymOnNotify = Symbol.for("onNotify");

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

  [SymOnNotify](notification) {
    if (new Set(["lastName", "firstName"]).has(notification.prop)) {
      return { prop:"isComplete" };
    }
  }
}

export default { ViewModel, html }
