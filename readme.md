Este es un proyecto para un bot de whatsapp usando Venom-bot y webhook fullfillment
La comunicacion se realiza asi: whatsapp(chrome)->venom(wapp.js)->dialogflow.js->webhook.js

Para ejecutarlo localmente, utilizar node index.js o 

Para ejecutar el servidor y hacer pruebas del webhook desde Dialogflow, utilizamos la extension de VSCode ngrok:
- Ctrl+Shift+P, escribimos ngrok:start y nos pide el puerto que indicamos a express. Se genera una url dinamica que debo colocar en el fullfilment

En un Centos7 donde no hay chrome instalado:
wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
sudo yum install ./google-chrome-stable_current_*.rpm
