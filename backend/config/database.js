

const sql = require("mssql");

// Configuración de SQL Server
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT),

    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

// Conexión a la base de datos
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log("Conexión exitosa con SQL Server");
        return pool;
    })
    .catch(error => {
        console.error("Error de conexión:", error.message);
        throw error;
    });

module.exports = {
    sql,
    poolPromise
};