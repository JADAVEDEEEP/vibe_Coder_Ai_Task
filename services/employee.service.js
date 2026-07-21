/**
 * ============================================================
 * Employee Service
 * ============================================================
 *
 * Purpose
 * -------
 * Provide employee drill-down data.
 *
 */

const getEmployeeById = (joinedData, employeeId) => {

    return joinedData.filter(

        (activity) => activity.employeeId === employeeId

    );

};

/**
 * ============================================================
 * Employee Summary
 * ============================================================
 */

const getEmployeeSummary = (employeeActivities) => {

    if (!employeeActivities.length) {

        return null;

    }

    const employee = employeeActivities[0];

    const totalMinutes = employeeActivities.reduce(

        (sum, activity) =>

            sum + activity.duration,

        0

    );

    const repetitiveMinutes = employeeActivities.reduce(

        (sum, activity) =>

            activity.isRepetitive

                ? sum + activity.duration

                : sum,

        0

    );

    return {

        employeeId: employee.employeeId,

        name: employee.name,

        department: employee.department,

        role: employee.role,

        hourlyRate: employee.hourlyRate,

        totalHours: Number((totalMinutes / 60).toFixed(2)),

        repetitiveHours: Number((repetitiveMinutes / 60).toFixed(2))

    };

};

/**
 * ============================================================
 * Top Tasks
 * ============================================================
 */

const getTopTasks = (employeeActivities) => {

    const taskMap = {};

    employeeActivities.forEach((activity) => {

        const task = activity.taskCategory;

        if (!taskMap[task]) {

            taskMap[task] = 0;

        }

        taskMap[task] += activity.duration;

    });

    return Object.entries(taskMap)

        .map(

            ([task, minutes]) => ({

                task,

                hours: Number((minutes / 60).toFixed(2))

            })

        )

        .sort(

            (a, b) => b.hours - a.hours

        );

};

/**
 * ============================================================
 * Top Repetitive Tasks
 * ============================================================
 */

const getTopRepetitiveTasks = (employeeActivities) => {

    return getTopTasks(

        employeeActivities.filter(

            (activity) => activity.isRepetitive

        )

    );

};

/**
 * ============================================================
 * Peer Comparison
 * ============================================================
 */

const getPeerComparison = (

    joinedData,

    employeeActivities

) => {

    if (!employeeActivities.length) {

        return {

            employeeHours: 0,

            peerAverageHours: 0,

            employeeRepetitiveHours: 0,

            peerAverageRepetitiveHours: 0,

            sameRoleEmployees: 0,

            employeeRank: 0

        };

    }

    const currentEmployeeId = employeeActivities[0].employeeId;

    const role = employeeActivities[0].role?.toString().trim().toLowerCase();

    const employeeMap = {};

    joinedData.forEach((activity) => {

        const activityRole = activity.role?.toString().trim().toLowerCase();

        if (activityRole !== role) {

            return;

        }

        if (!employeeMap[activity.employeeId]) {

            employeeMap[activity.employeeId] = {

                employeeId: activity.employeeId,

                totalMinutes: 0,

                repetitiveMinutes: 0

            };

        }

        const duration = Number(activity.duration) || 0;

        employeeMap[activity.employeeId].totalMinutes += duration;

        if (activity.isRepetitive) {

            employeeMap[activity.employeeId].repetitiveMinutes += duration;

        }

    });

    const peers = Object.values(employeeMap);

    if (!peers.length) {

        return {

            employeeHours: 0,

            peerAverageHours: 0,

            employeeRepetitiveHours: 0,

            peerAverageRepetitiveHours: 0,

            sameRoleEmployees: 0,

            employeeRank: 0

        };

    }

    const totalMinutes = peers.reduce(

        (sum, employee) => sum + employee.totalMinutes,

        0

    );

    const repetitiveMinutes = peers.reduce(

        (sum, employee) => sum + employee.repetitiveMinutes,

        0

    );

    const currentEmployee = employeeMap[currentEmployeeId] || {

        totalMinutes: 0,

        repetitiveMinutes: 0

    };

    const rankedEmployees = [...peers].sort(

        (a, b) => b.totalMinutes - a.totalMinutes

    );

    const employeeRank = rankedEmployees.findIndex(

        (employee) => employee.employeeId === currentEmployeeId

    ) + 1;

    return {

        employeeHours: Number((currentEmployee.totalMinutes / 60).toFixed(2)),

        peerAverageHours: Number(((totalMinutes / peers.length) / 60).toFixed(2)),

        employeeRepetitiveHours: Number((currentEmployee.repetitiveMinutes / 60).toFixed(2)),

        peerAverageRepetitiveHours: Number(((repetitiveMinutes / peers.length) / 60).toFixed(2)),

        sameRoleEmployees: peers.length,

        employeeRank

    };

};

module.exports = {

    getEmployeeById,

    getEmployeeSummary,

    getTopTasks,

    getTopRepetitiveTasks,

    getPeerComparison

};
