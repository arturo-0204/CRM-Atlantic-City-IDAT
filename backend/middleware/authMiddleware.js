const jwt = require('jsonwebtoken');
const {sql,poolPromise} = require('../config/database');
const cookieName = 'crm_session';
function cookieToken(req) {
    return (req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);
}
async function autenticar(req,res,next) {
    let id;
    try {
        const payload = jwt.verify(cookieToken(req),process.env.JWT_SECRET,{algorithms:['HS256'],issuer:'crm-cultural',audience:'crm-local'});
        id = Number(payload.sub);
        if (!Number.isSafeInteger(id) || id < 1) throw Error('id');
    } catch { return res.status(401).json({mensaje:'Inicia sesión nuevamente.'}); }
    try {
        const pool = await poolPromise;
        const r = await pool.request().input('id',sql.Int,id).query(`SELECT u.id_usuario,u.nombres,u.apellidos,u.correo,u.telefono,r.nombre_rol FROM dbo.Usuario u JOIN dbo.Rol r ON r.id_rol=u.id_rol WHERE u.id_usuario=@id AND u.estado=1`);
        if (!r.recordset.length) return res.status(401).json({mensaje:'Cuenta no disponible.'});
        req.usuario=r.recordset[0]; next();
    } catch(e) {console.error(e.message);res.status(500).json({mensaje:'Error de autenticación.'});}
}
function administrador(req,res,next) {
    if(req.usuario.nombre_rol !== 'Administrador') return res.status(403).json({mensaje:'Acceso restringido.'});
    next();
}
module.exports={autenticar,administrador,cookieName};
