
(function () {

    //Ens assegurem de que el script no estigui corrent ja.
    if (window.hasRun) {
        return;
    }
    //Variable global
    window.hasRun = true;

    function getInfo() {

        try {
            //Utilitzant la llibreria readeable
            var documentClone = document.cloneNode(true);
            var article = new Readability(documentClone).parse();

            //Eliminem innecessari:
            delete article.content
            var sending = browser.runtime.sendMessage({
                article: article
            });
            //sending.then(() => { console.log('FET') }).catch((err) => console.error(err));
            //sending
        }
        catch (err) {
            console.error(err)
        }
    }

    //Missatges rebuts del js del popup
    browser.runtime.onMessage.addListener((message) => {
        console.log(message)
        if (message.command === "getInfo") {
            getInfo();
        }

    });
})();