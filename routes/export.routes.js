const express = require("express");

const exportrouter = express.Router();

const {

    exportPDF

} = require("../controllers/export.controller");

exportrouter.get("/pdf", exportPDF);

module.exports = exportrouter;
