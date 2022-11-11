import {inputFilters, outputFilters} from "./Builtin.js";

// "property:vmProperty|toFix,2|toLocaleString;"
// => toFix,2|toLocaleString

export default class Filter {
  static applyForInput = (value, filters) => 
    filters.reduceRight((v, f) => (f.name in inputFilters) ? inputFilters[f.name](v, f.options) : v, value);
  static applyForOutput = (value, filters) =>
    filters.reduce((v, f) => (f.name in outputFilters) ? outputFilters[f.name](v, f.options) : v, value);
}
