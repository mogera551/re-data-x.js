
const THROUGH = value => () => value;
export class outputFilters {
  static localeString = (value, options) => { const num = parseFloat(value); return !isNaN(num) ? num.toLocaleString() : "" };
  static fixed        = (value, options) => { const num = parseFloat(value); return !isNaN(num) ? num.toFixed(options[0] ?? 0) : "" };
  static styleDisplay = (value, options) => value ? (options[0] ?? "") : "none";
  static truthy       = (value, options) => value ? true : false;
  static falsey       = (value, options) => !value ? true : false;
  static not          = this.falsey;
  static upperCase    = (value, options) => value?.toUpperCase ? value.toUpperCase() : "";
  static lowerCase    = (value, options) => value?.toLowerCase ? value.toLowerCase() : "";
  static eq           = (value, options) => value == options[0];
  static ne           = (value, options) => value != options[0];
  static lt           = (value, options) => Number(value) < Number(options[0]);
  static le           = (value, options) => Number(value) <= Number(options[0]);
  static gt           = (value, options) => Number(value) > Number(options[0]);
  static ge           = (value, options) => Number(value) >= Number(options[0]);
  static embed        = (value, options) => decodeURI((options[0] ?? "").replaceAll("%s", value));
  static ifText       = (value, options) => value ? options[0] ?? "" : options[1] ?? "";
  static null         = (value, options) => (value == null) ? true : false;
}

export class inputFilters {

}