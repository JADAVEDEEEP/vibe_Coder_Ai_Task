const express = require("express");

const employeeRoutes = express.Router();

const {

    getEmployeeDetails

} = require("../controllers/employee.controller");

employeeRoutes.get("/:employeeId", getEmployeeDetails);

module.exports = employeeRoutes;