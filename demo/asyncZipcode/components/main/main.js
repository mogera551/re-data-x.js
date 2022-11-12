import html from "../../../../dist/importText.js?path=./components/main/main.html";

const URL_API = "https://api.zipaddress.net/";
class ViewModel {
  __zipcode = "";
  "result" = null;

  get "zipcode"() {
    return this.__zipcode;
  }
  set "zipcode"(value) {
    this.__zipcode = value;
    (/^[0-9]{7}$/.test(value)) ? this.$asyncProc(this.search, [value]) : (this.result = null);
  }
  get "address"() {
    return this.result?.code === 200 ? this.result.data.fullAddress : "";
  };
  get "message"() {
    return this.result?.code === 200 ? `検索結果は、「${this.result.data.fullAddress}」` : this.result?.message ?? "";
  }

  async search(zipcode) {
    const params = new URLSearchParams({ zipcode });
    const response = await fetch(`${URL_API}?${params}`);
    this.result = await response.json();
  }

  $onNotify({prop}) {
    if (prop === "result") {
      return [
        { prop:"address" },
        { prop:"message" },
      ];
    }
  }
}

export default { ViewModel, html }
