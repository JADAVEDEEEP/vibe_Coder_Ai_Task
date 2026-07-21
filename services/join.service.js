
/**
 * ============================================================
 * JOIN SERVICE
 * ============================================================
 *
 * Purpose
 * -------
 * Join normalized employees and normalized activity logs.
 *
 * This file is responsible for:
 *
 * ✔ Employee lookup
 * ✔ Missing employee detection
 * ✔ Extra employee detection
 * ✔ Final joined dataset
 *
 */

/**
 * Create Employee Map
 *
 * Why?
 * Every activity contains employeeId.
 *
 * Instead of looping every employee again and again,
 * we create a Map.
 *
 * Example
 *
 * E001 -> Employee Object
 * E002 -> Employee Object
 *
 * Searching becomes O(1)
 */

const createEmployeeMap = (employees) => {

    // Empty Map
    const employeeMap = new Map();

    // Loop through every employee
    employees.forEach((employee) => {

        employeeMap.set(

            employee.employeeId,

            employee

        );

    });

    return employeeMap;

};

/**
 * Join Employees with Activities
 *
 * Every activity should contain
 * complete employee information.
 *
 * Example
 *
 * Activity
 *
 * +
 *
 * Employee
 *
 * =
 *
 * Joined Record
 */

const joinEmployeeActivity = (

    employees,

    activities

) => {

    // Create lookup map

    const employeeMap =

        createEmployeeMap(employees);

    // Final joined data

    const joinedData = [];

    // Unknown Employees

    const missingEmployeeSet = new Set();

    // Loop every activity

    activities.forEach((activity) => {

        // Search employee

        const employee =

            employeeMap.get(activity.employeeId);

        /**
         * Employee not found
         */

        if (!employee) {

            missingEmployeeSet.add(

                activity.employeeId

            );

            return;

        }

        /**
         * Merge both objects
         */

        joinedData.push({

            ...activity,

            ...employee

        });

    });

    return {

        joinedData,

        missingEmployees: Array.from(missingEmployeeSet)

    };

};

/**
 * Find Employees Without Activity
 *
 * Why?
 * Assignment specifically asks:
 *
 * "Show metadata records with no activity."
 *
 * We compare:
 *
 * Employee List
 * VS
 * Activity List
 *
 * Employees present in HRMS but missing
 * from activity logs are returned.
 */

const findEmployeesWithoutActivity = (

    employees,

    activities

) => {

    // Store all employee IDs found in activities
    const activityEmployeeIds = new Set();

    activities.forEach((activity) => {

        activityEmployeeIds.add(activity.employeeId);

    });

    // Employees without activities
    const employeesWithoutActivity = [];

    employees.forEach((employee) => {

        if (!activityEmployeeIds.has(employee.employeeId)) {

            employeesWithoutActivity.push(employee);

        }

    });

    return employeesWithoutActivity;

};
/**
 * Main Join Function
 *
 * This is the only function
 * controller will call.
 *
 * Flow
 *
 * Employees
 * +
 * Activities
 *
 * ↓
 *
 * Joined Dataset
 *
 * ↓
 *
 * Missing Employees
 *
 * ↓
 *
 * Employees Without Activity
 */

const joinData = (

    employees,

    activities

) => {

    // Join employee + activity

    const {

        joinedData,

        missingEmployees

    } = joinEmployeeActivity(

        employees,

        activities

    );

    // Find employees having no activity

    const employeesWithoutActivity =

        findEmployeesWithoutActivity(

            employees,

            activities

        );

    return {

        joinedData,

        missingEmployees,

        employeesWithoutActivity

    };

};
module.exports = {

    createEmployeeMap,

    joinEmployeeActivity,

    findEmployeesWithoutActivity,

    joinData

};
