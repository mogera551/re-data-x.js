import allPrefectures from "../prefectures.js";

const html = `
<div class="container">
  <div>
    <select data-bind="selectedRegion">
      <option value="">全国</option>
      <template data-bind="regions">
        <option data-bind="regions.*">{regions.*}</option>
      </template>
    </select>
  </div>

  <div>
    <table class="table table-striped">
      <colgroup>
        <col class="col-md-4">
        <col class="col-md-4">
        <col class="col-md-2">
        <col class="col-md-2">
      </colgroup>
      <thead>
        <tr>
          <th class="text-center">都道府県名</th>
          <th class="text-center">県庁所在地</th>
          <th class="text-center">人口（人）</th>
          <th class="text-center">人口比（％）</th>
        </tr>
      </thead>
      <tbody>
        <template data-bind="prefectures">
          <tr>
            <td class="text-center">{prefectures.*.name}</td>
            <td class="text-center">{prefectures.*.capital}</td>
            <td class="text-right" data-bind="class.over:prefectures.*.population|ge,5000000; class.under:prefectures.*.population|lt,1000000;">{prefectures.*.population|localeString}</td>
            <td class="text-right">{prefectures.*.shareOfPopulation|fixed,2}</td>
          </tr>
        </template>
      </tbody>
      <tfoot>
        <tr>
          <td class="text-center" colspan="2">合計</td>
          <td class="text-right">{sumPopulation|localeString}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>
`;

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
  get "prefectures.*.shareOfPopulation"() {
    return this["prefectures.*.population"] / this["sumPopulation"] * 100; // 都道府県人口/人口合計 * 100
  }

  get "sumPopulation"() {
    return this.prefectures.reduce((sum, pref) => sum + pref.population, 0);
  }

  $relativeProps = [
    [ "prefectures", [ "selectedRegion" ] ],
    [ "sumPopulation", [ "prefectures" ] ],
  ];
}

export default {
  ViewModel, html
}