Este es un proyecto para un bot de whatsapp usando Venom-bot y webhook fullfillment
La comunicacion se realiza asi: whatsapp(chrome)->venom(wapp.js)->dialogflow.js->webhook.js

Para ejecutarlo localmente, utilizar node index.js o 

Para ejecutar el servidor y hacer pruebas del webhook desde Dialogflow, utilizamos la extension de VSCode ngrok:
- Ctrl+Shift+P, escribimos ngrok:start y nos pide el puerto que indicamos a express. Se genera una url dinamica que debo colocar en el fullfilment

En un Centos7 donde no hay chrome instalado:
wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
sudo yum install ./google-chrome-stable_current_*.rpm

# wa-df-bot · Chatbot de WhatsApp con Dialogflow

Chatbot de atención y ventas para WhatsApp. Recibe los mensajes de los clientes con [Venom-bot](https://github.com/orkestral/venom), los envía a un agente de **Dialogflow** para detectar la intención y, según el resultado, registra clientes y pedidos en **Google Sheets** y avisa a un **grupo de administradores** por WhatsApp.

## Características

- Atiende a los clientes por WhatsApp; la conversación comienza al escribir **Hola**.
- Identifica si el número ya está registrado en la hoja `Clientes`; si no lo está, inicia el registro de cliente nuevo.
- Menú con botones: **Ver Catálogo**, **Hacer un Pedido** y **Preguntar a un Asesor**.
- Envía el enlace al catálogo de WhatsApp Business.
- Registra clientes (hoja `Clientes`) y pedidos (hoja `Ventas`) en Google Sheets.
- Notifica al grupo de administradores los nuevos clientes, pedidos y preguntas, junto con la tarjeta de contacto del cliente.
- Responde automáticamente a las llamadas telefónicas indicando que es un robot.
- Reconecta la sesión de WhatsApp ante conflictos o desconexiones prolongadas.
- Endpoint de estado (`GET /`) que muestra el estado de la conexión de WhatsApp.
- Webhook de *fulfillment* de Dialogflow opcional (`webhook.js`).

## Arquitectura

```
WhatsApp (Chrome) ──► Venom-bot (wapp.js) ──► Dialogflow (dialogflow.js)
                            │                          │
                            │                          └─► Webhook fulfillment (webhook.js, opcional)
                            │
                            ├─► Google Sheets (googlesheet.js)
                            └─► Grupo de administradores (WhatsApp)
```

| Archivo | Función |
| --- | --- |
| `index.js` | Punto de entrada. Inicia el bot y levanta un servidor Express (CORS, Helmet) con la ruta `GET /` de estado. |
| `wapp.js` | Lógica del bot: sesiones por número, flujo de conversación, botones, avisos al grupo y manejo de estados de conexión. |
| `dialogflow.js` | Cliente de Dialogflow (`detectIntent`). Envía el texto, los parámetros y el contexto de la sesión. |
| `googlesheet.js` | Lectura y escritura en Google Sheets con `googleapis` (en uso). |
| `spreadsheet.js` | Alternativa con `google-spreadsheet` (actualmente no se usa). |
| `webhook.js` | Fulfillment de Dialogflow (`dialogflow-fulfillment`) para los intents `3.NuevoCliente.SI`, `6.Pedido` y `ProbandoWebhook`. |
| `tokens/` | Datos de la sesión de WhatsApp generados por Venom. |

### Intents y contextos de Dialogflow

El bot espera que el agente de Dialogflow tenga, al menos:

- Intents: `3.NuevoCliente.SI`, `5.Asesor`, `6.Pedido` (y `ProbandoWebhook` si se usa el webhook).
- Contextos de entrada: `cliente_nuevo` y `cliente_existe`, que el bot activa según si el teléfono está en la hoja `Clientes`.
- Contextos de salida: `ver_catalogo` y `ver_opciones`, que activan el envío del catálogo y de los botones.
- Parámetros: `ClienteNombre`, `ClienteApellido`, `ClienteCiudad`, `CasaFecha`, `CasaDias`, `CasaCantidad`, `CasaCodigo`, `CasaComentario` y `Pregunta`.

## Requisitos

- Node.js 14 o superior y npm.
- Google Chrome instalado (Venom se ejecuta con `useChrome: true`).
- Un agente de Dialogflow ES y una cuenta de servicio de Google Cloud con acceso a Dialogflow.
- Una hoja de Google Sheets con las pestañas `Clientes` (columnas A:D: teléfono, nombre, apellido, ciudad) y `Ventas` (columnas A:Q), compartida con el correo de la cuenta de servicio.
- Un teléfono con WhatsApp para vincular la sesión mediante código QR.

## Instalación

```bash
git clone https://github.com/pedr0cruz/wa-df-bot.git
cd wa-df-bot
npm install
```

## Configuración

### 1. Variables de entorno (`.env`)

Copia `.env.example` a `.env` y completa los valores:

| Variable | Descripción |
| --- | --- |
| `NODE_ENV` | Entorno de ejecución (`development` o `production`). |
| `IP` | IP en la que escucha el servidor (por defecto `127.0.0.1`). |
| `PORT` | Puerto del servidor (por defecto `80`). |
| `HPPS_PORT` | Puerto HTTPS. |
| `GROUP_NUMBER` | ID del grupo de WhatsApp de administradores, con el formato `<numero>-<id>@g.us`. |

### 2. Credenciales de Google y Dialogflow (carpeta `config/`)

La carpeta `config/` está en `.gitignore` y debes crearla localmente con dos archivos:

- `config/config.js`, que exporta `GOOGLE_PROJECT_ID`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` y `DF_LANGUAGE_CODE` (por ejemplo `es`).
- `config/gscredentials.json`, que es la llave JSON de la cuenta de servicio para Google Sheets.

Ejemplo de `config/config.js`:

```js
module.exports = {
  GOOGLE_PROJECT_ID: 'mi-proyecto-dialogflow',
  GOOGLE_CLIENT_EMAIL: 'cuenta@mi-proyecto.iam.gserviceaccount.com',
  GOOGLE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n',
  DF_LANGUAGE_CODE: 'es',
};
```

### 3. Ajustes dentro del código

Estos valores están escritos directamente en el código y conviene revisarlos para tu propio negocio:

- `googlesheet.js`: `spreadsheetId` de tu hoja de cálculo.
- `wapp.js`: URL del catálogo (`catalogo`) y textos de los botones.
- `webhook.js`: `grupoAdmin` y `miNumero`, si usas el webhook.

## Ejecución

```bash
node index.js
```

Al iniciar, Venom abre Chrome y muestra un código QR en la terminal. Escanéalo desde WhatsApp (Dispositivos vinculados). La sesión se guarda en `tokens/` y se reutiliza en los siguientes arranques.

Comprueba el estado en `http://<IP>:<PORT>/`, que responde `Chatbot: <estado>`.

> Nota: `package.json` define los scripts `start` y `dev` apuntando a `server.js`, que no existe. Hasta que se corrijan, usa `node index.js` (o `npx nodemon index.js` para desarrollo).

### Activar el webhook de Dialogflow (opcional)

En `index.js` están comentadas las líneas que cargan `webhook.js` y exponen la ruta `POST /webhook`. Para usarlo:

1. Descomenta `const webhook = require('./webhook.js');` y la ruta `app.post("/webhook", ...)`.
2. Expón el servidor de forma pública. En desarrollo puedes usar la extensión **ngrok** de VS Code: `Ctrl+Shift+P`, ejecuta `ngrok:start` e indica el puerto de Express.
3. Copia la URL dinámica que se genera y pégala en **Fulfillment → Webhook** de Dialogflow, agregando `/webhook` al final.

### Servidor CentOS 7 sin Chrome

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
sudo yum install ./google-chrome-stable_current_*.rpm
```

## Flujo de uso

1. El cliente escribe **Hola**.
2. El bot busca su teléfono en la hoja `Clientes` y activa el contexto `cliente_existe` o `cliente_nuevo`.
3. Dialogflow conduce la conversación (registro, catálogo, pedido o consulta a un asesor).
4. Al completarse un intent, el bot actúa:
   - `3.NuevoCliente.SI`: guarda el cliente en Sheets y avisa al grupo con su contacto.
   - `6.Pedido`: registra el pedido en la hoja `Ventas` con estado `NUEVO PEDIDO` y avisa al grupo.
   - `5.Asesor`: reenvía la pregunta del cliente al grupo con su contacto.

## Tecnologías

Node.js · Express · Venom-bot · Dialogflow ES · Google Sheets API · dotenv · Helmet · CORS

## Seguridad

Antes de publicar o compartir el repositorio, revisa lo siguiente:

- **No subas secretos.** El archivo `.env` y la carpeta `tokens/` (sesión de WhatsApp) no deberían estar en Git. Agrega `tokens/` al `.gitignore`, elimínalos del índice con `git rm --cached` y, si el repositorio es público, considera cerrar la sesión de WhatsApp vinculada y regenerar las credenciales, porque siguen en el historial de commits.
- Las llaves de Google (`config/`) deben permanecer fuera del repositorio.
- Evita dejar IDs de hojas de cálculo, números de teléfono y grupos escritos en el código; muévelos al `.env`.
- Usa este bot respetando las condiciones de WhatsApp. Venom-bot automatiza WhatsApp Web, y WhatsApp puede bloquear números que usen automatización no oficial.

## Pendientes sugeridos

- Corregir los scripts de `package.json` (`main`, `start`, `dev`) para que usen `index.js`.
- Eliminar `spreadsheet.js` o unificarlo con `googlesheet.js`.
- Persistir las sesiones de conversación, que hoy viven solo en memoria y se pierden al reiniciar.
- Añadir validaciones y manejo de errores en `setVenta` y en la lectura de parámetros de Dialogflow.
- Añadir una licencia y datos de autor en `package.json`.

## Autor

[pedr0cruz](https://github.com/pedr0cruz)
