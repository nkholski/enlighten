Enlighten
=========
> A library for parsing text with word explainations, indicies and word lists.

Please Enlight me! This libary makes it easy to make texts more inclusive and generlly approachable by explaining presumably difficult words. It can parse texts indentified by id or class in the DOM and make words clickable and either linked to an index, to a standard modal popup or a custom function.

The libary was built to power Make Equal Enlighten, a curated database of difficult words related to anti-discrimation in English and Swedish. It's however easy to use with a custom API or properly formatted JSON.

Enlighten is highly customizable, has zero dependencies and is ES5 compilant. It's written in ES6 and built with webpack and is quality ensured through TDD. Contributions in the form of issue reports, PRs or suggestions are highly appreciated.

## Features

- Parse text and make difficult words clickable for explaination.
- Build an index of words based on the content of a text.
- Build a word list of words based on the content of a text.
- Build an index or word list containing all words in the database.
- Configure to exclude certain words or add addtional ones to the fetched ones.
- Enlighten automatically store words in LocalStorage for quicker parsing and better UX.

## Examples

Init Enlighten and set language to English
```js
var en = new Enlighten("en");
```
Parse a text in element with id "content". Clickable words with default popups.
```js
en.parseElement("#content");
```
Same as above except that only first occurances will be clickable.
```js
en.parseElement("#content", false);
```

Parse a text in element with id "content", custom click handler.
```js
en.parseElement("#content", null, "myPopup");
function myPopup (id,title,text){
    alert(title+"\n"+text);
}
```
Build an index and word list to two separate elements based on content of first element with class "content".
```js
en.insertIndex(".content", "#index");
en.insertWordlist(".content", "#wordlist");
```
Parse a element with id "content" and link words to wordlist on the same page.
```js
en.parseElement("#content", null, "index");
en.insertWordlist(".content", "#wordlist");
```
Make a page with an index and list of all words in the database.
```js
en.insertIndex(null, "#index");
en.insertWordlist(null, "#wordlist");
```
Ignore a word or part of text when parsing an element by using en-ignore in the text to use.
```html
Hello! This difficult word: plenipotentiary will be explained, however <en-ignore>everything in this scentence is ignored including plenipotentiary</en-ignore>
```
Force a match that can't be found using keywords by passing a matching keyword in <enlighten>
```html
<enlighten data-word="alphabeth">ABC</enlighten>
```

## API
Check (partial) JSDOCs in source code for API. Methods starting with _ is primarly ment as private methods.

## Setting up local development
Install dependencies
```sh
$ npm install
```
Run the local webpack-dev-server with livereload and autocompile on (will show example) [http://localhost:8080/](http://localhost:8080/)
```sh
$ npm run dev
```
Run tests
```sh
$ npm run test
```
Build the current application
```sh
$ npm run build
```