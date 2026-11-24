const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {sql,poolPromise}=require('../config/database');
const {cookieName}=require('../middleware/authMiddleware');
const cookieOptions={httpOnly:true,sameSite:'strict',path:'/',secure:false}; // solo localhost HTTP
const text=(v)=>typeof v==='string'?v.trim():'';
const emailValido=(v)=>v.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const passwordValido=(v)=>typeof v==='string' && v.length>=10 && Buffer.byteLength(v)<=72;
function sesion(res,id){
    const token=jwt.sign({},process.env.JWT_SECRET,{algorithm:'HS256',subject:String(id),issuer:'crm-cultural',audience:'crm-local',expiresIn:'1h'});
    res.cookie(cookieName,token,{...cookieOptions,maxAge:3600000});
}
async function login(req,res){
    const correo=text(req.body?.correo).toLowerCase(), password=req.body?.password;
    if(!emailValido(correo)||typeof password!=='string'||Buffer.byteLength(password)>72) return res.status(400).json({mensaje:'Datos inválidos.'});
    try{
        const pool=await poolPromise;
        const r=await pool.request().input('correo',sql.NVarChar(254),correo).query('SELECT id_usuario,contrasena_hash,estado FROM dbo.Usuario WHERE correo=@correo');
        const u=r.recordset[0];
        if(!u||!u.estado||!(await bcrypt.compare(password,u.contrasena_hash))) return res.status(401).json({mensaje:'Correo o contraseña incorrectos.'});
        sesion(res,u.id_usuario);res.json({mensaje:'Sesión iniciada.'});
    }catch(e){console.error(e.message);res.status(500).json({mensaje:'Error al iniciar sesión.'});}
}
async function registro(req,res){
    const b=req.body||{}, nombres=text(b.nombres),apellidos=text(b.apellidos),correo=text(b.correo).toLowerCase(),telefono=text(b.telefono);
    if(!nombres||nombres.length>100||!apellidos||apellidos.length>100||!emailValido(correo)||telefono.length>20||!passwordValido(b.password))return res.status(400).json({mensaje:'Revisa los campos y la contraseña (mínimo 10 caracteres, máximo 72 bytes).'});
    let tx;
    try{
        const hash=await bcrypt.hash(b.password,12);const pool=await poolPromise;tx=new sql.Transaction(pool);await tx.begin();
        const r=await new sql.Request(tx).input('n',sql.NVarChar(100),nombres).input('a',sql.NVarChar(100),apellidos).input('c',sql.NVarChar(254),correo).input('t',sql.VarChar(20),telefono||null).input('h',sql.NVarChar(255),hash).query(`INSERT dbo.Usuario(id_rol,nombres,apellidos,correo,telefono,contrasena_hash) OUTPUT INSERTED.id_usuario VALUES ((SELECT id_rol FROM dbo.Rol WHERE nombre_rol=N'Cliente'),@n,@a,@c,@t,@h)`);
        const id=r.recordset[0].id_usuario;
        await new sql.Request(tx).input('id',sql.Int,id).query(`INSERT dbo.Cliente(id_usuario,creado_por) VALUES(@id,@id); INSERT dbo.Auditoria(id_usuario,modulo,accion) VALUES(@id,N'Cuenta',N'Registro');`);
        await tx.commit();tx=null;sesion(res,id);res.status(201).json({mensaje:'Cuenta ficticia creada.'});
    }catch(e){if(tx)try{await tx.rollback();}catch{};if([2601,2627].includes(e.number))return res.status(409).json({mensaje:'El correo ya está registrado.'});console.error(e.message);res.status(500).json({mensaje:'Error al registrar.'});}
}
async function perfil(req,res){
    const b=req.body||{},nombres=text(b.nombres),apellidos=text(b.apellidos),correo=text(b.correo).toLowerCase(),telefono=text(b.telefono);
    if(!nombres||nombres.length>100||!apellidos||apellidos.length>100||!emailValido(correo)||telefono.length>20||typeof b.actual!=='string'||Buffer.byteLength(b.actual)>72||(b.nueva&&!passwordValido(b.nueva)))return res.status(400).json({mensaje:'Revisa los datos.'});
    let tx;
    try{
        const pool=await poolPromise;tx=new sql.Transaction(pool);await tx.begin();
        const r=await new sql.Request(tx).input('id',sql.Int,req.usuario.id_usuario).query('SELECT contrasena_hash FROM dbo.Usuario WITH (UPDLOCK,ROWLOCK) WHERE id_usuario=@id AND estado=1');
        if(!r.recordset.length||!await bcrypt.compare(b.actual,r.recordset[0].contrasena_hash)){await tx.rollback();tx=null;return res.status(401).json({mensaje:'Contraseña actual incorrecta.'});}
        const hash=b.nueva?await bcrypt.hash(b.nueva,12):r.recordset[0].contrasena_hash;
        await new sql.Request(tx).input('id',sql.Int,req.usuario.id_usuario).input('n',sql.NVarChar(100),nombres).input('a',sql.NVarChar(100),apellidos).input('c',sql.NVarChar(254),correo).input('t',sql.VarChar(20),telefono||null).input('h',sql.NVarChar(255),hash).query(`UPDATE dbo.Usuario SET nombres=@n,apellidos=@a,correo=@c,telefono=@t,contrasena_hash=@h,fecha_modificacion=SYSUTCDATETIME(),modificado_por=@id WHERE id_usuario=@id; INSERT dbo.Auditoria(id_usuario,modulo,accion) VALUES(@id,N'Cuenta',N'Actualización de perfil');`);
        await tx.commit();tx=null;res.json({mensaje:'Perfil actualizado.'});
    }catch(e){if(tx)try{await tx.rollback();}catch{};if([2601,2627].includes(e.number))return res.status(409).json({mensaje:'Correo ya registrado.'});console.error(e.message);res.status(500).json({mensaje:'Error al actualizar.'});}
}
function logout(req,res){res.clearCookie(cookieName,cookieOptions);res.json({mensaje:'Sesión cerrada.'});}
module.exports={login,registro,perfil,logout};
