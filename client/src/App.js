import { useEffect, useState } from "react";
import "./App.css";
import io from "socket.io-client";

const socket = io.connect("http://localhost:3001");

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState("");
  const [roomName, setRoomName] = useState("");
  const [socketId, setSocketId] = useState("");

  useEffect(() => {
    socket.on("connect", () => {
      setSocketId(socket.id);
    });

    return () => {
      socket.off("connect");
    };
  }, []);

  const joinRoom = () => {
    if (roomName.trim() !== "") {
      setRoom(roomName);
      socket.emit("join_room", roomName);
      setMessages([]);
      setRoomName("");
    }
  };

  const sendMessage = () => {
    if (message.trim() !== "") {
      const messageData = {
        roomName: room,
        message,
        timestamp: new Date().toISOString(),
        senderId: socketId,
      };

      setMessages((prevMessages) => [
        ...prevMessages,
        { ...messageData, senderId: socketId },
      ]);

      socket.emit("send_message", messageData);

      setMessage("");
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const timeDiff = now - new Date(timestamp);

    const minutes = Math.floor(timeDiff / 60000);
    const hours = Math.floor(timeDiff / 3600000);
    const days = Math.floor(timeDiff / 86400000);

    if (minutes < 60) {
      return `${minutes} min ago`;
    } else if (hours < 24) {
      return `${hours} hours ago`;
    } else if (days < 1) {
      return "today " + new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  useEffect(() => {
    const handleReceiveMessage = (data) => {
      if (data.senderId !== socketId) {
        setMessages((prevMessages) => [...prevMessages, data]);
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socketId]);

  return (
    <div className="App">
      <h1>Socket.io Room Chat</h1>

      <div>
        <input
          type="text"
          placeholder="Enter room name..."
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <button onClick={joinRoom}>Join Room</button>
      </div>

      {room && <h2>You're in room: {room}</h2>}

      {room && (
        <div className="message-input-container">
          <input
            type="text"
            placeholder="Enter your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="message-input"
          />
          <button onClick={sendMessage} className="send-message">Send</button>
        </div>
      )}

      <div className="message-container">
        <h3>Messages:</h3>
        {messages.length > 0 ? (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.senderId === socketId ? "message-self" : "message-other"}`}
            >
              <p>{msg.message}</p>
              <span>{formatTime(msg.timestamp)}</span>
            </div>
          ))
        ) : (
          <p className="no-messages">No messages yet...</p>
        )}
      </div>
    </div>
  );
}

export default App;
