var username, password, status=0, logininfo;

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
    pacScript: {
      data: pacdata
    }
  };

  chrome.proxy.settings.set(
      {value: config, scope: 'regular'},
      function() {});

}

function sendLogin(ignorestatus)
{
  if (status==0 && !ignorestatus) {
    resetProxy();
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
        if ('pac' in logininfo)      
          loadPac(logininfo.pac)
        break;
    }
    if (status != this.status) {
      status = this.status;      
      chrome.extension.sendMessage({'updatePopup': true});
    }
  }
}

chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.doLogin) {
      sendLogin(true);
    }
  });

chrome.webRequest.onAuthRequired.addListener(
  function(details) {
    console.log(details);
    if (details.isProxy)
      return {authCredentials: {username: username, password: "foobar"}}
  },
  // filters
  {urls: [
    "http://guifibages.net:8080/"]},
  //Extra
  ["blocking"]
);