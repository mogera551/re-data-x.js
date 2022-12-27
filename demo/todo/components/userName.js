
const html = `
<h1>タスクリストアプリケーションへようこそ!</h1>
<h3>名前を入力してください。</h3>
<div>
  <div><input placeholder="姓" data-bind="familyName"></div>
  <div><input placeholder="名" data-bind="firstName"></div>
  <div><button data-bind="onclick:setUserName; disabled:isComplete|not">タスク管理を始める</button></div>
</div>
`;

class ViewModel {
  "userName" = Symbol.for("import");
  "familyName" = "";
  "firstName" = "";

  get "isComplete"() {
    return this.familyName && this.firstName;
  }

  setUserName() {
    this.userName = `${this.familyName} ${this.firstName}`;
  }

  $relativeProps = [
    [ "isComplete", [ "familyName", "firstName" ] ],
  ];
}

export default { ViewModel, html }
