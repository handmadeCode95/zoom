import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cros: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});
instrument(wsServer, {
  auth: false,
});

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countUser(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  socket["nickname"] = "ㅇㅇ";
  wsServer.sockets.emit("room_change", publicRooms());
  socket.onAny((event) => {
    console.log(event);
  });

  socket.on("enter_room", (room, done) => {
    socket.join(room);
    const userCount = countUser(room);
    done(userCount);
    socket.to(room).emit("welcome", socket.nickname, userCount);
    wsServer.sockets.emit("room_change", publicRooms());
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countUser(room) - 1)
    );
  });

  socket.on("disconnect", () =>
    wsServer.sockets.emit("room_change", publicRooms())
  );

  socket.on("message", (msg, room, done) => {
    socket.to(room).emit("message", `${socket.nickname}: ${msg}`);
    done();
  });

  socket.on("nickname", (nickname) => (socket["nickname"] = nickname));

  socket.on("leave", (room) => {
    socket.leave(room);
    socket.to(room).emit("bye", socket.nickname, countUser(room));
    wsServer.sockets.emit("room_change", publicRooms());
  });
});

const handleListen = () => console.log("Listening on http://localhost:3000");
httpServer.listen(3000, handleListen);
