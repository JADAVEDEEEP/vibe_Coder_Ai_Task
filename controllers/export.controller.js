const {
    normalizeActivity
} = require("../services/activityNormalizer");

const {
    normalizeEmployee
} = require("../services/employeeNormalizer");

const {
    joinData
} = require("../services/join.service");

const {
    generateDashboard
} = require("../services/analytics.service");

const {
    exportDashboardPDF
} = require("../services/export.service");
const { loadData } = require("../services/import.service");

const importData = async (req, res) => {
  try {
    const { activityLogs, employees } = await loadData();

    res.status(200).json({
      success: true,
      message: "Files loaded successfully",
      activityRows: activityLogs.length,
      employeeRows: employees.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const exportPDF = async (req, res) => {

    try {

        const {

            activityLogs,

            employees

        } = await loadData();

        // Normalize Activities
        const cleanActivities =
            normalizeActivity(activityLogs);

        // Normalize Employees
        const cleanEmployees =
            normalizeEmployee(employees);

        // Join Data
        const {

            joinedData

        } = joinData(

            cleanEmployees,

            cleanActivities

        );

        // Generate Dashboard
        const dashboard =
            generateDashboard(joinedData);

        // Export PDF
        exportDashboardPDF(

            dashboard,

            res

        );

    }

    catch (error) {

        console.error(

            "Export PDF Error:",

            error.message

        );

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

module.exports = {
  importData,
    exportPDF
};