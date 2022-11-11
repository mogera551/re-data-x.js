import html from "../../../../dist/importText.js?path=./components/main/main.html";

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
