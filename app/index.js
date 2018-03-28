/**
 * @author       Niklas Berg <niklas@makeequal.se>
 * @copyright    2018 Niklas Berg
 * @license      {@link https://github.com/nkholski/enlighten/blob/license.txt|MIT License}
 *
 * A library for parsing text with word explainations, indicies and word lists.
 * Link: https://github.com/nkholski/enlighten
 * 
 */


/* TODO 
   1. Index and word list with all words.
   2. Test match: word, *word, word*
   3. Implement custom words
*/

global.Enlighten = class {
    /**
     * Constructor
     *
     * @param {language: string, useLocalStorage: bool, api: string} config 
     *                      - A configuration object. supported keys:
     *                          language {string} - Supported by Make Equal Enlighten: "sv" or "en" (default is "en")
     *                          useLocalStorage - Boolean weather to use local storage or not (default is true)
     *                          api - url to use. Default is to use Make Equal Enlighten on analytics.makeequal.se
     *
     * @return {number[]}   - Array of word ids
     */
    constructor(config = {}) {
        // Config
        this.language = config.hasOwnProperty("language") ? config.language : "en";
        this.useLocalStorage = config.hasOwnProperty("useLocalStorage") ? config.useLocalStorage : true;
        this.api = config.hasOwnProperty("api") ? config.api : "https://analytics.makeequal.se/api/words/{language}";
        this.exclude = [];
        this.words = [];
        this.quedTasks = [];
        this.updated = false;
        this.matches = [];
        // Extra words - Not implemented
        this.extraWords = [];
        this._getWords();
        window.enlightenPopup = this._popupPassthrough.bind(this);
        // Append modal popup
        this.modal = this._addModalHTML();
    }


    /**
     * Configure the script
     *
     * @param {object} config - A configuration object. supported keys:
     *                          language {string} - Supported by Make Equal Analytics server: "sv" or "en"
     *                          exclude {number[]} - List of ids to ignore
     *
     * @return {number[]} - Array of word ids
     */
    config(config) {
        Object.keys(config).forEach(
            (key) => {
                switch (key) {
                    case "language":
                    case "exclude":
                        this[key] = config[key];
                        break;
                }
            }
        );
    }

    /**
     * Add a word programmatically besides what's loaded via API or JSON.
     *
     * @param {{title: string, matches: string[], text: string }} word - A word and it's matches
     *
     * @return {number} - Temporary id given to the word
     */
    addWord(word) {
        if (!this._isReady("addWord", word)) {
            return;
        }
        word.id = -this.extraWords.length - 1; // Ids from -1 and below as opposite of fetched words that are positive.
        this.extraWords.push(word);
        this._updateMatches();
    }


    /**
     * Get a word from id
     *
     * @param {number} id - Id for word to find
     *
     * @return {{id: number, word: string, text: string}}
     */
    getWord(id) {
        if (id < 0) {
            return this.extraWords.find((el) => {
                return el.id === id;
            });
        } else {
            return this.words.find((el) => {
                return el.id === id;
            });
        }
    }


    /**
     * Insert a word list
     *
     * @param {string} sourceRef - Class name or id of element containing source text to build word list from. Make a word list with all avaliable words by passing null
     * @param {string} targetRef - Class name or id of element to insert the generated word list in. Set it to same element as source by passing null.
     * @param {bool} append - Insert the word list after preexisting content of the target (default, true), or relace it (false).
     * 
     * @return {void}
     */
    insertWordlist(sourceRef = "", targetRef = null, append = true) {
        if (!this._isReady("insertWordlist", sourceRef, targetRef, append)) {
            return;
        }
        targetRef = targetRef ? targetRef : sourceRef;
        let source = sourceRef.length > 0 ? this._getElement(sourceRef).innerHTML : "";
        let target = this._getElement(targetRef);
        let list = this._makeWordList(source);
        if (append) {
            target.innerHTML += list;
        } else {
            target.innerHTML = list;
        }
    }

    /**
     * Insert an index
     *
     * @param {string} sourceRef - Class name or id of element containing source text to build word list from. Make a word list with all avaliable words by passing null
     * @param {string} targetRef - Class name or id of element to insert the generated word list in. Set it to same element as source by passing null.
     * @param {bool} prepend - Insert the word list before preexisting content of the target (default, true), or relace it (false).
     * @param {bool} linked - Make anchor tags with hrefs matching corresponding anchor names in word list (default, true), or make it plain text (false)
     * 
     * @return {void}
     */
    insertIndex(sourceRef, targetRef, prepend = true, linked = true) {
        if (!this._isReady("insertIndex", sourceRef, targetRef, prepend, linked)) {
            return;
        }
        targetRef = targetRef ? targetRef : sourceRef;
        let source = sourceRef.length > 0 ? this._getElement(sourceRef).innerHTML : "";
        let target = this._getElement(targetRef);
        let list = this._makeIndex(source, linked);
        if (prepend) {
            target.innerHTML = list + target.innerHTML;
        } else {
            target.innerHTML = list;
        }
    }

    /**
     * Parse an element by making identified words clickable
     *
     * @param {string} sourceRef - Class name or id of element to parse
     * @param {bool} multiple - Parse all occurances (default, true) or only first occurance (false)
     * @param {string} method - Function to call when clicked. Set to null for default popup, "index" for linking it to a matching word list or name of custom method.
     * 
     * @return {void}
     */
    parseElement(sourceRef, multiple = true, method = null) {
        if (!this._isReady("parseElement", sourceRef, multiple, method)) {
            return;
        }
        let source = this._getElement(sourceRef);
        source.innerHTML = this.parseText(source.innerHTML, multiple, method);
    }

    /**
     * Get a list of word ids from a text (html-tags allowed)
     *
     * @param {string} text - Text to parse
     * @param {bool} multiple - Weather to make all matches clickable or just first match
     * @param {function} method - Method to call on click if not default (id, word and explaination will be passed to the method)
     *                            Pass "index" to link the word to a wordlist on the same page instead of popup (or other custom solution)
     *
     * @return {string} - Parsed text
     */
    parseText(text, multiple = true, method = "_defaultPopup") {
        let ids = this._getIdsFromText(text);
        let found = [];
        multiple = multiple === false ? false : true; // allow passing null
        //text = text.toLowerCase();
        method = method === null ? "_defaultPopup" : method; // Delayed call makes default not working...
        this.matches.forEach(
            (match) => {
                if (ids.indexOf(match.word.id) === -1) {
                    return;
                }
                let cleanStart = match.match.substring(0, 1) !== "*";
                let cleanEnd = match.match.substring(match.match.length-1) !== "*";
                let compare = match.match.replace(/\*/g, "");
                let pattern = "<a.*?>.*?<\/a>" + // Not within achors
                    "|<en-ignore\\b[^>]*>.*?<\/en-ignore>" + // Not within ignore
                    "|" + compare + "*.?\>" + // Not inside tags
                    "|([a-zåäö]*" + compare + "[a-zA-ZåäöÅÄÖ]*)"; // But match this

                let rx = new RegExp(pattern, "ig"); // + (multiple ? "g" : ""));


                if (rx.test(text)) {
                    text = text.replace(rx, function (matchedWord, p1) {
                        if(!multiple && found.indexOf(match.word.id) !== -1) {
                            return matchedWord;
                        }
                        // Only match words which begins with match
                        /*if (pos !== 0) {
                            if ((/[a-z]/).test(text.substr(pos - 1, 1))) {
                                return matchedWord;
                            }
                        }
                        // Only match words which ends with match
                        if (pos + matchedWord.length < text.length && (/[a-z]/).test(text.substr(pos + matchedWord.length, 1))) {
                            return matchedWord;
                        }*/
                        // Only find words starting with the matcher
                        if (cleanStart && matchedWord.toLowerCase().indexOf(compare) !== 0) {
                            return matchedWord;
                        }
                        // Only find words ending with the matcher
                        if (cleanEnd && matchedWord.toLowerCase().indexOf(compare) !== matchedWord.length - compare.length) {
                            return matchedWord;
                        }
                        found.push(match.word.id);

                        if (method === "index") {
                            return p1 ? "<a href='#ENLIGHT_WORD" + match.word.id + "' class='enlighten-clickable'>" + p1 + "</a>" : matchedWord;
                        } else {
                            return p1 ? "<a onClick='enlightenPopup(" + match.word.id + ",\"" + method + "\")' class='enlighten-clickable'>" + p1 + "</a>" : matchedWord;
                        }
                    });
                }




            }
        );
        text = text.replace(/<enlighten\ data-word\=[\'\"](.*?)[\'\"]\>(.*?)<\/enlighten>/gi, (fullMatch, keyWord, show) => {
            let found = false;
            let wordObject;
            // DRY - FAIL
            this.matches.forEach(
                (match) => {
                    if (found) {
                        return;
                    }
                    if (match.match === keyWord.toLowerCase()) {
                        wordObject = match;
                        found = true;
                        return;
                    }
                });
            if (!found) {
                return fullMatch;
            }
            if (method === "index") {
                return keyWord ? "<a href='#ENLIGHT_WORD" + wordObject.word.id + "' class='enlighten-clickable'>" + show + "</a>" : fullMatch;
            } else {
                return keyWord ? "<a onClick='enlightenPopup(" + wordObject.word.id + ",\"" + method + "\")' class='enlighten-clickable'>" + show + "</a>" : fullMatch;
            }

        });
        return text;
    }


    /**
     * Get a list of word ids from a text (html-tags allowed)
     *
     * @param {string} text - Text to build array from
     *
     * @return {number[]} - Array of word ids
     */

    _getIdsFromText(text = "") {
        let ids = [];
        let rx;
        text = text.replace(/<en\-ignore\>.*?<\/en-ignore>/gi, "");
        text = text.replace(/<enlighten (.*?)>.*?<\/enlighten>/gi, "$1");
        text = text.replace(/<.*?>/gi, "");

        this.matches.forEach((match) => {
            if (ids.indexOf(match.word.id) !== -1 || this.exclude.indexOf(match.word.id) !== -1) {
                return;
            }
            if (text.length === 0) { // Get entire word list if the text is null
                ids.push(match.word.id);
                return;
            }
            let cleanStart = match.match.substring(0, 1) !== "*";
            let cleanEnd = match.match.substring(match.match.length-1) !== "*";
            let compare = match.match.replace(/\*/g, "");

            let pattern = cleanStart ? "(^|[^a-zåäöÅÄÖ])" : "";
            pattern += compare;
            pattern += cleanEnd ? "($|[^a-zåäöÅÄÖ])" : "";
            rx = new RegExp(pattern, "i");
            if (rx.test(text)) {
                ids.push(match.word.id);
            }

        });
        return ids;
    }

    /**
     * Generate a index
     *
     * @param {string} text - Text to build from
     * @param {bool} linked - Should it add a anchor to the word?
     *
     * @return {text} - Generated html
     */
    _makeIndex(text, linked = true) {
        let ids = this._alphabetizeIds(this._getIdsFromText(text));
        let bullets = "";
        ids.forEach(
            (id) => {
                if (linked) {
                    bullets += `<li><a href="#ENLIGHT_WORD${id}">${this.getWord(id).title}</a></li>\n`;
                } else {
                    bullets += `<li>${this.getWord(id).title}</li>\n`;
                }
            }
        );
        return `
      <div class="enlighten-index">
        <ol>
          ${bullets}
        </ol>
      </div>
    `;
    }

    /**
     * Generate a word list
     *
     * @param {string} text - Text to build from
     * @param {bool} linked - Let the index find the words?
     *
     * @return {text} - Generated html
     */
    _makeWordList(text = "", linked = true) {
        let ids = this._alphabetizeIds(this._getIdsFromText(text));
        let html = "";
        ids.forEach(
            (id) => {
                let word = this.getWord(id);
                html += '<div class="enlighten-word">';
                if (linked) {
                    html += `<a name="ENLIGHT_WORD${id}"></a>`;
                }
                html += `<h3>${word.title}</h3>
             <span>${word.text}</span>
           </div>`;
            }
        );
        return `<div class="enlighten-word-explainations">
           ${html}
       </div>
     `;
    }

    _popupPassthrough(id, method) {
        let word = this.getWord(id);
        if (method === "_defaultPopup") {
            this._defaultPopup(id, word.title, word.text);
        } else {
            window[method](id, word.title, word.text);
        }

    }

    /**
     * Default popup fuction
     *
     * @param {number} id - Id of the word
     * @param {string} word - The word to show
     * @param {string} explaination - The explaination
     *
     * @return null
     */
    _defaultPopup(id, word, explaination) {
        let modal = document.getElementById("enlightenModal");
        modal.style.display = "block";
        modal.getElementsByTagName("h3")[0].innerHTML = word;
        modal.getElementsByTagName("p")[0].innerHTML = explaination;
    }

    /** 
     * Get an element based by id or class name (instead of using jQuery ;-D)
     */
    _getElement(element) {
        if (element.indexOf("#") > -1) {
            return document.getElementById(element.substring(1));
        } else {
            return document.getElementsByClassName(element.substring(1))[0];
        }
    }

    /** 
     * Update list of matches
     */
    _updateMatches() {
        let matches = [];
        let completeList = this.words.concat(this.extraWords);
        completeList.forEach((word) => {
            word.matches.forEach((match) => {
                matches.push({
                    match,
                    word
                });
            });
        });
        matches.sort(function (a, b) {
            return b.match.length - a.match.length;
        });
        this.matches = matches;
    }

    /**
     * Alphabethic list of matches for indices and word lists
     */
    _alphabetizeIds(ids) {
        return ids.sort((a, b) => {
            return this.getWord(a).title.localeCompare(this.getWord(b).title);
        });
    }

    /** 
     * Get words from database (or cached in localStorage)
     */
    _getWords() {
        // Try to get it from localStorage
        let words = localStorage.getItem("enlighten_words_" + this.language);
        if (words && words.length > 0) {
            this.words = JSON.parse(words);
            this._updateMatches();
        }
        // Fetch from server (even if we found something in localStorage)
        this._ajaxGet().then(
            (response) => {
                this.words = JSON.parse(response).data;
                localStorage.setItem("enlighten_words_" + this.language, JSON.stringify(this.words));
                this._updateMatches();
                this.updated = true;
                this._executeQue();
            }
        );
    }

    /** 
     * Check if Enlighten is ready to parse text (got words to use).
     */
    _isReady(...args) {
        if (this.words.length > 0 && (this.useLocalStorage || this.updated)) {
            return true;
        }
        this._addToQue(args);
    }

    /** 
     * Add to cue of tasks to execute when Enlighten is ready.
     */
    _addToQue(...args) {
        let method = args[0].shift();
        this.quedTasks.push({
            method: method,
            args: args[0]
        });
    }

    /** 
     * Execute waiting tasks.
     */
    _executeQue() {
        this.quedTasks.forEach(
            (task) => {
                this[task.method](...task.args);
            }
        );
        this.quedTasks = [];
    }

    /** 
     * Fetch words from API or static JSON-file
     */
    _ajaxGet() {
        return new Promise((resolve, reject) => {
            let url = this.api.replace("{language}", this.language);
            let req = new XMLHttpRequest();
            req.open("GET", url);
            req.onload = function () {
                if (req.status === 200) {
                    resolve(req.response);
                } else {
                    reject(new Error(req.statusText));
                }
            };

            req.onerror = function () {
                reject(new Error("Network error"));
            };

            req.send();
        });
    }

    /** 
     * Make default modal popup
     */
    _addModalHTML() {
        let modalEl = document.createElement("div");
        modalEl.setAttribute("id", "enlightenModal");
        modalEl.setAttribute("class", "modal");
        modalEl.innerHTML = `
          <div class="modal-content">
            <span class="close">&times;</span>
            <h3>Title</h3>
            <p>Content</p>
          </div>f`;

        let bodyEl = document.getElementsByTagName('body')[0];
        bodyEl.appendChild(modalEl);
        let span = document.getElementsByClassName("close")[0];

        // When the user clicks on <span> (x), close the modal
        span.onclick = function () {
            modalEl.style.display = "none";
        };

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function (event) {
            if (event.target.id === "enlightenModal") {
                modalEl.style.display = "none";
            }
        };
        return modalEl;
    }
};
