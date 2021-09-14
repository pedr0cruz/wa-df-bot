const venom = require('venom-bot');
const uuid = require("uuid");
const dialogflow = require('./dialogflow.js');
const googlesheet = require('./googlesheet.js')

const sessionMap = new Map(); // Gestion de sesiones
//const grupoAdmin = "51997300013-1627431529@g.us";
const grupoAdmin = "51997793848@c.us";
const miNumero = "51997300013@c.us";
const jessNumero = "51997793848@c.us";
const catalogo = 'https://wa.me/c/51949740763';
const buttons = [            
  {buttonId: 'id1', buttonText: {displayText: 'Ver Ofertas'}, type: 1},
  {buttonId: 'id2', buttonText: {displayText: 'Hacer un Pedido'}, type: 1},
  {buttonId: 'id3', buttonText: {displayText: 'Hablar a un Asesor'}, type: 1}
];
const chromiumArgs = [
  '--disable-web-security', '--no-sandbox', '--disable-web-security',
  '--aggressive-cache-discard', '--disable-cache', '--disable-application-cache',
  '--disable-offline-load-stale-cache', '--disk-cache-size=0',
  '--disable-background-networking', '--disable-default-apps', '--disable-extensions',
  '--disable-sync', '--disable-translate', '--hide-scrollbars', '--metrics-recording-only',
  '--mute-audio', '--no-first-run', '--safebrowsing-disable-auto-update',
  '--ignore-certificate-errors', '--ignore-ssl-errors', '--ignore-certificate-errors-spki-list'
];
var contexto = null;
var waStatus;

function startBot(){ 
  venom
//    .create()
//    .create('session', (base64Qrimg, asciiQR, attempts) => {}, (statusSession, session) => {}, {disableWelcome: true, disableSpins: true, browserArgs: chromiumArgs })
    .create( 'session', (base64Qrimg, asciiQR, attempts) => {}, (statusSession, session) => {}, {disableWelcome: true, disableSpins: true, useChrome: false, browserArgs: ['--no-sandbox'] } )  
//  .create('session', (base64Qrimg, asciiQR, attempts) => {}, (statusSession, session) => {}, {disableWelcome: true, disableSpins: true, browserArgs: chromiumArgs })
    .then((client) => start(client))
    .catch((erro) => {
      console.log(erro);
    });  
}

// Analiza los mensajes recibidos por WA y espera un Hola para iniciar la conversacion
function start(client) {
  // recibe un mensaje de WA
  client.onMessage(async (message) => {
   try {
    var cliente = { found: false };
    setSessionAndUser( message.from ); // Crea un ID para el numero telefonico de Usuario
    if( message.isGroupMsg === true ) return; // Ignora grupos
    if ((message.body === 'Hola' || message.body === 'hola')) {
      // Debe tomar el numero telefonico y buscarlo en el googlesheet de Clientes
      let telefono =  message.from.split("@")[0]; // Obtiene el telefono del sender ...
      sessionMap.get(message.from).cliente.Telefono = telefono; // ... y lo guarda
      let json = await googlesheet.getClients(); // Obtiene la lista de clientes del google sheets

        // Busca si en el excel esta el numero y si lo encuentra lo guarda 
        for (var i = 1; i < json.values.length; i++) {
            if( json.values[i][0] === telefono ){ // Cuando lo encuentre lo guarda
                sessionMap.get(message.from).cliente.Nombre = json.values[i][1];
                sessionMap.get(message.from).cliente.Apellido = json.values[i][2];
                sessionMap.get(message.from).cliente.Ciudad = json.values[i][3];
                sessionMap.get(message.from).cliente.found = true;
                break;
            }
        }

      // Estable el contexto en funcion al cliente encontrado
      if( sessionMap.get(message.from).cliente.found ) 
        contexto = "cliente_existe";
      else
        contexto = "cliente_nuevo";  
      console.log('BUSCANDO CLIENTE: ', contexto);
    }
    else contexto = null;
  
    // Se conecta con Dialogflow y envia el texto proveniente de WA, incluyendo parametros y contexto
    let payload =  await dialogflow.sendToDialogFlow( message.body ,
                                                      sessionMap.get(message.from).sessionId, 
                                                      sessionMap.get(message.from).cliente, 
                                                      contexto );
    // console.log( '\n\nPayload ', payload);

    // Envia las respuestas de Dialogflow de vuelta al WA
    let responses = payload.fulfillmentMessages;
    for (const response of responses) {
      await sendMessageToWhatsapp(client, message.from, response.text.text[0]); // Envia al WA la respuesta de Dialogflow
    }

    // Realiza operaciones finales despues de la respuesta del Dialogflow
    let allParams = payload.allRequiredParamsPresent; // Valida si el intent Terminó
    if( allParams ){ // Al finalizar un Intent
        // Obtiene los datos del Intent
        let Intent = payload.intent.displayName; // Nombre
        let contexnames = []; // Contextos
        for( const context of  payload.outputContexts)  contexnames.push( context.name.split("/")[6] ); // Arreglo de Contextos
        sessionMap.get(message.from).payload = payload; // Guarda lo enviado por Dialogflow
        console.log('\nIntencion: ', Intent, '\nContextos: ', contexnames, '\nPaso Final: ', allParams); 

        // Realiza acciones posteriores de Contextos
//        if( contexnames.indexOf('venta') > 0 ) 
//          await sendMessageToGroup(client, jessNumero /*grupoAdmin*/, sessionMap.get(message.from)); // Envia mensaje al grupo
        if( contexnames.indexOf('ver_catalogo') > 0 ) 
          await sendLinkToWhatsapp(client, message.from, '', catalogo);// Verifica si debe mostrar catalogo
        if( contexnames.indexOf('ver_opciones') > 0 ) 
          await sendButtonToWhatsapp(client, message.from, 'Selecciona un botón para...', buttons); // Verifica si debe mostrar opciones
        // Realiza acciones posteriores de Intent
        switch ( Intent ) {
          case '3.NuevoCliente.SI':
            //console.log('REGISTRAR NUEVO CLIENTE!');
            guardaClienteMap( sessionMap.get(message.from).cliente, payload ); // Guarda el cliente en el Mapa
            crearClienteGS(sessionMap.get(message.from).cliente);
            await sendClienteToGroup(client, grupoAdmin, sessionMap.get(message.from)); // Envia cliente al grupo
            await sendContactToWhatsapp(client, grupoAdmin, message.from, sessionMap.get(message.from ));
            break;
          case '6.Pedido':
            //console.log('REGISTRAR NUEVO PEDIDO!');
            crearPedidoGS(sessionMap.get(message.from));
            await sendVentaToGroup(client, grupoAdmin, sessionMap.get(message.from)); // Envia mensaje al grupo
            break;
          default:
            break;
        };
      }
    } catch (error) {
      client.close();
      console.error(error.message);
    }; 
  });

  
  // Detecta y corrige: // CONFLICT // CONNECTED // DEPRECATED_VERSION // OPENING // PAIRING // PROXYBLOCK // SMB_TOS_BLOCK // TIMEOUT // TOS_BLOCK // UNLAUNCHED // UNPAIRED // UNPAIRED_IDLE
  client.onStateChange((state) => {
    waStatus = state;
    // force whatsapp take over
    if ('CONFLICT'.includes(state)) client.useHere();
    // detect disconnect on whatsapp
    if ('UNPAIRED'.includes(state)) console.log('logout');
  });
  
  // Detecta y corrige DISCONNECTED // SYNCING // RESUMING // CONNECTED
  let time = 0;
  client.onStreamChange((state) => {
    console.log('State Connection Stream: ' + state);
    clearTimeout(time);
    if (state === 'DISCONNECTED' || state === 'SYNCING') {
      time = setTimeout(() => {
        client.close();
      }, 80000);
    }
  });
  
  // Detecta la llamada telefonica
  client.onIncomingCall(async (call) => {
    console.log(call);
    client.sendText(call.peerJid, "Lo siento, soy un robot y no puedo reponder llamadas.\n Escribe *Hola* para conversar!");
  });
  
}

// Recibe el numero telefonico y lo guarda en un hash
async function setSessionAndUser(senderId) {
  try {
    if (!sessionMap.has(senderId)) {
      const sessionId =  uuid.v1();  // Crea un random Id para cada numero telefonico
      const cliente   = { found: false };
      const payload   = {};
      sessionMap.set(senderId, new Object({sessionId, cliente, payload}));
    }
  } catch (error) {
    throw error;
  }
}

/***
 * Envia un mensaje de WA
 */
function sendMessageToWhatsapp(client, from, response) {
  if( response === undefined || response === "" ) return;
  return new Promise((resolve, reject) => {
    client
    .sendText(from, response)
    .then((result) => {
      resolve(result);
    })
    .catch((erro) => {
      console.error('Error enviando mensaje WA: ', erro);
      console.log("sendMessagetoWA: ", from, response);
      reject(erro);
    });
  });
}

 // Envia cliente al grupo
async function sendClienteToGroup(  client,  to, session ){
  // toma los datos de la venta
  let Telefono = session.cliente.Telefono;
  let Nombre = session.cliente.Nombre + " " + session.cliente.Apellido;
  let Ciudad = session.cliente.Ciudad;

  let mensageToAdmin = "Se ha registrado un nuevo cliente:" +
  "\n  Telefono: +" + Telefono +
  "\n  Nombre: " + Nombre +
  "\n  Ciudad: " + Ciudad +
  "\n\nPor favor contactarlo. Gracias!";

  await client
    .sendText(to, mensageToAdmin )
    .then((result) => {
      // console.log('Result: ', result); //return object success
    })
    .catch((erro) => {
      console.error('\n\nError enviando cliente Grupo: ', erro); //return object error
    });
}

async function sendVentaToGroup( client, to, session ) {
  // toma los datos de la venta
  let Telefono = session.cliente.Telefono;
  let Nombre = session.cliente.Nombre + " " + session.cliente.Apellido;
  let sfecha = session.payload.parameters.fields.CasaFecha.stringValue;
  let Fecha = new Date(sfecha).toJSON().slice(0,10).split('-').reverse().join('/');
  let Dias = session.payload.parameters.fields.CasaDias.numberValue;
  let Personas = session.payload.parameters.fields.CasaCantidad.numberValue;
  let Comentarios = session.payload.parameters.fields.CasaComentario.stringValue;
  let Codigo =  session.payload.outputContexts[0].parameters.fields['CasaCodigo.original'].stringValue.toUpperCase();

  let mensageToAdmin = "Hemos recibido un nuevo pedido:" +
  "\n  Telefono: +" + Telefono +
  "\n  Nombre: " + Nombre +
  "\n  Casa: " + Codigo +
  "\n  Fecha: " + Fecha +
  "\n  Dias: " + Dias +
  "\n  Paxs: " + Personas +
  "\n  Comentarios: " + Comentarios +
  "\n\nPor favor atenderlo. Gracias!";

  // Registra la venta en el excel
  // values = {Telefono, Nombre, Fecha, Codigo, Dias, Personas, Comentarios };
  console.log( 'Mensaje ', mensageToAdmin );

  await client
  .sendText(to, mensageToAdmin )
  .then((result) => {
    // console.log('Result: ', result); //return object success
  })
  .catch((erro) => {
    console.error('\n\nError enviando mensaje Grupo: ', erro); //return object error
  });
}

/**
 * Envia una lista de opciones
 * @param {cliente google} client 
 * @param {estructura del mensaje} message 
 * @param {texto de titulo} titulo 
 * @param {arraglo de botones} buttons 
 * @param {descripcion opcional} descripcion 
 */
async function sendButtonToWhatsapp(client, to, titulo, buttons,descripcion) {
  //console.log('Enviando botones');
  await client
    .sendButtons(to, titulo , buttons, descripcion )
    .then((result) => {
    // console.log('Result: ', result); //return object success
    })
    .catch((erro) => {
      console.error( '\n\nError enviando botones a WA: ', erro); //return object error
    });
}

// Automatically sends a link with the auto generated link preview. You can also add a custom message to be added.
async function sendLinkToWhatsapp(client, to, titulo, enlace) {
  await client
  .sendLinkPreview( to, enlace, titulo )
  .then((result) => {
    // console.log('Result: ', result); //return object success
  })
  .catch((erro) => {
    console.error( '\n\nError enviando link a  WA: ', erro); //return object error
  });
}

// Send contact
async function sendContactToWhatsapp(client, to, from, session) {
  let contacto = session.cliente.Nombre + " " + session.cliente.Apellido;
  await client
    .sendContactVcard(to, from, contacto )
    .then((result) => {})
    .catch((erro) => {
      console.error('Error enviando contacto: ', erro); //return object error
    });
}

function guardaClienteMap( cliente, payload ) {
  cliente.Nombre = payload.parameters.fields.ClienteNombre.stringValue;
  cliente.Apellido = payload.parameters.fields.ClienteApellido.stringValue;
  cliente.Ciudad = payload.parameters.fields.ClienteCiudad.stringValue;
}

function crearClienteGS(cliente) {
  let Telefono = cliente.Telefono;
  let Nombre = cliente.Nombre;
  let Apellido = cliente.Apellido;
  let Ciudad = cliente.Ciudad;

  values = {Telefono, Nombre, Apellido, Ciudad };
  console.log("CREANDO NUEVO CLIENTE: ",values);
  googlesheet.setClient( values );
}
 
function crearPedidoGS(session) {
  // toma los datos de la venta
  let Telefono = session.cliente.Telefono;
  let Nombre = session.cliente.Nombre + " " + session.cliente.Apellido;
  let sfecha = session.payload.parameters.fields.CasaFecha.stringValue;
  let Fecha = new Date(sfecha).toJSON().slice(0,10).split('-').reverse().join('/');
  let Dias = session.payload.parameters.fields.CasaDias.numberValue;
  let Personas = session.payload.parameters.fields.CasaCantidad.numberValue;
  let Comentarios = session.payload.parameters.fields.CasaComentario.stringValue;
  let Estado = "NUEVO PEDIDO";
  let Codigo =  session.payload.outputContexts[0].parameters.fields['CasaCodigo.original'].stringValue.toUpperCase();
  
  // Registra la venta en el excel
   values = {Telefono, Nombre, Estado, Fecha, Codigo, Dias, Personas, Comentarios };
  googlesheet.setVenta( values );
}

function WAStatus() {
  return waStatus;
}
  
module.exports = {
  startBot,
  WAStatus,
};
 