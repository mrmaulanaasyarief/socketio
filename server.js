const express = require("express");
const app = express();
const http = require('http');
const { Server } = require('socket.io'); 
const { createServer } = require("http"); 
const server = http.createServer(app); 
const httpServer = createServer(app); 
const Pusher = require("pusher");
const axios = require('axios');
const {SerialPort} = require('serialport');
const {ReadlineParser} = require('@serialport/parser-readline');
const { autoDetect } = require('@serialport/bindings-cpp')

let serialPorts = []
let portStatus = false
SerialPort.list().then(function(ports) {
    // Open a serial port for each available port
    ports.forEach(function(port) {
        const serialPort = new SerialPort({ path: port.path,  baudRate: 9600, autoOpen: false })

        serialPorts.push(serialPort)

      // // Listen for data on the port
      // serialPort.on('data', function(data) {
      //   console.log('Data from port', port.path, ':', data.toString());
      // });
        });
});

app.get('/get', async (req, res) => {
    const ports = await SerialPort.list()
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Content-Type", "application/json")
    res.json(
    {
        ok: true,
        ports: ports.map((val, i) => {
        return {
            path: val.path,
            isOpen: false
        }
        })
    }
    )
    res.end()
})

app.post('/open', (req, res) => {
    console.log(req.body.port);

    const portIndex = serialPorts.findIndex(p => p.path === req.body.port);
    console.log(portIndex);

    if (portIndex === -1) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(400)
    res.send({
        error: {
        message: "Port Tidak ditemukan"
        }
    });
    return console.log('Error opening port: ', "Port tidak ditemukan")
    }

    const port = serialPorts[portIndex]

    if (port.isOpen) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(400)
    res.send({
        error: {
        message: "Port already open"
        }
    });
    return console.log('Error opening port: ', "Port already open")
    }
    port.open((err) => {
        console.log('Port open');
        let errMessage = null
        if (err) {
            console.log(err);
            res.status(500)
            res.send({
            error: {
                message: err.message
            }
            });
            return console.log('Error opening port: ', err.message)
        }
        res.json({status: 'ok'})
        res.end()
    })

        // port listening
        const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
        parser.on('data', data =>{
        console.log('got word from arduino:');
      // const val = JSON.parse(data)

      // const contoh = "-6.967658000,107.658933667,734.30,1.57,284.07,119.80,11.80,1494.00,0,Siap,-244,1328,-14776,-115,213,260,*"

        let [tPayload, lat, long, alt, sog, cog, arus, tegangan, daya, klasifikasi, ax, ay, az, gx, gy, gz, mx, my, mz, roll, pitch, yaw, suhu, humidity] = data.split(",")
        console.log(tPayload, lat, long, alt, sog, cog, arus, tegangan, daya, klasifikasi, ax, ay, az, gx, gy, gz, mx, my, mz, roll, pitch, yaw, suhu, humidity)
        axios.post('http://laravel-socketio.test/api/telemetri_logs', {
            tPayload : tPayload,
            lat : lat,
            long : long,
            alt : alt,
            sog : sog,
            cog : cog,
            arus : arus,
            tegangan : tegangan,
            daya : daya,
            klasifikasi : klasifikasi,
            ax : ax,
            ay : ay,
            az : az,
            gx : gx,
            gy : gy,
            gz : gz,
            mx : mx,
            my : my,
            mz : mz,
            roll : roll,
            pitch : pitch,
            yaw : yaw,
            suhu : suhu,
            humidity : humidity
        })
    });
})

app.post('/close', (req, res) => {
    console.log(req.body);
    res.setHeader('Access-Control-Allow-Origin', '*');

    const portIndex = serialPorts.findIndex(p => p.path === req.body.port);

    if (portIndex === -1) {
    res.status(400)
    res.send({
        error: {
        message: "Port Tidak ditemukan"
        }
    });
    return console.log('Error opening port: ', "Port tidak ditemukan")
    }

    const port = serialPorts[portIndex]

    if (!port.isOpen) {
    res.status(400)
    res.send({
        error: {
        message: "Port already close"
        }
    });
    return console.log('Error opening port: ', "Port already close")
    }

    port.close((err) => {
        portStatus = false;
        if (err) {
            console.log(err);
            res.status(500)
            res.send({
                error: {
                    message: err.message
                }
            });
        return console.log('Error opening port: ', err.message)
    }

    console.log('Port close');
    console.log(err);
        res.json({status: 'ok'})
        res.end()
    })
})

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
    res.sendFile(__dirname + "/views/index.html"); 
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
        var flight_code_id = null;
        axios.get('http://laravel-socketio.test/api/telemetri_logs/selected')
            .then(function (response) {
                // handle success
                console.log(response.data.id);
                flight_code_id = response.data.id;
            });

        let [tPayload, lat, long, alt, sog, cog, arus, tegangan, daya, klasifikasi, ax, ay, az, gx, gy, gz, mx, my, mz, roll, pitch, yaw, suhu, humidity] = msg.split(",")
        console.log(tPayload.replace(/;/g, ':'), lat, long, alt, sog, cog, arus, tegangan, daya, klasifikasi, ax, ay, az, gx, gy, gz, mx, my, mz, roll, pitch, yaw, suhu, humidity)
        axios.post('http://laravel-socketio.test/api/telemetri_logs', {
            tPayload : tPayload.replace(/;/g, ':'),
            flight_code_id: flight_code_id,
            lat : lat,
            long : long,
            alt : alt,
            sog : sog,
            cog : cog,
            arus : arus,
            tegangan : tegangan,
            daya : daya,
            klasifikasi : klasifikasi,
            ax : ax,
            ay : ay,
            az : az,
            gx : gx,
            gy : gy,
            gz : gz,
            mx : mx,
            my : my,
            mz : mz,
            roll : roll,
            pitch : pitch,
            yaw : yaw,
            suhu : suhu,
            humidity : humidity
        });
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