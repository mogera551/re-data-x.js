# re-data-x.js
## javascriptフレームワーク
## 特徴
* シンプルで簡単に、そしてなるべく直感的に
* MVVM
* 宣言的な記述
* リアクティブ
* Web Componentベース
* 他のライブラリに依存しない
* おじさんに優しい

## 使い方

```html
<html>
<script src="https://cdn.jsdelivr.net/gh/mogera551/re-data-x.js@main/dist/re-data-x.min.js"></script>

<myapp-main></myapp-main>

<script type="module">
const html = '<div data-bind="message"></div>';
class ViewModel {
  "message" = "welcome to re-data-x.js";
}

redatax.components({"myapp-main": { html, ViewModel }});
</script>
</html>
```
[CodePen](https://codepen.io/mogera551/pen/OJEwOGr)

CDNからre-data-x.jsを読み込む

```html
<script src="https://cdn.jsdelivr.net/gh/mogera551/re-data-x.js@main/dist/re-data-x.min.js"></script>
```

カスタムタグ（コンポーネント）の記述

```html
<myapp-main></myapp-main>
```

スクリプトタグはモジュールにする

```html
<script type="module">
```

コンポーネントを構成するテンプレート（html）と、状態を保存するクラス（ViewModel）を定義する。
htmlの要素のdata-bind属性に、バインドするViewModelクラスのプロパティを記述する。

```js
const html = '<div data-bind="message"></div>';
class ViewModel {
  "message" = "welcome to re-data-x.js";
}
```

コンポーネント（html、ViewModel）を"myapp-main"をいう名で登録する。

```js
redatax.components({"myapp-main": { html, ViewModel }});
```


