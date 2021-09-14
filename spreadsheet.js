const { GoogleSpreadsheet } = require('google-spreadsheet');

const credenciales = require("./config/gscredentials.json");

// let googleId = '1URoD8aW9RqoaI0TiE2Cmdne68KFkYY1S8ELin7R2ixc'; // ID obtenido de la url del archivo: https://docs.google.com/spreadsheets/d/1URoD8aW9RqoaI0TiE2Cmdne68KFkYY1S8ELin7R2ixc/edit#gid=0
let googleId = '1MCJZJ2so2TYebC9KAkrOQTKh0Cfdik_xKS-AqbEt6Yg'; // https://docs.google.com/spreadsheets/d/1MCJZJ2so2TYebC9KAkrOQTKh0Cfdik_xKS-AqbEt6Yg/edit#gid=2040434871
let gid = '2040434871';

async function getClients(){
   const documento = new GoogleSpreadsheet( googleId ); // Crea la variable para acceder al documento

   await documento.useServiceAccountAuth(credenciales); // Accede al documento con las credenciales
   await documento.loadInfo(); // Obtiene datos iniciales del documento
   
   const sheet = documento.sheetsById[gid];
   const rows = await sheet.getRows();
   
   console.log(rows[0].Telefono);
   return rows;
};

async function setClient( pObjeto ){
    console.log( pObjeto );

    const documento = new GoogleSpreadsheet(googleId);
    await documento.useServiceAccountAuth(credenciales);
    await documento.loadInfo();

    const sheet = documento.sheetsById[gid];
    await sheet.addRow(pObjeto);
}

module.exports = {
    getClients,
    setClient,
}