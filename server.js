const express = require("express");
const app = express();
const http = require('http');
const { Server } = require('socket.io'); 
const { createServer } = require("http"); 
const server = http.createServer(app); 
const httpServer = createServer(app); 

// inisialisasi socket.io
const io = require('socket.io')(server, {   
    cors: { origin: "*"} 
});  

// halaman awal server yang berisikan form untuk mengirim pesan
app.get('/', (req, res) => {     
    res.sendFile(__dirname + "/index.html");   
});

// koneksi ke socket.io
io.on('connection',(socket)=>{     
    console.log('Client connected');   

    // log ketika koneksi terputus
    socket.on('disconnect',(socket)=>{
        console.log('Client Disconnected');
    }); 

    // mengirim pesan dengan emit 'message'
    socket.on('message', (msg) => {
        io.emit('message', msg)
    });

    // mengirim pesan dengan emit 'reply'
    socket.on('reply', (msg) => {
        io.emit('reply', msg)
    });
})  

// menjalankan server
server.listen(3000, () => {   
    console.log('Server is running'); 
});