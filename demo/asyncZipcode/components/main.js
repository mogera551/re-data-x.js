
const html = `
<input placeholder="1000000" maxlength="7" data-bind="zipcode">
<div>
  <p>{address}</p>
  <p>{message}</p>
</div>  
`;

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

  async $onChange(notifications) {
    if (notifications.find(({prop}) => prop === "zipcode")) {
      if (!/^[0-9]{7}$/.test(this.zipcode)) {
        this.result = "";
      } else {
        await this.search(this.zipcode);
      }
    }
  }
}

export default { ViewModel, html }
