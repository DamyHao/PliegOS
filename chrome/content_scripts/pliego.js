
(function () {
    /**
     * Script injectat a la pagina.
     */

    /**
   * Ens assegurem de no tenir mes de una vegada el mateix script corrent
   */
    if (window.hasRun) {
        return;
    }
    //Variable global
    window.hasRun = true;


    function getInfo() {
        //Obtenim tots els paragraphs

        try {
            //Utilitzant la llibreria readeable
            var documentClone = document.cloneNode(true);
            var article = new Readability(documentClone).parse();

            var sending = chrome.runtime.sendMessage({
                article: article
            });
            sending.then(() => { console.log('FET') }).catch((err) => console.error(err));
            //sending
        }
        catch (err) {
            console.error(err)
        }

    }

    //Missatges rebuts del js del popup
    chrome.runtime.onMessage.addListener((message) => {
        console.log(message)
        if (message.command === "getInfo") {
            getInfo();
        }

    });
})();