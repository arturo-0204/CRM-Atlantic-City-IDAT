const { poolPromise } = require("../config/database");

// Obtener los usuarios registrados
const obtenerUsuarios = async (req, res) => {
    try {
        const pool = await poolPromise;

        const resultado = await pool.request().query(`
            SELECT
                u.id_usuario,
                u.nombres,
                u.apellidos,
                r.nombre_rol,
                u.estado,
                u.fecha_registro
            FROM dbo.Usuario u
            INNER JOIN dbo.Rol r
                ON u.id_rol = r.id_rol
            ORDER BY u.id_usuario
        `);

        res.json(resultado.recordset);

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            mensaje: "Error al obtener los usuarios"
        });
    }
};

module.exports = {
    obtenerUsuarios
};