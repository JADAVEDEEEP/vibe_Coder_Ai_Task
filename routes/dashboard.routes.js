
const express = require("express");

const Ddashboardrouter = express.Router();

const {

    getDashboard

} = require("../controllers/dashboard.controller");

Ddashboardrouter.get("/", getDashboard);

module.exports = Ddashboardrouter;