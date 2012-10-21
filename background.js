// Guifibages Chrome Extension
//
// Copyright 2012 Associació d'Usuaris Guifibages
// Author: Ignacio Torres Masdeu <ignacio@xin.cat>
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var username, password, status=0, logininfo = {};

function loadPac(pacdata)
{
  var config = {
    mode: "pac_script",
    pacScript: {
      data: pacdata
    }
  };

  chrome.proxy.settings.set(
      {value: config, scope: 'regular'},
      function() {});
}

function resetProxy()
{
  var config = {
    mode: "direct",
  };

  chrome.proxy.settings.set(
      {value: config, scope: 'regular'},
      function() {});
  handleProxyAuth(false);
}

function sendLogin(ignorestatus)
{
  if (status!=200) {
    resetProxy();
  }
  if (status==0  && !ignorestatus) {
    return;
  }


  console.log("sendLogin");
  if (password.length == 0) {
    status = 401;
    chrome.extension.sendMessage({'updatePopup': true});
    return;
  }
  xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://guifibages.net/api/login');
  xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
  xhr.send("username=" + username + "&" + "password=" + password);
  xhr.onreadystatechange=function()
  {
    if (this.readyState != this.DONE)
      return;
    switch (this.status) {
      case 200:
        window.setTimeout(sendLogin,10000);
        logininfo = JSON.parse(this.responseText);
        if ('pac' in logininfo) {
          loadPac(logininfo.pac);
          handleProxyAuth();
        }     
        break;
    }
    if (status != this.status) {
      status = this.status;      
      chrome.extension.sendMessage({'updatePopup': true});
    }
  }
}


/*
 * Beginning of Proxy Auth Handling
 */
function handleProxyAuth(unregister) {
  if (unregister === false) {
    chrome.webRequest.onAuthRequired.removeListener(
      handleAuthRequest,
      {urls: ["<all_urls>"]},
      ["asyncBlocking"]
    );
  }
  var gPendingCallbacks = [];

  function processPendingCallbacks() {
    console.log("Calling back with credentials");
    var callback = gPendingCallbacks.pop();
    if (callback) {
      console.log(["Authenticating to proxy", {username: username,
      password: logininfo.otp}]);
      callback({authCredentials: {username: username,
      password: logininfo.otp}});

    }
  }
  function handleAuthRequest(details, callback) {
    console.log(['handleAuthRequest',details]);
    /*
     * Només afegim la petició a la cua (gPendingCallbacks) si es cumpleixen tres factors:
     *  1) La autenticació és per un proxi
     *  2) El hostname que demana l'autenticació conté el nostre domini
     *  3) Tenim un valor otp
     */
    if (details.isProxy &&
        details.challenger.host.indexOf("guifibages.net") >=0 &&
        'otp' in logininfo) {
      gPendingCallbacks.push(callback);
    }
    processPendingCallbacks();
  }



  chrome.webRequest.onAuthRequired.addListener(
    handleAuthRequest,
    {urls: ["<all_urls>"]},
    ["asyncBlocking"]
  );
}

// End of proxy auth handling

chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.doLogin) {
      sendLogin(true);
    }
  });
