import css from "../../../../dist/importText.js?path=./components/main/main.css";
import html from "../../../../dist/importText.js?path=./components/main/main.html";
import allPrefectures from "../../prefectures.js";

class ViewModel {
  "regions" = Array.from(new Set(allPrefectures.map(pref => pref.region)));
  "regions.*";
  "selectedRegion" = "";

  get "prefectures"() {
    return allPrefectures.filter(pref => this.selectedRegion ? pref.region === this.selectedRegion : true);
  }
  "prefectures.*";
  "prefectures.*.name";
  "prefectures.*.capital";
  "prefectures.*.population";
  get "prefectures.*.populationRateOfRegion"() {
    return this["prefectures.*.population"] / this["sumPopulationOfRegion"] * 100; // 都道府県人口/地方総人口 * 100
  }
  get "prefectures.*.populationRate"() {
    return this["prefectures.*.population"] / this["sumPopulation"] * 100; // 都道府県人口/総人口 * 100
  }

  get "sumPopulation"() {
    return allPrefectures.reduce((sum, pref) => sum + pref.population, 0);
  }
  get "sumPopulationOfRegion"() {
    return this.prefectures.reduce((sum, pref) => sum + pref.population, 0);
  }

  [Symbol.for("onNotify")]({ prop }) {
    if (prop === "selectedRegion") {
      return [
        { prop:"prefectures" },
        { prop:"sumPopulationOfRegion" },
      ];
    }
  }
}

export default {
  ViewModel, html, css
}