const http = require('http');
const express = require('express');
const cors = require('cors');
const chatbot = require('./wapp.js');
// const webhook = require('./webhook.js');
const helmet = require('helmet');
require('dotenv').config({path:'.env'}); //  Para el uso de las variables en el archivo .env

const port = process.env.PORT || 80;
const IP = process.env.IP || "127.0.0.1";

chatbot.startBot(); // Inicia el bot de whatsapp

const app = express();
app.use(express.urlencoded( {extended: true, limit: "20mb"} ));  // Permite codificar una url para hacer posts en el Drive
app.use(express.json( {limit: "20mb"} ));
app.use(cors());
app.use(helmet());

app.get("/", (req, res) => {
  return res.send( "Chatbot: " + chatbot.WAStatus() ); }
);

//app.post("/webhook", express.json(), (req, res) => {
//    webhook.dialogflowFulfillment(req, res); }
//  );

const serverHttp = http.createServer(app); 
serverHttp.listen(port, IP );
//app.listen( port, () => { 
console.log( "Servidor corriendo en puerto " + port + "!" ); 
//});

