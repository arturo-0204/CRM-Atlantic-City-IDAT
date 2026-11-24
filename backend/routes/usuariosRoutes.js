const express = require("express");
const router = express.Router();

const {
    obtenerUsuarios
} = require("../controllers/usuariosController");

// Consultar todos los usuarios ficticios
const { autenticar, administrador } = require("../middleware/authMiddleware");
router.get("/", autenticar, administrador, obtenerUsuarios);

module.exports = router;