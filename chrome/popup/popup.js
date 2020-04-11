

//POP-UP SCRIPT


const SERVER = "http://192.168.100.108:8080/user/";
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
        let msg = { type: "pdf", data: {pdfUrl: tabUrl}, options: getOptions()};
        let server = SERVER + "sendContent";
        postRequest(server, msg)
          .then((response) => newTabResponse(response))
          .catch((err) => console.error(err));
        //Si es normal trobarem les accions al handler del missatge del front
      } else if (tabClass == "normal") {
        console.log("Finsaq")
        chrome.tabs.sendMessage(tabs[0].id, {
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

    //Retorna opcions seleccionades



    if (e.target.classList.contains("getInfo")) {
      chrome.tabs.query({ active: true, currentWindow: true }) //Get active tab
        .then(getInfo)
        .catch(reportError);
    }
  });
}

function getOptions() {
  var options = {};
  options.size = document.getElementById('size').value;
  options.nUp = document.getElementById('nUp').value;
  return options;
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  console.error(error);
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(`Failed to execute beastify content script: ${error.message}`);
}

//Contestacio del content script
function handleMessage(msg, sender, sendResponse) {

  let server = SERVER + "sendContent";
  let json = { type: "text", data: msg.article, options: getOptions()};
  //Compte que es async:
  postRequest(server, json)
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
      Http.send(data)
    } catch (err) {
      reject(err)
    }
  })
}

function sendPDF() {
}

// Obra una nova tab amb la resposta:
function newTabResponse(url) {
  let createProperties = {
    url: url,
    active: true
  };
  let promise = chrome.tabs.create( //oju que es promise
    createProperties   // object
  )

}

function tabType(tab) {
  tabUrl = tab.url;
  let splited = tabUrl.split(".");
  return splited[splited.length - 1];
}



chrome.tabs.query({ active: true, windowId: chrome.windows.WINDOW_ID_CURRENT }) // Demanar info de la tab
  .then(tabs => chrome.tabs.get(tabs[0].id)) //recordem que then retorna promeses i es poden encadenar
  .then(tab => {
    let type = tabType(tab);
    //Mirem de quin tipus és:
    if (type == "pdf") {
      //sendPdf(tab.url)
      tabClass = "pdf";
      /* postRequest(url, msg).then((response) => { newTabResponse(response) }) */
    }
    //Si no es pdf:
    else {
      tabClass = "normal";
      chrome.tabs.executeScript({ file: "/content_scripts/pliego.js" })
        .then(() => { chrome.tabs.executeScript({ file: "/readability-master/Readability.js" }) })
        .catch(reportExecuteScriptError); //Error "controlat"
    }
  })
  .then(listenForClicks).then(() => chrome.runtime.onMessage.addListener(handleMessage)) //Si no sen envien dos.
  .catch(reportExecuteScriptError); //Error Gros
