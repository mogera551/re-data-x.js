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

  $onNotify(notification) {
    if (new Set(["lastName", "firstName"]).has(notification.prop)) {
      return { prop:"isComplete" };
    }
  }
}

export default { ViewModel, html }
