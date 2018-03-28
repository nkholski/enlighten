
var en;

document.addEventListener("DOMContentLoaded", function(event) {
    (function() {
        en = new Enlighten();
        document.getElementById("sourceContent").value = document.getElementById("content").innerHTML;

        en.parseElement("#content");
        demo.init();
        
        /*en.parseElement("#source", null, "index");
        en.insertIndex("#source", "#index", false);
        en.insertWordlist("#source", "#wordlist", false);*/
    })();
});


demo = {
    init: function(){
        this.method = 0;
        this.update();

    },
    update: function(method){
        if(!en){
            alert("Waiting for scripts to load...");
            return;
        }
        if(typeof(method) === "number") {
            this.method = method;
            if(method === 2 && ! document.getElementById("toggleWordList").checked){
                document.getElementById("toggleWordList").checked = true;
                demo.update();
                return;
            }
        }

        let html = document.getElementById("sourceContent").value;
        html = html.replace(/\n/g, "</p><p>");
        html = "<p>"+html+"</p>";

        document.getElementById("content").innerHTML = html;

        console.log(method);

        if(document.getElementById("toggleIndex").checked){
            document.getElementById("indexBlock").style.display = "block";
            en.insertIndex("#content",".index", false);

            document.getElementById("toggleWordList").checked = true

        }
        else {
            document.getElementById("indexBlock").style.display = "none";   

        }

        if(document.getElementById("toggleWordList").checked){
            document.getElementById("wordList").style.display = "block";   
            en.insertWordlist("#content","#wordList", false);
        }
        else {
            document.getElementById("wordList").style.display = "none";   

        }


        if(document.getElementById("toggleLink").checked){
            let method = [null, "popup", "index"][this.method];

            en.parseElement("#content",  !document.getElementById("toggleFirst").checked, method);
            document.getElementById("linkTextOptions").style.display = "block";
         

        }
        else {
            document.getElementById("linkTextOptions").style.display = "none";
        }

    }




}

function popup(id, title, content){
    alert("*** "+title+" ***\n"+content);
}