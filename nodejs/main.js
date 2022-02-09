// Importing the required modules
const WebSocketServer = require("ws");
const { spawn } = require("child_process");

// Creating a new websocket server
const wss = new WebSocketServer.Server({ port: 8080 });

// Creating connection using websocket
wss.on("connection", (ws) => {
  console.log("new client connected. Creating Zork process for this client...");

  // Spin up a new Zork process and connect it to the Websocket
  const zorkProc = spawn("zork");

  // Get our hooks into the Zork Process and attach it to websocket
  zorkProc.stdout.on("data", (data) => {
    console.log(`[zorkProc.stdout] ${data}`);
    ws.send(data);
  });
  zorkProc.stderr.on("data", (data) => {
    console.error(`[zorkProc.stderr] ${data}`);
  });
  zorkProc.on("error", (error) => {
    console.error(`[zorkProc.error] ${error.message}`);
  });

  zorkProc.on("close", (code) => {
    console.log(`zorkProc.close] exitcode: ${code}`);
  });

  // Connect websocket to Zork proc stdin
  console.log("Attaching websocket to zork stdin");
  ws.on("message", (data) => {
    console.log(`[ws.message] ${data}`);
    zorkProc.send(data + "\n");
  });

  // handling what to do when clients disconnects from server
  ws.on("close", () => {
    console.log("[ws.close]");
    // Shutdown the zork process
    zorkProc.kill();
  });
  // handling client connection error
  ws.onerror = function () {
    console.log("Some Error occurred");
  };
});

console.log("The WebSocket server is running on port 8080");
