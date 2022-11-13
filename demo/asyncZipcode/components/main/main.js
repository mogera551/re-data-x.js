import html from "../../../../dist/importText.js?path=./components/main/main.html";

const URL_API = "https://api.zipaddress.net/";
class ViewModel {
  "result" = null;

  "zipcode";
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

  $relativeProps = [
    [ "address", [ "result" ] ],
    [ "message", [ "result" ] ],
  ];

  $onNotify({prop}) {
    if (prop === "zipcode") {
      if (!/^[0-9]{7}$/.test(this.zipcode)) {
        this.$asyncProc(() => this.result = "");
      } else {
        this.$asyncProc(this.search, [this.zipcode]);
      }
    }
  }
}

export default { ViewModel, html }
