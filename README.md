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
1. CDNからre-data-x.jsを読み込む
2. コンポーネントのカスタムタグを書く
3. コンポーネントのテンプレート（html）と状態を持つクラス（ViewModel）を定義する
4. コンポーネントのテンプレートとクラスをカスタムタグに関連付ける

```html
<html>
<!-- 1.CDNからre-data-x.jsを読み込む -->
<script src="https://cdn.jsdelivr.net/gh/mogera551/re-data-x.js@main/dist/re-data-x.min.js"></script>

<!-- 2.コンポーネントのカスタムタグを書く -->
<myapp-main></myapp-main>

<!-- scriptは、moduleを利用 -->
<script type="module">

// 3.コンポーネントのテンプレートと状態を持つクラスを定義する
//   テキストノードにバインドするプロパティを埋め込む場合、｛｝で括る
const html = '<div>{message}</div>';
class ViewModel {
  "message" = "welcome to re-data-x.js";
}

// 4.コンポーネントのテンプレートとクラスをカスタムタグに関連付ける
redatax.components({"myapp-main": { html, ViewModel }});

</script>
</html>
```
[CodePen](https://codepen.io/mogera551/pen/OJEwOGr)

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

// コンポーネントをインポート
import main from "./components/main.js"

// プレフィックスを指定することで、コンポーネント登録時にカスタムタグのプレフィックスを省略できる。
redatax.prefix("myapp").components({ main });

</script>
</html>
```

main.js
```js
// importText.jsを使ってテンプレートをインポート
// pathには、index.htmlからの相対パスを指定
import html from "./importText.js?path=./components/main.html";

class ViewModel {
  "message" = "welcome to re-data-x.js";
}

// テンプレートとクラスをエクスポート
export default { html, ViewModel };
```

main.html
```html
<div>{message}</div>
```



