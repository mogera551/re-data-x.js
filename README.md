# re-data-x.js
## javascriptフレームワーク
## 特徴
* シンプルで簡単に、そしてなるべく直感的に
* MVVM・リアクティブ・宣言的な記述
* とくにリストの繰り返し構造を宣言的に記述できる
```html
<!-- テンプレート -->
<ul>
  <template data-bind="films">
    <li>{films.*.title}</li>
  </template>
</ul>
```

```JS
// ViewModelクラス
class ViewModel {
  "films" = [
    { title: "Jaws" },
    { title: "Star Wars" },
    { title: "The Terminator" },
  ];
  "films.*";
  "films.*.title";
}
```

```html
<!-- 出力 -->
<ul>
  <li>Jaws</li>
  <li>Star Wars</li>
  <li>The Terminator</li>
</ul>
```

* Web Componentベース
* 他のライブラリに依存しない

## 使い方
1. CDNから`re-data-x.js`を読み込む
2. コンポーネントのカスタムタグを書く
3. コンポーネントを定義する
4. コンポーネントをカスタムタグに関連付ける

```html
<html>
<!-- 1.CDNからre-data-x.jsを読み込む -->
<script src="https://cdn.jsdelivr.net/gh/mogera551/re-data-x.js@main/dist/re-data-x.min.js"></script>

<!-- 2.コンポーネントのカスタムタグを書く -->
<myapp-main></myapp-main>

<!-- scriptは、moduleを指定 -->
<script type="module">

// 3.コンポーネントを定義する。テンプレートと状態を保持するクラスを定義する。
const html = '<div>{message}</div>'; // messageプロパティをバインド
class ViewModel {
  "message" = "welcome to re-data-x.js"; // messageプロパティの内容
}

// 4.コンポーネントをカスタムタグに関連付ける
redatax.components({"myapp-main": { html, ViewModel }});

</script>
</html>
```
[CodePen](https://codepen.io/mogera551/pen/OJEwOGr)

### コンポーネントのモジュール化
コンポーネントの定義を外部ファイル（`components/main.js`）として分離できる

ファイル構成
```
+ index.html
+ /components
    + main.js
```    

#### index.html
* コンポーネントの定義をインポートする
* `redatax.components()`でインポートしたコンポーネントの定義をカスタムタグと関連付ける
* `redatax.prefix()`でカスタムタグのプレフィックスを省略できる

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

#### main.js
* コンポーネントのテンプレート(html)と状態を保持するクラス(ViewModel)を定義しエクスポートする
* 特に他のファイルをインポートする必要はない

```js
const html = `
<div>{message}</div>
`;

class ViewModel {
  "message" = "welcome to re-data-x.js";
}

// テンプレート(html)とクラス(ViewModel)をエクスポート
export default { html, ViewModel };
```

### ViewModelクラスとテンプレートの関連付け（バインド）
* ViewModelクラスのプロパティとテンプレートのテキストもしくは、DOM要素の属性に関連付け（バインド）をする
* テキストとしてバインドする場合、ViewModelクラスのプロパティの名前を`{}`でくくる
```html
<div>{message}</div>
```

* DOM要素の属性とバインドする場合、`data-bind`属性に記述する
* 書式は、`DOM属性名:プロパティ名`
```html
<input data-bind="value:message">
```

* 複数指定する場合、セミコロン（`;`）で区切る
```html
<input type="button" data-bind="value:message; disabled:isIncomplete;">
```

* DOM属性名を省略した場合、デフォルトの属性名が割り当てられる、デフォルトは要素により異なる
   * `<input type="checkbox"/>`の場合、デフォルト属性名`checked`
   * `<input type="radio"/>`の場合、デフォルト属性名`checked`
   * `<input/>`、`<select/>`、`<textarea/>`の場合、デフォルト属性名`value`
   * それ以外の場合、デフォルト属性名`textContent`
```html
<input type="checkbox" data-bind="isOk"><!-- checked:isOkと同じ -->
<input type="radio" data-bind="isComplete"><!-- checked:isCompleteと同じ -->
<input data-bind="message"><!-- value:messageと同じ -->
<select data-bind="selectedValue"><!-- value:selectedValueと同じ -->
<textarea data-bind="textValue"><!-- value:textValueと同じ -->
<div data-bind="message"><!-- textContent:messageと同じ -->
```

* ViewModelクラスのプロパティとinput系のデフォルト属性とをバインドした場合、双方向にデータは更新される
```html
<input data-bind="message"><!-- 入力するとmessageプロパティの値に反映される -->
```

```JS
class ViewModel {
  "message" = "the quick brown fox";
}
```

### ViewModelクラスのプロパティの書き方
* プロパティの名前をダブルクォーテーション（`"`）で囲む
* プロパティの名前に使える文字は、英数・アンダーバー（`_`）
* `__`で始まるプロパティは、privateなプロパティで通常使わない
```JS
class ViewModel {
  "message" = "welcome to re-data-x.js";
}
```
* getを使って、宣言的なプロパティを記述できる
```html
{price} × {tax_rate} ＝ {price_including_tax}
```

```JS
class ViewModel {
  "price" = 100;
  "tax_rate" = 1.10;
  get "price_including_tax"() {
    return Math.floor(Number(this.price) * this.tax_rate);
  }
}
```

* データがオブジェクトなどの階層構造を持つ場合、ドット記法でプロパティを記述する
```JS
class ViewModel {
  "member" = {
    name: "Yamada Taro",
    age: 24,
  };
  "member.name";
  "member.age";
}
```

### 繰り返し構造（リスト）の書き方
#### テンプレート
* 繰り返す要素を`<template>`で囲む
* `<template>`にリスト`cities`をバインドする、DOM属性名は指定しない
* 繰り返す要素にバインドする場合、ドット記法で記したリスト要素のプロパティ`cities.*.name` `cities.*.population` `cities.*.share`を指定する
```html
<ul>
  <template data-bind="cities">
    <li>{cities.*.name} / {cities.*.population} / {cities.*.share}%</li>
  </template>
</ul>
```
#### ViewModelクラス
* リスト要素のプロパティをドット記法で宣言する`cities.*` `cities.*.name` `cities.*.population`
* リスト要素にも、getを使って、宣言的なプロパティを記述できる`cities.*.share`
```JS
class ViewModel {
  "cities" = [
    { name: "Tokyo", population: 9717216 },
    { name: "Osaka", population: 2758013 },
    { name: "Nagoya", population: 2325946 },
  ];
  "cities.*";
  "cities.*.name";
  "cities.*.population";
  get "cities.*.share"() {
    return (this["cities.*.population"] / this.sumPopulation * 100).toFixed(2);
  }
  get "sumPopulation"() {
    return this.cities.reduce( (sum, city) => sum + city.population, 0);
  }
}
```

#### HTML出力例
```html
<ul>
  <li>Tokyo / 9717216 / 65.65%</li>
  <li>Osaka / 2758013 / 18.63%</li>
  <li>Nagoya / 2325946 / 15.71%</li>
</ul>
```
