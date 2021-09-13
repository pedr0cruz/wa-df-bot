const {WebhookClient} = require('dialogflow-fulfillment');
const googlesheet = require('./googlesheet.js');
// const venom = require('venom-bot');

const grupoAdmin = "51949740763-1627431529@g.us";
const miNumero = "51997300013@c.us";
// process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
function dialogflowFulfillment( request, response ) 
{
  const agent = new WebhookClient({ request, response });
  // console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  // console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  function crearCliente(agent) {
    let ctx = agent.context.get('cliente_nuevo');
    let Telefono = ctx.parameters.ClienteTelefono;
    let Nombre = ctx.parameters.ClienteNombre;
    let Apellido = ctx.parameters.ClienteApellido;
    let Ciudad = ctx.parameters.ClienteCiudad;

    values = {Telefono, Nombre, Apellido, Ciudad };
    googlesheet.setClient( values );

    agent.add( "Hola "+ Nombre +". ¿En qué puedo ayudarte hoy?" );
    agent.add( "Puedes escribir...\n*Ofertas* para ver nuestro catálogo de ofertas.\n*Pedido* para solicitar una reservación.\n*Asesor* para que te atienda un miembro del equipo." );
  }
   
  function enviarPedido(agent) {
    console.log('En enviarPedido\n\n');
    let ctx = agent.context.get('cliente_existe');
    // toma los datos de la venta
    let Telefono = ctx.parameters.ClienteTelefono;
    let Nombre = ctx.parameters.ClienteNombre + " " + ctx.parameters.ClienteApellido;
    let Fecha = new Date(ctx.parameters.CasaFecha).toJSON().slice(0,10).split('-').reverse().join('/');
    let Codigo = ctx.parameters["CasaCodigo.original"].toUpperCase();
    let Dias = ctx.parameters.CasaDias;
    let Personas = ctx.parameters.CasaCantidad;
    let Comentarios = ctx.parameters.CasaComentario;
    let Estado = "NUEVO PEDIDO";
    
    // Registra la venta en el excel
     values = {Telefono, Nombre, Estado, Fecha, Codigo, Dias, Personas, Comentarios };
    googlesheet.setVenta( values );

        // Envia mensaje al grupo administradores
    mensageGrupoAdmin = "Hola equipo, se ha registrado una nueva venta con los siguientes datos";
  //  sendMessageToGroup( grupoAdmin, mensageGrupoAdmin );

    // Envia mensaje al usuario agradeciendo
    agent.add( "Gracias "+ Nombre +" por tu pedido, estamos enviando los datos del pedido a uno de nuestros asesores.\nEstaré aquí cuando me necesites, sólo escribe *Hola* para iniciar la conversación.\n" );
    agent.add( "Por favor, evalúa nuestro servicio (bueno, regular o malo)?" );

  }

  function ProbandoWebhook(agent) {
    agent.add(`Respuesta desde Webhook`);
  }

/*
  function sendMessageToGroup( telefono, mensage ){ 
    // Init sales whatsapp bot
    venom.create('ventas').then((salesClient) => {
      return new Promise((resolve, reject) => {
        salesClient
          .sendText(telefono, mensage)
          .then((result) => { 
            // console.log('Result: ', result); //return object success
          })
          .catch((erro) => {
            console.error('Error when sending: ', erro); //return object error
          });      
      })
    });
  }
*/

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('3.NuevoCliente.SI', crearCliente);
  intentMap.set('6.Pedido', enviarPedido);
  intentMap.set('ProbandoWebhook', ProbandoWebhook);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
};

module.exports = {
    dialogflowFulfillment,
  };