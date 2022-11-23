export default class CheckPoint {
  point = 0;
  last = 0;
  name;
  results = 0;

  constructor(name, results) {
    this.name = name;
    this.point = 0;
    this.last = performance.now();
    this.results = results;
  }
  check() {
    this.point++;
    const now = performance.now();
    const duration = now - this.last;
    if (!this.results.has(this.point)) {
      this.results.set(this.point, duration);
    } else {
      this.results.set(this.point, this.results.get(this.point) + duration);
    }
    this.last = now;
  }

  static resultsByName = new Map();
  static create(name) {
    let results = this.resultsByName.get(name);
    if (results == null) {
      results = new Map();
      this.resultsByName.set(name, results);
    }
    return new CheckPoint(name, results);
  }
}
