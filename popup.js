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
function doLogin()
{
  console.log("Entrant a doLogin");
  chrome.extension.getBackgroundPage().username = document.querySelector('input#username').value;
  chrome.extension.getBackgroundPage().password = document.querySelector('input#password').value;
  chrome.extension.sendMessage({'doLogin': true})
}

function doLogout()
{
  chrome.extension.getBackgroundPage().password = "";
  chrome.extension.getBackgroundPage().status = 0;
  updatePopup();
}

document.addEventListener('DOMContentLoaded', function () {
  updatePopup();
  document.querySelector('button#login').addEventListener('click', doLogin);
  document.querySelector('input#password').addEventListener('keydown', function(e) {
   if (e.keyCode == 13) {
      console.log("Captura de teclado");
      doLogin();
      return false; // ignore default event
   }
});
  document.querySelector('button#logout').addEventListener('click', doLogout);
});

function updatePopup()
{
  if (chrome.extension.getBackgroundPage().username && chrome.extension.getBackgroundPage().username.length >0) {
      document.querySelector('input#username').value = chrome.extension.getBackgroundPage().username;
  }
  document.querySelector('button#logout').style.display='none';
  console.log("updatePopup Status: " + chrome.extension.getBackgroundPage().status);
  switch (chrome.extension.getBackgroundPage().status) {
    case '200':
      console.log(">> updatePopup Status 200");
      document.querySelector('div#loginForm').style.display='none';
      document.querySelector('button#logout').style.display='block';
      break;

    case '500':
      document.querySelector('div#loginForm').style.display='block';
      document.querySelector('div#loginForm').style.borderColor = "#555";
      break;

    case '401':
      document.querySelector('div#loginForm').style.display='block';
      document.querySelector('input#username').style.backgroundColor = "#f00"; 
      document.querySelector('input#password').style.backgroundColor = "#f00"; 
      break;

    default:
      document.querySelector('div#loginForm').style.display='block';
      document.querySelector('div#loginForm').style.backgroundColor = "#fff";
  }

}
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.updatePopup)
    {
      updatePopup();
    }
      
});
