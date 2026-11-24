require('dotenv').config();
const bcrypt=require('bcryptjs');
const {sql,poolPromise}=require('./config/database');
(async()=>{let pool;try{pool=await poolPromise;const hash=await bcrypt.hash('Demo2026!Local',12);const r=await pool.request().input('hash',sql.NVarChar(255),hash).query(`UPDATE dbo.Usuario SET contrasena_hash=@hash WHERE correo IN (N'admin@example.test',N'ana@example.test',N'luis@example.test',N'elena@example.test') AND contrasena_hash=N'NO_VALIDO_DEMO' AND apellidos=N'Demo'`);console.log('Usuarios ficticios preparados:',r.rowsAffected[0]);}catch(e){console.error(e.message);process.exitCode=1;}finally{if(pool)await pool.close();}})();
