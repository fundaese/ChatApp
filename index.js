var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var jsdom = require('jsdom');
$ = require('jquery')(new jsdom.JSDOM().window);

const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function encodeImage(filename, message) {
  var outputFilename = filename;
  outputFilename = outputFilename.replace('.png', '-out.png');
  const { stdout, stderr } = await exec("stegjs "+filename+" -e '"+ message +"' 2x1 "+ outputFilename);
  setTimeout(function(){
      base64ImageToText(outputFilename);
  }, 2);
}

function createFile(name, content){
  var fs = require('fs');

  fs.appendFile(name, content, 'base64', function (err) {
    if (err) throw err;
    console.log('File is created successfully.');
  });
}

function base64ImageToText(filename){
  var fs = require('fs');
  const imageToBase64 = require('image-to-base64');
  imageToBase64(filename) // you can also to use url
     .then(
         (response) => {
             io.emit('addimage','Image', "data:image/png;base64,"+response);
              fs.unlink(filename, ()=>{});
              fs.unlink(filename.replace('-out', ''), ()=>{});
         }
     )
     .catch(
         (error) => {
             io.emit('addimage','Image', "hata");
         }
     )
}

var jsonObject = {message: "msg", name: "user", age: 24};
var users = [],socketlerim = [];

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log("User connected",socket.id);

  socket.on('disconnect', () => {
      console.log(socketlerim[socket.id] + " disconnected");
      for (var i = 0; i < users.length; i++)
      if (users[i].isim === socketlerim[socket.id]) {
          users.splice(i, 1);
          delete socketlerim[socket.id];
          io.emit('users', users);
          break;
      }
    });

    socket.on('sendPrivate',function(data){
        console.log(data);
        io.to(data.to).emit('getPrivate',{'message':data.message,'socket_id':socket.id ,'gonderen':socketlerim[socket.id]})
    });

  socket.on('yeniGiris',function(kullaniciadi)
  {
      if(kullaniciadi!=null)
      {
          socketlerim[socket.id] = kullaniciadi;

         users.push({'isim':kullaniciadi,'socket_id':socket.id} );
         io.emit('users',users);
      }
 });



  socket.on('chat message', (clientMessage) => {
    //console.log('message: ' + myJson);
    io.emit('chat message', clientMessage);
  });

  socket.on('user image', function(imageObject){
    imageObject = JSON.parse(imageObject);

    /*
      -> gelen base64 içeriği rastgele bir isimde resim dosyası olarak oluşur.
      -> tmr-17052020-032345-010000.png
    */

    var d = new Date();
    var year = d.getFullYear();
    var month = d.getMonth() + 1;
    month = ( month.toString().length == 1) ? '0'+month : month ;
    var day = d.getDate();
    day = ( day.toString().length == 1) ? '0'+day : day ;
    var hours = d.getHours();
    var min = d.getMinutes();
    var sec = d.getSeconds();
    var randInt = Math.floor(Math.random() * Math.floor(10000));
    var fileName = year+month+day+ '-' + hours+min+sec+'-'+randInt;
    fileName += '.png';

    var base64Image = imageObject.image;
    base64Image  = base64Image.replace(/^data:image\/png;base64,/,"");
    createFile(fileName, base64Image);
    encodeImage(fileName, imageObject.hashmessage);

  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
