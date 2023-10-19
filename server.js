const express = require("express");
const app = express();
const http = require('http');
const { Server } = require('socket.io'); 
const { createServer } = require("http"); 
const server = http.createServer(app); 
const httpServer = createServer(app); 
const Pusher = require("pusher");

const pusher = new Pusher({
    appId: '1690322',
    key: '54276e277a7264e5bb57',
    secret: 'b56c89f88e7a42ef76e8',
    useTLS: 'https',
    cluster: 'ap1', // if `host` is present, it will override the `cluster` option.
    host: '', // optional, defaults to api.pusherapp.com
    port: '443', // optional, defaults to 80 for non-TLS connections and 443 for TLS connections
});

// inisialisasi socket.io
const io = require('socket.io')(server, {   
    cors: { origin: "*"} 
});  

// halaman awal server yang berisikan form untuk mengirim pesan
app.get('/', (req, res) => {     
    pusher.trigger("messages", "MessageCreated", { message: "hello world of liarszz" })  
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