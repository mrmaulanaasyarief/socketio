const express = require("express");
const app = express();
const http = require('http');
const { Server } = require('socket.io'); 
const { createServer } = require("http"); 
const server = http.createServer(app); 
const httpServer = createServer(app); 
const io = require('socket.io')(server, {   
    cors: { origin: "*"} });  
    app.get('/', (req, res) => {     
        res.sendFile(__dirname + "/index.html");   
});     
io.on('connection',(socket)=>{     
    console.log('Client connected');   

    socket.on('disconnect',(socket)=>{
        console.log('Client Disconnected');
    }); 

    socket.on('message', (msg) => {
        io.emit('message', msg)
    });

    socket.on('reply', (msg) => {
        io.emit('reply', msg)
    });
})  
server.listen(3000, () => {   
    console.log('Server is running'); 
});