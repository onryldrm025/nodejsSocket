const express = require('express');
const { Server } = require('socket.io');
const app = express();
var mysql      = require('mysql');

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'password',
    database : 'deneme',
    port: 3306,
    insecureAuth : true
  });


connection.connect();
 
connection.query('SELECT * from kullanıcılar', function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0]);
});

const sunucu = app.listen(9000, () => {
    console.log('server çalışıyor');
})

app.get('/hi', (req, res) => {
    res.json('hi');
})

const io = new Server(sunucu);


io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('userAdd', (data) => {
        io.emit('message', data)
        var datass = JSON.parse(data)
        connection.query(`insert into kullanıcılar(name) values('${datass.isim}')`)
        console.log(data);
    })
    socket.on('msg', (data) => {
        console.log(data)
    })
    socket.on('sayHello',(data)=>{
        console.log(data)
    })
    socket.on('disconnect',(data)=>{
        console.log('Kullnıcı çıktı')
    })
});






