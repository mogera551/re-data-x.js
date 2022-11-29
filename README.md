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

コンポーネント（html、ViewModel）をカスタムタグ（"myapp-main"）として登録する。

```js
redatax.components({"myapp-main": { html, ViewModel }});
```

### コンポーネントのモジュール化
コンポーネントを構成するテンプレート（html）と、状態を保存するクラス（ViewModel）を外部ファイルに定義する。
src/tool/importText.jsをコピーする。

ファイル構成
```
+ index.html
+ /components
    + importText.js
    + main.js
    + main.html
```

index.html
```html
<html>
<script src="https://cdn.jsdelivr.net/gh/mogera551/re-data-x.js@main/dist/re-data-x.min.js"></script>

<myapp-main></myapp-main>

<script type="module">
import main from "./components/main.js"
  
redatax.prefix("myapp").components({ main });
</script>
</html>
```

main.js
```js
import html from "./importText.js?path=./components/main.html";

class ViewModel {
  "message" = "welcome to re-data-x.js";
}

export default { html, ViewModel };
```

main.html
```html
<div data-bind="message"></div>
```

mainコンポーネントをインポート

```js
import main from "./components/main.js"
```

プレフィックスを指定することで、コンポーネント登録時にカスタムタグのプレフィックスを省略できる。

```js
redatax.prefix("myapp").components({ main });
```

テンプレート（html）のインポート

```js
import html from "./importText.js?path=./components/main.html";
```

コンポーネントのエクスポート

```js
export default { html, ViewModel };
```

