require("dotenv").config();

const express = require("express");
const path = require("path");
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) { console.error("Configura JWT_SECRET en .env"); process.exit(1); }
const { poolPromise } = require("./config/database");

const usuariosRoutes = require("./routes/usuariosRoutes");


const app = express();

// Permitir recibir datos en formato JSON
app.use(express.json({limit:'16kb'}));
app.use('/api', (req,res,next)=>{
    res.set('Cache-Control','no-store');
    if (!['GET','HEAD','OPTIONS'].includes(req.method)) {
        const origin=req.get('origin');
        const port=process.env.PORT||3000;
        if (origin && ![`http://localhost:${port}`,`http://127.0.0.1:${port}`].includes(origin)) return res.status(403).json({mensaje:'Origen no permitido.'});
    }
    next();
});
app.use('/api/auth',require('./routes/authRoutes'));
app.use('/api/crm',require('./routes/crmRoutes'));
app.use(express.static(path.join(__dirname,'../public')));

// Rutas de usuarios
app.use("/api/usuarios", usuariosRoutes);

// Ruta de comprobación del servidor
app.get("/api", (req, res) => {
    res.json({
        mensaje: "Servidor CRM funcionando correctamente"
    });
});

// Ruta de comprobación de SQL Server
app.get("/api/database", async (req, res) => {
    try {
        const pool = await poolPromise;

        const resultado = await pool.request()
            .query("SELECT DB_NAME() AS base_datos");

        res.json({
            mensaje: "Conexión exitosa con SQL Server",
            base_datos: resultado.recordset[0].base_datos
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            mensaje: "Error de conexión con SQL Server"
        });
    }
});

// Puerto del servidor
const PORT = process.env.PORT || 3000;

// Iniciar el servidor después de conectar SQL Server
poolPromise.then(() => {
    app.listen(PORT, "127.0.0.1", () => {
        console.log(`Servidor iniciado en http://localhost:${PORT}`);
    });
}).catch(() => {
    process.exit(1);
});