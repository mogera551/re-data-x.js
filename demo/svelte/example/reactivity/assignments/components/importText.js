// path=textファイルのパス
const url = new URL(import.meta.url);
const path = url.searchParams.get("path");
const response = await fetch(path);
const text = await response.text();

export default text;