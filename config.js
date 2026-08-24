/* ============================================================
   Mi App · conexión con la base de datos
   ------------------------------------------------------------
   Pega aquí los dos valores de Supabase:
     Project Settings → API → Project URL  y  anon public

   No son secretos: están hechos para vivir en el código de
   aplicaciones web. Lo que protege los datos son los permisos
   por fila que instala base-de-datos/esquema.sql.

   Mientras estén vacíos, la app funciona igual pero solo guarda
   en este dispositivo, sin cuentas ni sincronización.
   ============================================================ */
window.APP_CONFIG = {
  url:  "",
  key:  ""
};
