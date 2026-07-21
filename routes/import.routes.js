
const express = require("express");
const importrouter = express.Router();

const { importData } = require("../controllers/import.controller");

importrouter.get("/", importData);

module.exports = importrouter