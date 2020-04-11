

//POP-UP SCRIPT


const SERVER = "http://www.pliegos.net/maker/addon_pdf/aveurecarregamanual.php";
var tabClass = "";
var tabUrl = "";
/**
 * Listen for clicks on the buttons DE LA EXTENSIO, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
  document.addEventListener("click", (e) => { //e = Element al que cliquem

    function getInfo(tabs) {
      if (tabClass == "pdf") {
        let msg = { type: "pdf", data: { pdfUrl: tabUrl }, options: getOptions() };
        postRequest(SERVER, msg)
          .then((response) => newTabResponse(response))
          .catch((err) => console.error(err));
        //Si es normal trobarem les accions al handler del missatge del front
      } else if (tabClass == "normal") {
        console.log("Finsaq")
        browser.tabs.sendMessage(tabs[0].id, {
          command: "getInfo"
        });
      }
    }


    /**
     * Just log the error to the console.
     */
    function reportError(error) {
      console.error(`Could not beastify: ${error}`);
    }

    if (e.target.classList.contains("getInfo")) {
      browser.tabs.query({ active: true, currentWindow: true }) //Get active tab
        .then(getInfo)
        .catch(reportError);
    }
  });
}

//Retorna opcions seleccionades
function getOptions() {
  var options = {};
  options.size = document.getElementById('size').value;
  options.nUp = document.getElementById('nUp').value;
  return options;
}

//Reportem arror greu
function reportExecuteScriptError(error) {
  console.error(error);
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(`Failed to inject pligos content script: ${error.message}`);
}

function mostrar(aMostrarID) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector(aMostrarID).classList.remove("hidden");
}


//Contestacio del content script
function handleMessage(msg, sender, sendResponse) {

  let json = { type: "text", data: msg.article, options: getOptions() };
  console.log(msg.article.textContent)
  //Compte que es async:
  postRequest(SERVER, json)
    .then((response) => newTabResponse(response))
    .catch((err) => console.error(err));
  //sendResponse({ response: "Response from background script" }); i definir sendResponse
}

//Podriem fer una funcio i a dintre una promise. Treballarem amb el classic async await.
// Esperem que ens torni la url
function postRequest(url, msg) {
  return new Promise(function (resolve, reject) {
    try {
      let Http = new XMLHttpRequest();
      Http.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          console.log(Http.responseText)
          // Typical action to be performed when the document is ready:
          //resolve(Http.responseText);
          resolve("http://www.pliegos.net/maker/pliegOmaker.php?vp=true&nup=8&hv=true&full=4&r=false&lab=0");
        }
      };
      Http.open("POST", url, true);
      Http.setRequestHeader("Content-type", "application/json");
      var data = JSON.stringify(msg);
      Http.send(data);
      console.log("Enviada postRequest");
    } catch (err) {
      console.error("ERROR EN LA REQUEST")
      reject(err)
    }
  })
}



// Obra una nova tab amb la resposta:
function newTabResponse(url) {
  let createProperties = {
    url: url,
    active: true
  };
  let promise = browser.tabs.create( //oju que es promise
    createProperties   // object
  )

}

//Retorna el tipus de tab a partir de la variable guardad globalment
function tabType(tab) {
  let splited = tabUrl.split(".");
  islocal = tabUrl.split(":");
  if (islocal[0] == "file") {
    return "localFile";
  } else if (splited[splited.length - 1] == "pdf"){
    return "pdf";
  } else{
    return "text";
  }
}


browser.tabs.query({ active: true, windowId: browser.windows.WINDOW_ID_CURRENT }) // Demanar info de la tab
  .then(tabs => browser.tabs.get(tabs[0].id)) //recordem que then retorna promeses i es poden encadenar
  .then(tab => {
    tabUrl = tab.url;
    let type = tabType(tab);
    console.log(type)
    //Mirem de quin tipus és:
    if(type == "localFile") {
      console.log("OKK")
      mostrar("#localFile");
    }
    else if (type == "pdf") {
      //sendPdf(tab.url)
      tabClass = "pdf";
      /* postRequest(url, msg).then((response) => { newTabResponse(response) }) */
    }
    //Si no es pdf:
    else if (type == "text") {
      tabClass = "normal";
      browser.tabs.executeScript({ file: "/content_scripts/pliego.js" })
        .then(() => { browser.tabs.executeScript({ file: "/readability-master/Readability.js" }) })
        .catch(reportExecuteScriptError); //Error "controlat"
    }
  })
  .then(listenForClicks).then(() => browser.runtime.onMessage.addListener(handleMessage)) //Si no sen envien dos.
  .catch(reportExecuteScriptError); //Error Gros
