const html = `
<div>
  <button data-bind="onclick:changeNyanko">今日のにゃんこ</button>
  <div style="margin-top:8px;">
    <img data-bind="src:imageUrl; style.display:imageUrl|truthy">
  </div>
</div>
`;

class ViewModel {
  "imageUrl" = "";

  async changeNyanko() {
    try {
      const response = await fetch("https://api.thecatapi.com/v1/images/search");
      const result = await response.json();
      this["imageUrl"] = result[0].url;
    } catch(e) {
      alert(e.message);
    }
  }

  async $onInit() {
    await this.changeNyanko();
  }

}

export default { html, ViewModel };