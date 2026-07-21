
const express = require("express");

const Airouter = express.Router();

const { askAI } = require("../controllers/ai.controller");

Airouter.post("/", askAI);

module.exports = Airouter;