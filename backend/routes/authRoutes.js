const router=require('express').Router();
const c=require('../controllers/authController');
const {autenticar}=require('../middleware/authMiddleware');
// Límite simple de intentos para esta demo local.
let intentos=[];
function limitar(req,res,next){const ahora=Date.now();intentos=intentos.filter(t=>ahora-t<60000);if(intentos.length>=20)return res.status(429).json({mensaje:'Demasiadas solicitudes. Intenta en un minuto.'});intentos.push(ahora);next();}
router.post('/login',limitar,c.login);
router.post('/registro',limitar,c.registro);
router.get('/me',autenticar,(req,res)=>res.json(req.usuario));
router.patch('/perfil',autenticar,limitar,c.perfil);
router.post('/logout',c.logout);
module.exports=router;
