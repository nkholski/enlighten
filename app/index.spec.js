/*globals Enlighten */
import "./index.js";


window.addEventListener('beforeunload', function () {
    console.profileEnd('cause of reload');
});


let body = document.getElementsByTagName("body")[0];
body.innerHTML += "<div class='target' id='target'></div>";
body.innerHTML += "<div class='source' id='source'></div>";

describe("Configuration", function () {
    it("Set language to Swedish", function () {
        let mee = new Enlighten({
            language: "sv"
        });
        expect(mee.language).toBe("sv");
    });
    it("set language to English", function () {
        let mee = new Enlighten("en");
        expect(mee.language).toBe("en");
    });
});

describe("_getIdsFromText() => ", function () {
    let mee = new Enlighten("en");
    beforeAll((done) => {
        let doneCheck = () => {
            if (mee.words.length > 0) {
                done();
            } else {
                setTimeout(() => {
                    doneCheck();
                }, 100);
            }
        };
        doneCheck();
    });
    beforeEach(
        () => {
            mee.config({
                "exclude": []
            });
        }
    );
    it("parse asexual", function () {
        let text = "hohoho gender adada";
        expect(mee._getIdsFromText(text)).toEqual([54]);
    });
    it("dont register same word multiple times", function () {
        let text = "hohoho asexual adada asexual";
        expect(mee._getIdsFromText(text).reduce((r, k) => {
            r[k] = 1 + r[k] || 1;
            return r;
        }, {})[38]).toEqual(1);
    });

    it("Find multiple words", function () {
        let text = "111 asexual age asexual age gender";
        expect(mee._getIdsFromText(text).indexOf(69)).toBeGreaterThan(-1);
        expect(mee._getIdsFromText(text).indexOf(38)).toBeGreaterThan(-1);
        expect(mee._getIdsFromText(text).indexOf(54)).toBeGreaterThan(-1);
    });

    /*it("Find starting with word", function () { // No data to test from yet
        let text = "hohoho sexy sdasas";
        expect(mee._getIdsFromText(text)).toEqual([54]);
    });*/

    it("dont register ending with word", function () {
        let text = "hohoho dasdasasexuality adasd";
        expect(mee._getIdsFromText(text)).toEqual([]);
    });
    it("ignore case", function () {
        let text = "hohoho aseXual adasd";
        expect(mee._getIdsFromText(text).indexOf(38)).toBeGreaterThan(-1);
    });

    it("ok to start with word", function () {
        let text = "asexual dada";
        expect(mee._getIdsFromText(text).indexOf(38)).toBeGreaterThan(-1);
    });

    it("ignore a word", function () {
        let text = "asexual dada";
        mee.config({
            "exclude": [38]
        });
        expect(mee._getIdsFromText(text)).toEqual([]);
    });

    it("don't double match", function () {
        let text = "aaa dada asexual asexual ads";
        expect(mee._getIdsFromText(text)).toEqual([38]);
    });

    it("ignore en-ignore", function () {
        let text = "aaa dada <en-ignore>asexual</en-ignore> ads";
        expect(mee._getIdsFromText(text)).toEqual([]);
    });

    it("force match with tag", function () {
        let text = "aaa dada <enlighten asexual>random</enlighten> ads";
        expect(mee._getIdsFromText(text)).toEqual([38]);
    });

    it("keep out of tags!", function () {
        let text = "<b class='asexual'>hello</b>";
        expect(mee._getIdsFromText(text)).toEqual([]);
    });

    it("make a full list of ids", function () {
        expect(mee._getIdsFromText().length).toBeGreaterThan(0);
    });

    it("Add a word!", function () {
        let text = "this is new: dasdas dasdasdasd !";
        mee.addWord({
            title: "Dasdas",
            matches: ["dasdas"],
            text: "Wierd word."
        });
        expect(mee._getIdsFromText(text).length).toBeGreaterThan(0);
    });

    it("Match wildcard", function () {

        let text = "this is new: Xdasdas dxsdxsX XdasdxsX!";
        let wait = () => {
            mee.addWord({
                title: "Dasdas",
                matches: ["*dasdas"],
                text: "Wierd word."
            });
            mee.addWord({
                title: "Dxsdxs",
                matches: ["dxsdxs*"],
                text: "Another wierd word."
            });
            mee.addWord({
                title: "Dasdxs",
                matches: ["*dasdxs*"],
                text: "Third wierd word."
            });
            mee.addWord({
                title: "xasdasdas",
                matches: ["*XXXXXXX*"],
                text: "Don't match this."
            });
            if (mee.words.length > 0 && mee.extraWords.length > 0) {
                let ids = mee._getIdsFromText(text);
                expect(mee._getIdsFromText(text).length).toBe(3);
            } else {
                setTimeout(() => {
                    wait();
                }, 100);
            }
        };
        wait();
    });
});

describe("getWord() => ", function () {
    let mee = new Enlighten("en");
    beforeAll((done) => {
        let doneCheck = () => {
            if (mee.words.length > 0) {
                done();
            } else {
                setTimeout(() => {
                    doneCheck();
                }, 100);
            }
        };
        doneCheck();
    });
    it("get word back", function () {
        let id = mee._getIdsFromText(" intergender")[0];
        expect(mee.getWord(id).title).toEqual("Intergender");
    });
});


describe("makeIndex() => ", function () {
    let mee = new Enlighten("en");
    beforeAll((done) => {
        let doneCheck = () => {
            if (mee.words.length > 0) {
                done();
            } else {
                setTimeout(() => {
                    doneCheck();
                }, 100);
            }
        };
        doneCheck();
    });
    it("index has one match for Asexuality", function () {
        expect(mee._makeIndex("asexual").indexOf("Asexual")).toBeGreaterThan(-1);
    });
    it("index has two elements", function () {
        let index = mee._makeIndex("asexual age");
        expect(index.indexOf("Asexual")).toBeGreaterThan(-1);
        expect(index.indexOf("Age")).toBeGreaterThan(-1);
    });
    it("index is complete", function () {
        let index = mee._makeIndex();
        expect(index.indexOf("Asexual")).toBeGreaterThan(-1);
        expect(index.indexOf("Age")).toBeGreaterThan(-1);
        expect(index.indexOf("Gender")).toBeGreaterThan(-1);
    });
});

describe("_makeWordList() => ", function () {
    let mee = new Enlighten("en");
    beforeAll((done) => {
        let doneCheck = () => {
            if (mee.words.length > 0) {
                done();
            } else {
                setTimeout(() => {
                    doneCheck();
                }, 100);
            }
        };
        doneCheck();
    });
    it("explaination for Asexuality: title is there", function () {
        expect(mee._makeWordList("asexual").indexOf(">Asexual</h")).toBeGreaterThan(-1);
    });
    it("explaination for Asexuality: text is there", function () {
        expect(mee._makeWordList(" asexual age ").indexOf("<span>" + mee.words[1].text + "</span>")).toBeGreaterThan(-1);
    });
    it("both age and asexuality are there somewhere", function () {
        let wordlist = mee._makeWordList(" asexual age ");
        expect(wordlist.indexOf(">Asexual</h")).toBeGreaterThan(-1);
        expect(wordlist.indexOf(">Age</h")).toBeGreaterThan(-1);
    });
    it("wordlist is complete", function () {
        let index = mee._makeWordList();
        expect(index.indexOf(">Asexual</h")).toBeGreaterThan(-1);
        expect(index.indexOf(">Age</h")).toBeGreaterThan(-1);
        expect(index.indexOf(">Gender</h")).toBeGreaterThan(-1);
    });
});


describe("parseText() => ", function () {
    let mee = new Enlighten("en");
    beforeAll((done) => {
        let doneCheck = () => {
            if (mee.words.length > 0) {
                done();
            } else {
                setTimeout(() => {
                    doneCheck();
                }, 100);
            }
        };
        doneCheck();
    });
    it("Tag a word", function () {
        let text = "dasdadasda aseXual dadas";
        expect(mee.parseText(text).indexOf(">aseXual</a>")).toBeGreaterThan(-1);
    });
    it("Find two words", function () {
        let text = mee.parseText("dasdadasda aseXual dadas age das");
        expect(text.indexOf(">aseXual</a>")).toBeGreaterThan(-1);
        expect(text.indexOf(">age</a>")).toBeGreaterThan(-1);
    });
    it("Tag multipe occurances of one word", function () {
        let text = "dasdadasda aseXuality aseXual dadas asexual das";
        expect(mee.parseText(text).split("</a>").length).toBe(3);
    });
    it("Don't tag multipe occurances of one word", function () {
        let text = "dasdadasda aseXual dadas asexual das";
        expect(mee.parseText(text, false).split("</a>").length).toBe(2);
    });
    it("Don't tag multipe occurances of one word, alternative matches", function () {
        let text = "ethnicity sex heterosexual";
        expect(mee.parseText(text, false).split("</a>").length).toBe(4);
    });
    it("Allow linking to index", function () {
        let text = "dasdadasda aseXuality dadas asexual das";
        expect(mee.parseText(text, null, "index").indexOf("#ENLIGHT_WORD38")).toBeGreaterThan(-1);
    });
    it("Allow click to custom method", function () {
        let text = "dasdadasda aseXual dadas asexual das";
        expect(mee.parseText(text, null, "customMethod").indexOf("customMethod")).toBeGreaterThan(-1);
    });
    it("dont mess up links", function () {
        let text = "hohoho <a href='dasd'>asexual</a> adada <a href='dasd'><b>asexual</b></a>";
        expect(mee.parseText(text, null, "index").indexOf("ENLIGHT_WORD")).toBe(-1);
    });
    it("keep out of tags!", function () {
        let text = "<b class='asexual'>hello</b>";
        expect(mee.parseText(text, null, "index").indexOf("ENLIGHT_WORD")).toBe(-1);
    });

});

describe("add wordlist to element",
    () => {
        let mee = new Enlighten("en");
        beforeAll((done) => {
            let doneCheck = () => {
                if (mee.words.length > 0) {
                    done();
                } else {
                    setTimeout(() => {
                        doneCheck();
                    }, 100);
                }
            };
            doneCheck();
        });
        beforeEach(function () {
            document.getElementById("target").innerHTML = `
              TARGET
            `;
            document.getElementById("source").innerHTML = `
              aseXuality dadas asexual das dasda age dasdas xaxa
              dasdasasexualityda
            `;
        });
        it("Should replace content with word list", function () {
            mee.insertWordlist(".source", "#target", false);
            expect(document.getElementById("target").innerHTML.indexOf("enlighten-word-explainations")).toBeGreaterThan(-1);
            expect(document.getElementById("target").innerHTML.indexOf("ENLIGHT_WORD38")).toBeGreaterThan(-1);
            expect(document.getElementById("target").innerHTML.indexOf("TARGET")).toBe(-1);
        });
        it("Should add word list but keep content", function () {
            mee.insertWordlist(".source", "#target");
            expect(document.getElementById("target").innerHTML.indexOf("enlighten-word-explainations")).toBeGreaterThan(-1);
            expect(document.getElementById("target").innerHTML.indexOf("ENLIGHT_WORD38")).toBeGreaterThan(-1);
            expect(document.getElementById("target").innerHTML.indexOf("TARGET")).toBeGreaterThan(-1);
        });
        it("Target and source are the same", function () {
            mee.insertWordlist(".source");
            expect(document.getElementById("source").innerHTML.indexOf("enlighten-word-explainations")).toBeGreaterThan(-1);
            expect(document.getElementById("source").innerHTML.indexOf("ENLIGHT_WORD38")).toBeGreaterThan(-1);
        });
        it("All words!", function () {
            mee.insertWordlist("", ".source");
            expect(document.getElementById("source").innerHTML.indexOf("enlighten-word-explainations")).toBeGreaterThan(-1);
            expect(document.getElementById("source").innerHTML.indexOf("ENLIGHT_WORD38")).toBeGreaterThan(-1);
        });
    });


describe("add index to element",
    () => {
        let mee = new Enlighten("en");
        beforeAll((done) => {
            let doneCheck = () => {
                if (mee.words.length > 0) {
                    done();
                } else {
                    setTimeout(() => {
                        doneCheck();
                    }, 100);
                }
            };
            doneCheck();
        });

        beforeEach(function () {
            document.getElementById("target").innerHTML = `
                  TARGET
                `;
            document.getElementById("source").innerHTML = `
                  aseXuality dadas asexual das dasda age dasdas xaxa
                  dasdasasexualityda
                `;
        });
        it("Should replace content with index", function () {
            mee.insertIndex(".source", "#target", false);
            expect(document.getElementById("target").innerHTML.indexOf("enlighten-index")).toBeGreaterThan(-1);
            expect(document.getElementById("target").innerHTML.indexOf("Age</a></li>")).toBeGreaterThan(-1);
            expect(document.getElementById("target").innerHTML.indexOf("TARGET")).toBe(-1);
        });
        it("Should add index but keep content", function () {
            mee.insertIndex(".source", "#target", true);
            expect(document.getElementById("target").innerHTML.indexOf("enlighten-index")).toBeGreaterThan(-1);
            expect(document.getElementById("target").innerHTML.indexOf("Age</a></li>")).toBeGreaterThan(-1);
            expect(document.getElementById("target").innerHTML.indexOf("TARGET")).toBeGreaterThan(-1);
        });
        it("Target and source are the same", function () {
            mee.insertIndex(".source");
            expect(document.getElementById("source").innerHTML.indexOf("enlighten-index")).toBeGreaterThan(-1);
            expect(document.getElementById("source").innerHTML.indexOf("Age</a></li>")).toBeGreaterThan(-1);
        });
        it("Dont't add achors", function () {
            mee.insertIndex(".source", null, null, false);
            expect(document.getElementById("source").innerHTML.indexOf("enlighten-index")).toBeGreaterThan(-1);
            expect(document.getElementById("source").innerHTML.indexOf("<li>Age</li>")).toBeGreaterThan(-1);
        });
        it("Index with all words", function () {
            mee.insertIndex("", "#target", null, false);
            expect(document.getElementById("target").innerHTML.indexOf("enlighten-index")).toBeGreaterThan(-1);
            expect(document.getElementById("target").innerHTML.indexOf("<li>Age</li>")).toBeGreaterThan(-1);
        });

        it("Age is listed before Gender", function () {
            mee.insertIndex("", "#target", null, false);
            let content = document.getElementById("target").innerHTML;
            expect(content.indexOf("<li>Gender</li>")).toBeGreaterThan(content.indexOf("<li>Age</li>"));
        });

    });

describe("parse an element",
    () => {
        let mee = new Enlighten("en");
        beforeAll((done) => {
            let doneCheck = () => {
                if (mee.words.length > 0) {
                    done();
                } else {
                    setTimeout(() => {
                        doneCheck();
                    }, 100);
                }
            };
            doneCheck();
        });
        beforeEach(function () {
            document.getElementById("source").innerHTML = `
                      aseXual dadas asexual das dasda age asexual dasdas xaxa
                      dasdasasexualityda <enlighten data-word="gender">RANDOM</enlighten> <en-ignore>asexual</en-ignore>
                        <b class="asexual">dasdasdas</b>
                    
                    `;
        });
        it("Should parse all words", function () {
            mee.parseElement(".source");
            expect(document.getElementById("source").innerHTML.split("</a>").length).toBe(6);
        });
        it("Should only parse first occurances", function () {
            mee.parseElement(".source", false);
            expect(document.getElementById("source").innerHTML.split("</a>").length).toBe(4);

        });
        it("Should parse with anchors to word list", function () {
            mee.parseElement(".source", null, "index");
            expect(document.getElementById("source").innerHTML.indexOf("#ENLIGHT_WORD")).toBeGreaterThan(-1);
        });

        it("Should parse specified words", function () {
            mee.parseElement(".source", null, "index");
            expect(document.getElementById("source").innerHTML.indexOf("#ENLIGHT_WORD")).toBeGreaterThan(-1);
        });



    });
