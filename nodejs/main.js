// Importing the required modules
const WebSocketServer = require("ws");
const { spawn } = require("child_process");

// Creating a new websocket server
const wss = new WebSocketServer.Server({ port: 8080 });
const path = require("path");

wss.on("connection", (ws) => {
  console.log("new client connected. Creating Zork process for this client...");

  // Spin up a new Zork process and connect it to the Websocket
  // *** NOTE *** Requires the zork_source repo side-by-side with the zork-server repo
  const zorkProc = spawn(
    path.join(process.env.PWD, "..", "..", "zork_source", "zork")
  );

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

  // Connect zork (stdin) to RCV side of the  websocket
  console.log("Attaching websocket to zork stdin");
  ws.on("message", (data) => {
    let msg = JSON.parse(data);
    console.log(
      `[ws.message] messageType=${msg.messageType}, value:${msg.value}`
    );
    zorkProc.stdin.write(msg.value + "\n");
  });

  // handling what to do when clients disconnects from server
  ws.on("close", () => {
    console.log("[ws.close]");
    // Shutdown the zork process
    zorkProc.kill();
  });
  // handling client connection error
  ws.onerror = function (event) {
    console.log("[ws.onError] Some Error occurred:", event);
  };
});

console.log("The WebSocket server is running on port 8080");
