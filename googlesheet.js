/*** Ver detalles en: https://youtu.be/PFJNJQCU_lo
*/
const  {google} = require('googleapis');

// Datos globales
const spreadsheetId = '1MCJZJ2so2TYebC9KAkrOQTKh0Cfdik_xKS-AqbEt6Yg'; // ID obtenido de la url del archivo:https://docs.google.com/spreadsheets/d/1MCJZJ2so2TYebC9KAkrOQTKh0Cfdik_xKS-AqbEt6Yg/edit#gid=2040434871
// const api_key = "AIzaSyAC3WbVG4xv_Lc3kJj9XlHyFyIp-7dBEqc"; // No se utiliza

async function getClients() 
{
    // Crea las credenciales google
    const auth = new google.auth.GoogleAuth({
        keyFile: "./config/gscredentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });
    const range = "Clientes!A:D";            // pagina en el libro. Puede hallarlo como `gid` en la URL.
    // Obtiene un cliente
    const client = await auth.getClient();
    // Crear la instancia de google sheets
    const googleSheets = google.sheets( { version: "v4", auth: client } );
    // Leer
    const getRows = await googleSheets.spreadsheets.values.get({ 
        auth,
        spreadsheetId,
        range
    });

    return getRows.data;
};

async function setClient( values ) 
{
    // Crea las credenciales google
    const auth = new google.auth.GoogleAuth({
        keyFile: "./config/gscredentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });
    const range = "Clientes!A:D";            // pagina en el libro. Puede hallarlo como `gid` en la URL.
    // Obtiene el cliente
    const client = await auth.getClient();   
    try { 
        // Crear la instancia de google sheets
        const googleSheets = google.sheets( { version: "v4", auth: client } );   

        const {Telefono, Nombre, Apellido, Ciudad} = values; // Desestructurando los valores
        // Agregar
        return await googleSheets.spreadsheets.values.append({ 
            auth,
            spreadsheetId,
            range,
            valueInputOption: "USER_ENTERED",
            resource: { 
                values : [[Telefono, Nombre, Apellido, Ciudad]]
            }
        });
    } catch (error) {
        console.error(error.message); }; 
};

async function setVenta( values ) {
    // Crea las credenciales google
    const auth = new google.auth.GoogleAuth({
        keyFile: "./config/gscredentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });
    const range = "Datos de ventas!A:R";  // pagina en el libro. Puede hallarlo como `gid` en la URL.
    // Obtiene el cliente de google
    const client = await auth.getClient();   
//    try { 
        // Crear la instancia de google sheets
        const googleSheets = google.sheets( { version: "v4", auth: client } );               
        const {Telefono, Nombre, Estado, Fecha, Codigo, Dias, Personas, Comentarios} = values; // Desestructurando los valores
        // console.log("values=", values);

        // Agregar
        return await googleSheets.spreadsheets.values.append({ 
            auth,
            spreadsheetId,
            range,
            valueInputOption: "USER_ENTERED",
            resource: { 
                values : [[Telefono, Nombre, Estado, Fecha, "", "", Codigo, "", "", "", "", Dias, Personas, "", "", "", Comentarios ]]
            }
        });
//    } catch (error) console.error(error.message);  
};

module.exports = {
    getClients: getClients,
    setClient: setClient,
    setVenta: setVenta,
} 