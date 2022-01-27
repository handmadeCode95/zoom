const socket = io();

const welcome = document.querySelector("#welcome");
const enterForm = welcome.querySelector("#enter");
const nameForm = welcome.querySelector("#name");
const room = document.querySelector("#room");
const leave = document.querySelector("#leave");

let roomName;

room.hidden = true;

function addMessage(message) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
}

function handleMessageSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#msg input");
  const value = input.value;
  socket.emit("message", value, roomName, () => {
    addMessage(`You: ${value}`);
  });
  input.value = "";
}

function handleNicknameSubmit(event) {
  event.preventDefault();
  const input = nameForm.querySelector("input");
  const value = input.value;
  socket.emit("nickname", value);

  const h5 = document.createElement("h5");
  h5.innerText = `Your nickname is ${value}`;
  h5.id = "nickname";
  const currentName = welcome.querySelector("#nickname");
  if (currentName) {
    currentName.remove();
  }
  welcome.prepend(h5);
  input.value = "";
}

function showRoom(userCount) {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${userCount})`;
  const msgForm = room.querySelector("#msg");
  msgForm.addEventListener("submit", handleMessageSubmit);
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = enterForm.querySelector("input");
  socket.emit("enter_room", input.value, showRoom);
  roomName = input.value;
  input.value = "";
}

function handleRoomClick(event) {
  const {
    target: { innerText: value },
  } = event;
  socket.emit("enter_room", value, showRoom);
  roomName = value;
}

function handleLeaveClick() {
  socket.emit("leave", roomName, showRoom);
  welcome.hidden = false;
  room.hidden = true;
  roomName = "";
}

enterForm.addEventListener("submit", handleRoomSubmit);
nameForm.addEventListener("submit", handleNicknameSubmit);
leave.addEventListener("click", handleLeaveClick);

socket.on("welcome", (user, userCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${userCount})`;
  addMessage(`${user} arrived!`);
});

socket.on("bye", (user, userCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${userCount})`;
  addMessage(`${user} left.`);
});

socket.on("message", addMessage);

socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  if (rooms.length === 0) {
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = li.className = room;
    li.addEventListener("click", handleRoomClick);
    roomList.appendChild(li);
  });
});
