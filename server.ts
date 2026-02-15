import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import type { ServerToClientEvents, ClientToServerEvents } from "./lib/types";
import { handleSocketConnection } from "./lib/socket-handler";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Get local IP for mobile access
function getLocalIP(): string {
  const { networkInterfaces } = require("os");
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

// Run database migrations before starting (needed for Railway where /tmp is used)
async function setupDatabase() {
  const { execSync } = require("child_process");
  try {
    console.log("Running database migrations...");
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    console.log("Database ready.");
  } catch (err) {
    console.error("Migration failed, trying to push schema directly...");
    execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
    console.log("Database ready (via db push).");
  }
}

setupDatabase().then(() => app.prepare()).then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: dev ? "*" : false,
    },
  });

  io.on("connection", (socket) => {
    handleSocketConnection(io, socket);
  });

  server
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      const localIP = getLocalIP();
      console.log(`> Ready on http://localhost:${port}`);
      console.log(`> Mobile/LAN: http://${localIP}:${port}`);
    });
});
