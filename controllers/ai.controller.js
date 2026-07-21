
const { askAI: askAIService } = require("../services/ai.service");

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

const askAI = async (req, res) => {

    try {

        const { question } = req.body;

        const {

            activityLogs,

            employees

        } = await loadData();

        const cleanActivities = normalizeActivity(activityLogs);

        const cleanEmployees = normalizeEmployee(employees);

        const { joinedData } = joinData(

            cleanEmployees,

            cleanActivities

        );

        const dashboard = generateDashboard(joinedData);

        const answer = await askAIService(

            dashboard,

            question

        );

        res.json({

            success: true,

            answer

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

module.exports = {

    askAI

};
