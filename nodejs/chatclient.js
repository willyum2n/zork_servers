"use strict";
var connection = null;
var clientID = 0;

// function setUsername() {
//   console.log("***SETUSERNAME");
//   var msg = {
//     name: document.getElementById("name").value,
//     date: Date.now(),
//     id: clientID,
//     type: "username",
//   };
//   connection.send(JSON.stringify(msg));
// }

function connect() {
  var serverUrl;
  var scheme = "ws";

  // If this is an HTTPS connection, we have to use a secure WebSocket
  // connection too, so add another "s" to the scheme.

  if (document.location.protocol === "https:") {
    scheme += "s";
  }

  serverUrl = "ws://vork.willpowerware.io:6910";

  alert("Connecting to: " + serverUrl);
  connection = new WebSocket(serverUrl, "json");
  console.log("***CREATED WEBSOCKET");

  connection.onopen = function (evt) {
    console.log("***ONOPEN");
    document.getElementById("text").disabled = false;
    document.getElementById("send").disabled = false;
  };
  console.log("***CREATED ONOPEN");

  connection.onmessage = function (evt) {
    console.log("***ONMESSAGE");
    var f = document.getElementById("chatbox").contentDocument;
    var text = "";
    var msg = JSON.parse(evt.data);
    console.log("Message received: " + evt.data);

    if (evt.data.length) {
      f.write(msg.value + "<br />");
    }
  };
  console.log("***CREATED ONMESSAGE");
}

function send() {
  // console.log("***SEND");
  // connection.send(document.getElementById("text").value);
  // document.getElementById("text").value = "";
  var msg = {
    messageType: "game",
    value: document.getElementById("text").value,
  };
  connection.send(JSON.stringify(msg));
  document.getElementById("text").value = "";
}

function handleKey(evt) {
  if (evt.keyCode === 13 || evt.keyCode === 14) {
    if (!document.getElementById("send").disabled) {
      send();
    }
  }
}
