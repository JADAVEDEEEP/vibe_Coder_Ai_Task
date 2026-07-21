const { loadData } = require("../services/import.service");

const {
    normalizeActivity,
} = require("../services/activityNormalizer");

const {
    normalizeEmployee,
} = require("../services/employeeNormalizer");

const {
    joinData,
} = require("../services/join.service");

const {
    generateDashboard,
} = require("../services/analytics.service");

const {
    saveEmployeeActivities,
} = require("../services/saveData.service");

/**
 * ============================================================
 * Dashboard Controller
 * ============================================================
 */

const getDashboard = async (req, res) => {

    try {

        // Load CSV + JSON
        const {
            activityLogs,
            employees
        } = await loadData();

        // Normalize Activity Data
        const cleanActivities =
            normalizeActivity(activityLogs);

        // Normalize Employee Data
        const cleanEmployees =
            normalizeEmployee(employees);

        // Join Data
        const {

            joinedData,

            missingEmployees,

            employeesWithoutActivity

        } = joinData(

            cleanEmployees,

            cleanActivities

        );

        /**
         * ==========================================
         * Save Clean Data into MongoDB
         * ==========================================
         */

        await saveEmployeeActivities(joinedData);

        /**
         * ==========================================
         * Generate Dashboard
         * ==========================================
         */

        const dashboard =
            generateDashboard(joinedData);

        /**
         * ==========================================
         * Send Response
         * ==========================================
         */

        res.status(200).json({

            success: true,

            dashboard,

            missingEmployees,

            employeesWithoutActivity,

            totalRecords: joinedData.length

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

module.exports = {

    getDashboard

};