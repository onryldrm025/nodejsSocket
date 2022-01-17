const express = require('express');
const { Server } = require('socket.io');
const config = require('./dbconfig')
var bodyParser = require('body-parser')
var cors = require('cors')
const app = express();

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const sql = require('mssql')

function useradd(req){
     sql.connect(config).then(pool=>{
        let request = new sql.Request(pool)
        request.input('nva_sirketkodu',sql.NVarChar(30),req.sirketkodu)
        request.input('nva_sicilkodu',sql.NVarChar(30),req.sicilkodu)
        request.input('nva_sicilismi',sql.NVarChar(sql.MAX),req.sicilismi)
        request.input('tarih',sql.DateTime,(req.tarih || req.zaman ))
        request.input('onofflie',sql.Bit,(req.onoff || 0))
        request.input('hes',sql.NVarChar(150),'X')
        request.input('tablet',sql.NVarChar(50),req.tablet)
        request.input('giriscikis',sql.NVarChar(1),req.giriscikis)
        request.execute('sp_noe_m_w_mrp_hareket_giriscikis_ekle').then((result)=>{
            return result
        }).catch(e=>{
            console.log('Eroro:' + e)
        })
    })
}

function allAdd(req,tblt){
    return new Promise((resolve,reject)=>{
        sql.connect(config).then(pool=>{
            let request = new sql.Request(pool)
            request.input('nva_sirketkodu',sql.NVarChar(30),req.sirketkodu)
            request.input('nva_sicilkodu',sql.NVarChar(30),req.sicilkodu)
            request.input('nva_sicilismi',sql.NVarChar(sql.MAX),req.sicilismi)
            request.input('tarih',sql.NVarChar(30),req.zaman.slice(0,-3))
            request.input('onofflie',sql.Bit,(req.onoff || 1))
            request.input('tablet',sql.NVarChar(50),tblt)
            request.input('giriscikis',sql.NVarChar(1),req.giriscikis)
            request.execute('sp_noe_m_w_mrp_hareket_giriscikis_ekle').then((result)=>{
                resolve({data:req ,status:true})
            }).catch(e=>{
                reject( {data:req ,status:false})
            })
        })

    })
}


app.post('/saveusers',(req,res)=>{
     var ss = req.body.arr.map((item)=> allAdd(item,
        req.body.tablet))
     Promise.all(ss).then((data)=>{
        res.json({status:true,data})
     }).catch((e)=>{
        res.json({status:false,e})
    })
   
})

const sunucu = app.listen(9000, () => {
    console.log('server çalışıyor');
})


const io = new Server(sunucu);


io.on('connection', (socket) => {
    console.log('a user connected : ' + socket.id);
    socket.on('userAdd', (data) => {
        io.emit('message', JSON.stringify(data))
        // var datass = JSON.parse(data)
        useradd(data)
        console.log(data);
    })
    socket.on('msg', (data) => {
        console.log(data)
    })
    socket.on('sayHello',(data)=>{
        console.log(data)
    })
    socket.on('disconnect',(data)=>{
        console.log('Kullnıcı çıktı : ' + socket.id)
    })
});

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




