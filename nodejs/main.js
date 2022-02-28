// Importing the required modules
const WebSocketServer = require("ws");
const { spawn } = require("child_process");

// Creating a new websocket server
const wss = new WebSocketServer.Server({ port: 8080 });
const path = require("path");

const MSGTYPE_ADMIN = "admin";
const MSGTYPE_CONFIG = "config";
const MSGTYPE_GAME = "game";

wss.on("connection", (ws) => {
  console.log("[wss.on #connection] new client connected. Challenging...");
  // Send a challenge message to the client
  let clientConfirmed = false;
  let msg = {
    messageType: "admin",
    value: "how about a nice game of chess?",
  };
  ws.send(JSON.stringify(msg));
  let zorkProc;

  // Message Handling
  console.log("[wss.on #connection] Attaching websocket to zork stdin");
  ws.on("message", (data) => {
    let msg = JSON.parse(data);
    console.log(
      `[ws.message] messageType=${msg.messageType}, value:${msg.value}`
    );

    if (clientConfirmed) {
      switch (msg.messageType) {
        case MSGTYPE_ADMIN:
          break;
        case MSGTYPE_CONFIG:
          break;
        case MSGTYPE_GAME:
          zorkProc.stdin.write(msg.value + "\n");
          break;
      }
    } else {
      console.log(
        `[ws.on #message] Client not confirmed: Msg from Client: type=${msg.messageType}, value=${msg.value}`
      );
      // We expect the client to send a response to our challenge
      if (
        msg.messageType == MSGTYPE_ADMIN &&
        msg.value == "No. I want to play zork!"
      ) {
        // This is a zork client. Let them play
        clientConfirmed = true;

        // Spin up a new Zork process and connect it to the Websocket
        console.log(
          "[ws.on #message] Creating Zork process for this client..."
        );
        zorkProc = spawn(path.join(process.env.PWD, "zork"));

        // Connect zork (stdout) to XMT side of the websock
        zorkProc.stdout.on("data", (data) => {
          console.log(`[zorkProc.stdout] ${data}`);
          let msg = {
            messageType: "game",
            // Clean up the data coming from the zork process. We are going to reading this with TTS
            value: data
              .toString()
              .replace(/\r?\n|\r?\t/g, " ")
              .slice(0, -1),
          };
          ws.send(JSON.stringify(msg));
        });

        zorkProc.stderr.on("data", (data) => {
          console.error(`[zorkProc.stderr] ${data}`);
        });

        zorkProc.on("error", (error) => {
          console.error(`[zorkProc.error] ${error.message}`);
        });

        zorkProc.on("close", (code) => {
          console.log(`[zorkProc.close] exitcode: ${code}`);
        });
      } else {
        // This is not a zork client. Cut them off.
        ws.close();
        return;
      }
    }
  });

  // handling what to do when clients disconnects from server
  ws.on("close", () => {
    console.log("[ws.close]");
    // Shutdown the zork process
    if (zorkProc) {
      zorkProc.kill();
    }
  });
  // handling client connection error
  ws.onerror = function (event) {
    console.log("[ws.onError] Some Error occurred:", event);
  };
});

console.log("[main] The WebSocket server is running on port 8080");
