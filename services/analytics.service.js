
/**
 * ============================================================
 * Recoverable Hours
 * ============================================================
 *
 * Purpose
 * -------
 * Calculate total recoverable hours from repetitive tasks.
 *
 * Formula
 * -------
 * Sum all repetitive task duration.
 *
 * Convert minutes into hours.
 *
 * @param {Array} joinedData
 * @returns {Number}
 */

const getRecoverableHours = (joinedData) => {

    // Total repetitive minutes
    let totalMinutes = 0;

    // Loop through every joined record
    joinedData.forEach((activity) => {

        // Ignore non repetitive tasks
        if (!activity.isRepetitive) {
            return;
        }

        // Add duration
        totalMinutes += activity.duration;

    });

    // Convert minutes into hours
    const recoverableHours = totalMinutes / 60;

    // Return rounded value
    return Number(recoverableHours.toFixed(2));

};

/**
 * ============================================================
 * Recoverable Money
 * ============================================================
 *
 * Purpose
 * -------
 * Estimate monthly recoverable salary cost.
 *
 * Formula
 * -------
 *
 * duration(hours)
 * ×
 * employee hourly rate
 *
 * Only repetitive work is counted.
 *
 * @param {Array} joinedData
 * @returns {Number}
 */

const getRecoverableMoney = (joinedData) => {

    // Total recoverable amount
    let totalMoney = 0;

    // Loop through activities
    joinedData.forEach((activity) => {

        // Ignore non repetitive work
        if (!activity.isRepetitive) {
            return;
        }

        // Convert minutes into hours
        const hours = activity.duration / 60;

        // Money
        totalMoney +=

            hours *

            activity.hourlyRate;

    });

    // Rounded INR value
    return Number(totalMoney.toFixed(2));

};

/**
 * ============================================================
 * Department Breakdown
 * ============================================================
 *
 * Purpose
 * -------
 * Calculate total time spent by each department.
 *
 * Example Output
 *
 * [
 *   { department: "Finance", hours: 32 },
 *   { department: "Sales", hours: 45 }
 * ]
 */

const getDepartmentBreakdown = (joinedData) => {

    // Store department totals
    const departmentMap = {};

    joinedData.forEach((activity) => {

        const department = activity.department;

        // Create department if not exists
        if (!departmentMap[department]) {

            departmentMap[department] = 0;

        }

        // Convert minutes into hours
        departmentMap[department] += activity.duration / 60;

    });

    // Convert object into array
    return Object.entries(departmentMap).map(

        ([department, hours]) => ({

            department,

            hours: Number(hours.toFixed(2))

        })

    );

};

/**
 * ============================================================
 * Task Breakdown
 * ============================================================
 *
 * Purpose
 * -------
 * Calculate hours spent on each task category.
 *
 * Example
 *
 * CRM Updates
 * Email
 * Meetings
 * Documentation
 *
 */

const getTaskBreakdown = (joinedData) => {

    // Store task totals
    const taskMap = {};

    joinedData.forEach((activity) => {

        const task = activity.taskCategory;

        if (!taskMap[task]) {

            taskMap[task] = 0;

        }

        taskMap[task] += activity.duration / 60;

    });

    return Object.entries(taskMap).map(

        ([task, hours]) => ({

            task,

            hours: Number(hours.toFixed(2))

        })

    );

};
/**
 * ============================================================
 * App Breakdown
 * ============================================================
 *
 * Purpose
 * -------
 * Calculate total hours spent in every application.
 *
 * Example
 *
 * Gmail
 * Salesforce
 * Slack
 * Excel
 *
 * Output
 *
 * [
 *   { app: "Gmail", hours: 22 },
 *   { app: "Slack", hours: 14 }
 * ]
 */

const getAppBreakdown = (joinedData) => {

    // Store app totals
    const appMap = {};

    // Loop through every activity
    joinedData.forEach((activity) => {

        const app = activity.appUsed;

        // Create app if not exists
        if (!appMap[app]) {

            appMap[app] = 0;

        }

        // Convert minutes into hours
        appMap[app] += activity.duration / 60;

    });

    // Convert object into array
    return Object.entries(appMap).map(

        ([app, hours]) => ({

            app,

            hours: Number(hours.toFixed(2))

        })

    );

};
/**
 * ============================================================
 * Automation Ranking
 * ============================================================
 *
 * Purpose
 * -------
 * Rank every task according to
 *
 * ✔ Total Hours
 * ✔ Repetitive Work
 * ✔ Cost
 *
 * Higher score
 *
 * →
 *
 * Higher automation priority.
 */

const getAutomationRanking = (joinedData) => {

    // Store task statistics
    const rankingMap = {};

    joinedData.forEach((activity) => {

        const task = activity.taskCategory;

        // Create task if not exists
        if (!rankingMap[task]) {

            rankingMap[task] = {

                task,

                totalHours: 0,

                repetitiveHours: 0,

                recoverableMoney: 0

            };

        }

        // Total task hours
        rankingMap[task].totalHours +=

            activity.duration / 60;

        // Repetitive work
        if (activity.isRepetitive) {

            const hours =

                activity.duration / 60;

            rankingMap[task].repetitiveHours +=

                hours;

            rankingMap[task].recoverableMoney +=

                hours *

                activity.hourlyRate;

        }

    });

    // Convert object into array
    const ranking = Object.values(rankingMap);

    // Sort highest recoverable money first
    ranking.sort(

        (a, b) =>

            b.recoverableMoney -

            a.recoverableMoney

    );

    return ranking;

};

/**
 * ============================================================
 * Weekly Trend
 * ============================================================
 *
 * Purpose
 * -------
 * Show total hours worked every week.
 *
 * Output
 *
 * Week 1 → 120 hrs
 * Week 2 → 138 hrs
 * Week 3 → 126 hrs
 * Week 4 → 142 hrs
 */

const getWeeklyTrend = (joinedData) => {

    const weeklyMap = {};

    joinedData.forEach((activity) => {

        // Skip invalid dates
        if (!activity.timestamp) return;

        // Get week number (1–4)
        const date = new Date(activity.timestamp);

        const week = Math.ceil(date.getDate() / 7);

        const key = `Week ${week}`;

        if (!weeklyMap[key]) {

            weeklyMap[key] = 0;

        }

        weeklyMap[key] += activity.duration / 60;

    });

    return Object.entries(weeklyMap).map(

        ([week, hours]) => ({

            week,

            hours: Number(hours.toFixed(2))

        })

    );

};
/**
 * ============================================================
 * Detect Anomalies
 * ============================================================
 *
 * Purpose
 * -------
 * Find unusual activity records.
 *
 * Current Rules
 *
 * ✔ Duration > 300 mins
 * ✔ Missing Employee
 */

const getAnomalies = (joinedData) => {

    const anomalies = [];

    joinedData.forEach((activity) => {

        if (activity.duration > 300) {

            anomalies.push({

                type: "High Duration",

                employeeId: activity.employeeId,

                duration: activity.duration,

                task: activity.taskCategory

            });

        }

        if (activity.employeeId === "Unknown") {

            anomalies.push({

                type: "Unknown Employee",

                employeeId: activity.employeeId

            });

        }

    });

    return anomalies;

}
/**
 * ============================================================
 * Generate Dashboard
 * ============================================================
 *
 * Purpose
 * -------
 * Combine all analytics into one dashboard object.
 *
 */

const generateDashboard = (joinedData) => {

    return {

        recoverableHours: getRecoverableHours(joinedData),

        recoverableMoney: getRecoverableMoney(joinedData),

        departmentBreakdown: getDepartmentBreakdown(joinedData),

        taskBreakdown: getTaskBreakdown(joinedData),

        appBreakdown: getAppBreakdown(joinedData),

        automationRanking: getAutomationRanking(joinedData),

        weeklyTrend: getWeeklyTrend(joinedData),

        anomalies: getAnomalies(joinedData)

    };

};
module.exports = {

    getRecoverableHours,

    getRecoverableMoney,

    getDepartmentBreakdown,

    getTaskBreakdown,

    getAppBreakdown,

    getAutomationRanking,

    getWeeklyTrend,

    getAnomalies,

    generateDashboard

};