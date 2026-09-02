/* Genera el par de claves VAPID una sola vez.
   Uso:  cd push && npm install && npm run keys        */
const webpush = require("web-push");
const k = webpush.generateVAPIDKeys();
console.log("\n=== Claves VAPID de Mi App ===\n");
console.log("VAPID_PUBLIC_KEY  =", k.publicKey);
console.log("VAPID_PRIVATE_KEY =", k.privateKey);
console.log(`
Qué hacer con esto:
  1. Copia la PÚBLICA dentro de app.html, en la constante PUSH_PUBLIC_KEY.
  2. Guarda ambas como secretos del repositorio en GitHub:
     Settings → Secrets and variables → Actions → New repository secret
       VAPID_PUBLIC_KEY   /  VAPID_PRIVATE_KEY
  3. La privada NO se comparte ni se sube al repositorio.
`);
