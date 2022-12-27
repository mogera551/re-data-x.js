
const html =`
<main class="container">
  <h1>search anime</h1>
  <div class="grid">
    <input data-bind="title">
    <button type="button" data-bind="onclick:search; disabled:title|falsey">search</button>
  </div>
  <table class="table table-striped">
    <colgroup>
      <col class="col-md-2">
      <col class="col-md-2">
      <col class="col-md-8">
    </colgroup>
    <tbody>
      <template data-bind="animes">
        <tr>
          <td class="text-left">{animes.*.anime}</td>
          <td class="text-left">{animes.*.character}</td>
          <td class="text-left">{animes.*.quote}</td>
        </tr>
      </template>
    </tbody>
  </table>
</main>
`;

const URL_API = "https://animechan.vercel.app/api/quotes/anime";
class ViewModel {
  "title" = "";
  "animes" = [];
  "animes.*";
  "animes.*.anime";
  "animes.*.character";
  "animes.*.quote";
  
  async search() {
    if (this.title == "") return [];
    const params = new URLSearchParams({ title: this.title });
    const response = await fetch(`${URL_API}?${params}`);
    const json = await response.json();
    this.animes = (json?.error) ? [] : json;
  }
}

export default { ViewModel, html }
