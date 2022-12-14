
const html = `
<div class="container">
  <div data-bind="style.display:userName|not|styleDisplay">
    <myapp-username data-bind="userName:@" without-shadowroot></myapp-username>
  </div>
  <div data-bind="style.display:userName|styleDisplay">
    <myapp-list-task data-bind="userName:@" without-shadowroot></myapp-list-task>
  </div>
</div>
`;

class ViewModel {
  "userName" = "";
}

export default { ViewModel, html }
