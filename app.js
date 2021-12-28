const express = require('express');
const { Server } = require('socket.io');
const config = require('./dbconfig')
const app = express();
const sql = require('mssql')


function useradd(req){
    sql.connect(config).then(pool=>{
        let request = new sql.Request(pool)
        request.input('nva_sirketkodu',sql.NVarChar(30),req.sirketkodu)
        request.input('nva_sicilkodu',sql.NVarChar(30),req.sicilkodu)
        request.input('nva_sicilismi',sql.NVarChar(sql.MAX),req.sicilismi)
        request.execute('sp_noe_m_w_mrp_hareket_giriscikis_ekle').then((result)=>{
            return result
        }).catch(e=>{
            console.log(e)
        })
    })
}
// var mysql      = require('mysql');

// var connection = mysql.createConnection({
//     host     : 'localhost',
//     user     : 'root',
//     password : 'password',
//     database : 'deneme',
//     port: 3306,
//     insecureAuth : true
//   });


// connection.connect();
 
// connection.query('SELECT * from kullanıcılar', function (error, results, fields) {
//   if (error) throw error;
//   console.log('The solution is: ', results[0]);
// });

const sunucu = app.listen(9000, () => {
    console.log('server çalışıyor');
})


const io = new Server(sunucu);


io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('userAdd', (data) => {
        io.emit('message', data)
        var datass = JSON.parse(data)
        useradd(datass)
        console.log(datass);
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






