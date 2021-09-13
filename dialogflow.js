const dialogflow = require("dialogflow");
const { struct } = require('pb-util');  // Para estructurar los datos del params enviado al Intent
const config = require("./config/config");

const credentials = {
  client_email: config.GOOGLE_CLIENT_EMAIL,
  private_key: config.GOOGLE_PRIVATE_KEY,
};

 // Create a new session
const sessionClient = new dialogflow.SessionsClient({
  projectId: config.GOOGLE_PROJECT_ID,
  credentials,
});

/**
 * Send a query and a context to the Dialogflow agent, and return the query result.
 * @param {string} projectId The project to be used
 */
async function sendToDialogFlow(msg, sessionId, params, context) {
  let textToDialogFlow = msg;
  try {
    let projectId = config.GOOGLE_PROJECT_ID;
    const sessionPath = sessionClient.sessionPath( projectId, sessionId );
    // The text query request.
    const request = {
      session: sessionPath,
      queryParams:{
        //List of context to be sent and activated before the query is executed
        contexts:[
            {
                // The context to be sent and activated or overrated in the session 
                name: `projects/${projectId}/agent/sessions/${sessionId}/contexts/${context}`,
                parameters: (params===null)? {} : struct.encode(params),
                // The lifespan of the context
                lifespanCount: 1
              }
        ],
        payload: {
          data: params,
        },      },
      queryInput: { 
        text: {
          text: textToDialogFlow, // The query to send to the dialogflow agent
          languageCode: config.DF_LANGUAGE_CODE, // The language used by the client (Ej: en-US)
        },
      },
    };
    //console.log(request);
    //console.log(JSON.stringify(request,null, " "));
    // Send request and log result
    const responses = await sessionClient.detectIntent(request);
    console.log('Intención detectada:');
    const result = responses[0].queryResult;
    console.log(`  Mensaje: ${result.queryText}`);
    console.log(`  Respuesta: ${result.fulfillmentText}`);
    // console.log(`  Output Contexts: ${JSON.stringify(result.outputContexts)}`)
    if (result.intent) {
      console.log(`  Intención: ${result.intent.displayName}`);
    } else {
      console.log(`  No se identifica la Intención.`);
    }

    let defaultResponses = [];
    if (result.action !== "input.unknown") {
      result.fulfillmentMessages.forEach((element) => {
          defaultResponses.push(element);
      });
    }
    if (defaultResponses.length === 0) {
      result.fulfillmentMessages.forEach((element) => {
        if (element.platform === "PLATFORM_UNSPECIFIED") {
          defaultResponses.push(element);
        }
      });
    }
    result.fulfillmentMessages = defaultResponses;
    // console.log(JSON.stringify(result,null, " "));
    return result;
    // console.log("se enviara el resultado: ", result);
  } catch (e) {
    console.log("error");
    console.log(e);
  }
}

module.exports = {
  sendToDialogFlow,
};
