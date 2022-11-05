const express = require('express');
const { Server } = require('socket.io');
const config = require('./dbconfig')
var bodyParser = require('body-parser')
var cors = require('cors')
const app = express();
var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://mqtt.bconimg.com');
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const sql = require('mssql')


// var mysql = require('mysql');

// var connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'password',
//     database: 'deneme',
//     port: 3306,
//     insecureAuth: true
// });


async function addUserAnten(req){

    let pool = await sql.connect(config)
    let result1 = await pool.request()
        .input('input_parameter', sql.NVarChar(30), req.sicilkodu)
        .input('input_parameter2', sql.NVarChar(30), req.giriscikis == 'G' ? 1 : 2)
        .query(`select * from noe_pdks_bt_cihazlistesi where (int_k_id = '3' or int_k_id = '1' or int_k_id = '2') and nva_cihaz_id = @input_parameter2 and nva_user_id = @input_parameter `)
    
    
    return result1.recordset.length ?? 0
    
}  

async function useradd(req){

   let res =  await addUserAnten(req)
    console.log(res);
    sql.connect(config).then(pool => {
        let request = new sql.Request(pool)
        request.input('nva_sirketkodu', sql.NVarChar(30), req.sirketkodu)
        request.input('nva_sicilkodu', sql.NVarChar(30), req.sicilkodu)
        request.input('nva_sicilismi', sql.NVarChar(sql.MAX), req.sicilismi)
        request.input('tarih', sql.DateTime, (req.tarih || req.zaman))
        request.input('onofflie', sql.Bit, (req.onoff || 0))
        request.input('hes', sql.NVarChar(150), 'X')
        request.input('tablet', sql.NVarChar(50), req.tablet)
        request.input('giriscikis', sql.NVarChar(1), req.giriscikis)
        request.input('giris_durum', sql.NVarChar(30), res >= 1 ? 'Onaylı' : 'Supheli')
        request.execute('sp_noe_m_w_mrp_hareket_giriscikis_ekle').then((result) => {
            return result
        }).catch(e => {
            console.log('Eroro:' + e)
        })
    })
}

function allAdd(req, tblt) {
    return new Promise((resolve, reject) => {
        sql.connect(config).then(pool => {
            let request = new sql.Request(pool)
            request.input('nva_sirketkodu', sql.NVarChar(30), req.sirketkodu)
            request.input('nva_sicilkodu', sql.NVarChar(30), req.sicilkodu)
            request.input('nva_sicilismi', sql.NVarChar(sql.MAX), req.sicilismi)
            request.input('tarih', sql.NVarChar(30), req.zaman.slice(0, -3))
            request.input('onofflie', sql.Bit, (req.onoff || 1))
            request.input('tablet', sql.NVarChar(50), tblt)
            request.input('giriscikis', sql.NVarChar(1), req.giriscikis)
            request.input('giris_durum', sql.NVarChar(30),'Supheli')
            request.execute('sp_noe_m_w_mrp_hareket_giriscikis_ekle').then((result) => {
                resolve({ data: req, status: true })
            }).catch(e => {
                reject({ data: req, status: false })
            })
        })

    })
}


app.post('/saveusers', (req, res) => {
    var ss = req.body.arr.map((item) => allAdd(item,
        req.body.tablet))
    Promise.all(ss).then((data) => {
        res.json({ status: true, data })
    }).catch((e) => {
        res.json({ status: false, e })
    })

})

const sunucu = app.listen(9000, () => {
    console.log('server çalışıyor');
})


const io = new Server(sunucu);

client.on('connect', function () {
    client.subscribe('/oetechvericiler');
});

//   client.on('message', function (topic, message) {
//         const data = JSON.parse(message.toString())
//         var s = dataConvert(data.raw_beacons_data,data.id)
//         //  console.log(s)
//         // s.forEach(element => connection.query(`CALL control_user("${element.Mac}",0,1) `));
//   });


function dataConvert(data, id) {
    var s = data.substring(0, data.length - 1)
    var datam = s.split(';')
    datam = datam.map((e) => {
        return {
            'id': id,
            'Mac': e.substring(0, 12),
            'Beacon UUID': e.substring(14, 44),
            'major': e.substring(44, 48),
            'minor': e.substring(48, 52),
            'Battery ': e.substring(54, 56),
        }
    })
    return datam
}


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
    socket.on('sayHello', (data) => {
        console.log(data)
    })
    socket.on('disconnect', (data) => {
        console.log('Kullnıcı çıktı : ' + socket.id)
    })
    socket.on('sss', (data) => {
        console.log(data);
    })
    socket.on('becons', (data) => {
        data.forEach(element => connection.query(`CALL control_user("${element.macAddress.replace(/:/g, "")}",1,0) `));
    })

    client.on('message', function (topic, message) {
        const data = JSON.parse(message.toString())
        var s = dataConvert(data.raw_beacons_data, data.id)
         console.log(s)
          socket.emit('becons',s)
    });

});




