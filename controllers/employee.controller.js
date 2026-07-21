const { loadData } = require("../services/import.service");

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

    getEmployeeById,

    getEmployeeSummary,

    getTopTasks,

    getTopRepetitiveTasks,

    getPeerComparison

} = require("../services/employee.service");

const getEmployeeDetails = async (req, res) => {

    try {

        const { employeeId } = req.params;

        const {

            activityLogs,

            employees

        } = await loadData();

        const cleanActivities =

            normalizeActivity(activityLogs);

        const cleanEmployees =

            normalizeEmployee(employees);

        const { joinedData } =

            joinData(

                cleanEmployees,

                cleanActivities

            );

        const employeeActivities =

            getEmployeeById(

                joinedData,

                employeeId

            );

        if (!employeeActivities.length) {

            return res.status(404).json({

                success: false,

                message: "Employee not found."

            });

        }

        res.json({

            success: true,

            summary:

                getEmployeeSummary(

                    employeeActivities

                ),

            topTasks:

                getTopTasks(

                    employeeActivities

                ),

            topRepetitiveTasks:

                getTopRepetitiveTasks(

                    employeeActivities

                ),

            peerComparison:

                getPeerComparison(

                    joinedData,

                    employeeActivities

                )

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

module.exports = {

    getEmployeeDetails

};