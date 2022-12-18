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
3. コンポーネントを定義する
4. コンポーネントをカスタムタグに関連付ける

```html
<html>
<!-- 1.CDNからre-data-x.jsを読み込む -->
<script src="https://cdn.jsdelivr.net/gh/mogera551/re-data-x.js@main/dist/re-data-x.min.js"></script>

<!-- 2.コンポーネントのカスタムタグを書く -->
<myapp-main></myapp-main>

<!-- scriptは、moduleを利用 -->
<script type="module">

// 3.コンポーネントを定義する。テンプレートと状態を保持するクラスを定義する。
const html = '<div>{message}</div>'; // messageプロパティをバインド
class ViewModel {
  "message" = "welcome to re-data-x.js";
}

// 4.コンポーネントをカスタムタグに関連付ける
redatax.components({"myapp-main": { html, ViewModel }});

</script>
</html>
```
[CodePen](https://codepen.io/mogera551/pen/OJEwOGr)

### コンポーネントのモジュール化
コンポーネントを外部ファイルとして分離する。

ファイル構成
```
+ index.html
+ /components
    + main.js
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
const html = `
<div>{message}</div>
`;

class ViewModel {
  "message" = "welcome to re-data-x.js";
}

// テンプレートとクラスをエクスポート
export default { html, ViewModel };
```

### ViewModelクラスのプロパティの書き方
* ダブルクォーテーション（\"）で囲む
* 名前は、英数、アンダーバー（\_）
* データがオブジェクトなどの階層構造を持つ場合、ドット記法で階層を表現する
* データがリストなど繰り返し構造を持つ場合、アスタリスク（\*）を用いて表現する
* getterが使える

main.js
```js

const member = {
  family_name:"山田",
  first_name:"太郎"
  age:24,
}

const products = [
  { id:1, name:"商品名A", price:500, tax_parcent:8 },
  { id:2, name:"商品名B", price:600, tax_parcent:10 },
  { id:3, name:"商品名C", price:250, tax_parcent:10 },
];

class ViewModel {
  "message" = "おはようございます！";
  
  "member" = member;
  // 階層構造をドット記法を用いて表現
  "member.family_name";
  "member.first_name";
  "member.age";
  // getterを使って、氏名を取得するプロパティを合成
  get "member.name"() {
    return `${this["member.family_name"]} ${this["member.first_name"]}`;
  }
  
  "products" = products;
  // アスタリスク（*）を用いてリスト構造を表現
  "products.*";
  "products.*.id";
  "products.*.name";
  "products.*.price";
  "products.*.tax_percent";
  // getterを使って、消費税額を取得するプロパティを合成
  get "products.*.tax"() {
    // アスタリスク（*）を使って記述できる
    return this["products.*.price"] * this["products.*.tax_percent"] / 100;
  }
}

```

main.html
```html
{message}

{member.family_name}
{member.first_name}
{member.age}
{member.name}

<table>
  <tr>
    <th>ID</th>
    <th>商品名</th>
    <th>価格</th>
    <th>適用消費税</th>
    <th>消費税額</th>
  </tr>
  <template data-bind="products">
  <tr>
    <td>{products.*.id}</td>
    <td>{products.*.name}</td>
    <td>{products.*.price}</td>
    <td>{products.*.tax_percent}</td>
    <td>{products.*.tax}</td>
  </tr>
  </template>
</table>

```

HTML出力例
```html
おはようございます！

山田
太郎
24
山田 太郎

<table>
  <tr>
    <th>ID</th>
    <th>商品名</th>
    <th>価格</th>
    <th>適用消費税</th>
    <th>消費税額</th>
  </tr>
  <tr>
    <td>1</td>
    <td>商品名A</td>
    <td>500</td>
    <td>8</td>
    <td>40</td>
  </tr>
  <tr>
    <td>2</td>
    <td>商品名B</td>
    <td>600</td>
    <td>10</td>
    <td>60</td>
  </tr>
  <tr>
    <td>3</td>
    <td>商品名C</td>
    <td>250</td>
    <td>10</td>
    <td>25</td>
  </tr>
</table>

```

### テンプレートのプロパティバインド方法
* テキストとしてバインドする場合、プロパティを\{\}でくくる
* HTML要素の属性値とバインドする場合、data-bind属性に記述する
  * 書式は、「属性名:プロパティ;」※style属性と同じような書式
  * 属性名を省略した場合、下記の属性名をデフォルト値とする
     * checkbox、radioの要素の場合、checked
     * 入力系の要素の場合、value
     * その他、textContent
  * 入力系要素の場合、バインドは双方向となる。入力値がプロパティへ反映される
* リストなど、繰り返し構造を持つプロパティとバインドする場合、template要素のdata-bind属性にプロパティを記述する。
* on～イベントもdata-bind属性で指定する

```html
<div>{message}</div>
<input data-bind="message">
<button data-bind="disabled:isEmptyMessage; onclick:regist">登録</button>

<select data-bind="selectProductId">
  <template data-bind="products">
    <option data-bind="products.*.id">{products.*.name}</option>
  </template>
</select>

```

```js

class ViewModel {
  "message" = "";
  get "isEmptyMessage"() {
    return this["message"] ? true : false;
  }
  
  "produts" = [
    { id:1, name:"商品名A", price:500, tax_parcent:8 },
    { id:2, name:"商品名B", price:600, tax_parcent:10 },
    { id:3, name:"商品名C", price:250, tax_parcent:10 },
  ];
  "products.*";
  "products.*.id";
  "products.*.name";
  
  "selectProductId";
  
  regist() {
    // 登録処理
    // 非同期の場合、async regist()とする
  }
}

```
