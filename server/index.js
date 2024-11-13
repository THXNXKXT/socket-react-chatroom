const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});

let roomMessages = {};

io.on('connection', (socket) => {
    console.log('User Connected:', socket.id);

    socket.on('join_room', (roomName) => {
        socket.join(roomName);
        console.log(`User ${socket.id} joined room: ${roomName}`);

        if (roomMessages[roomName]) {
            socket.emit('previous_messages', roomMessages[roomName]);
        } else {
            socket.emit('previous_messages', []);
        }
    });

    socket.on('send_message', (data) => {
        const { roomName, message, senderId } = data;

        const timestamp = new Date().toISOString();

        const messageData = { message, timestamp, senderId };

        if (!roomMessages[roomName]) {
            roomMessages[roomName] = [];
        }
        roomMessages[roomName].push(messageData);

        io.to(roomName).emit('receive_message', messageData);
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected:', socket.id);
    });
});

server.listen(3001, () => {
    console.log('Server is running on http://localhost:3001');
});
