# Atlantic City — CRM académico | Entrega preliminar

Prototipo local de servicios culturales y recreativos ficticios, sin apuestas ni pagos reales. HTML, CSS, JavaScript y Bootstrap; Node.js, Express y SQL Server. No es una aplicación de producción.

## Requisitos
- Node.js y npm (el entorno original usa Node 24).
- SQL Server con autenticación SQL y TCP/IP local habilitado (puerto 1433 o el configurado), SSMS o equivalente.
- Internet para instalar dependencias y cargar Bootstrap e iconos desde CDN.

## Instalación nueva
1. Descomprimir o clonar el repositorio. Abrir una terminal en la carpeta que contiene `package.json`.
2. En SSMS, como administrador, ejecutar `sql/BD_AtlanticCity.sql` **solo sobre una base nueva**. Contiene 16 tablas, datos de ejemplo, descripciones y beneficios actualizados, avisos y consultas de comprobación. Si ya se tiene la base actualizada, omitirlo.
3. Abrir `sql/permisos_demo.sql`, sustituir la contraseña de ejemplo por una clave propia y ejecutar como administrador. No guardar ni publicar la clave real en el script. Si el login existe, se conserva su contraseña y se conceden los permisos de tablas necesarios.
4. Copiar `.env.example` a `.env` (`copy .env.example .env` en CMD). Completar DB_PASSWORD con la clave del login de aplicación y JWT_SECRET con el resultado de `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Ajustar servidor y puerto si corresponde. No compartir `.env`.
5. Ejecutar `npm ci` para instalar las dependencias del archivo de bloqueo.
6. Ejecutar `node backend/prepararUsuarios.js`. En una base nueva prepara cuatro cuentas; no modifica las contraseñas previamente preparadas.
7. Ejecutar `npm start` (o `npm run dev` para desarrollo). Abrir http://localhost:3000. No usar Live Server. Mantener la terminal abierta.

## Cuentas ficticias de prueba
| Rol | Correo | Contraseña local inicial |
|---|---|---|
| Administrador | admin@example.test | Demo2026!Local |
| Cliente | ana@example.test | Demo2026!Local |
| Cliente | luis@example.test | Demo2026!Local |
| Cliente | elena@example.test | Demo2026!Local |

Estas credenciales son públicas exclusivamente para la demostración local; no utilizar en producción ni con datos reales. Si se cambió una contraseña anteriormente, utilizar la nueva.

## Comprobación
- http://localhost:3000/api/database debe devolver BD_AtlanticCity.
- Iniciar sesión como administrador y cliente; comprobar perfiles, solicitudes y persistencia tras reiniciar. Verificar que las tres tarjetas de membresía contienen cuatro beneficios cada una.
- Si falla TCP/IP, verificar el puerto con `netstat -ano | findstr :1433` y la configuración de SQL Server. No abrir puertos al exterior.

## Alcance y límites
Entrega preliminar. Conserva el frontend de la última versión corregida. Pendientes: recuperación por correo, edición administrativa de avisos, pruebas completas de integración, preferencias y sincronización. Los datos semilla reproducen las correcciones acordadas, no exportan cambios privados realizados después en la instancia local. El servidor escucha únicamente en loopback; GitHub aloja el código, no ejecuta este backend mediante Pages. No publicar esta demo en Internet sin revisar seguridad, autenticación y configuración de despliegue.
