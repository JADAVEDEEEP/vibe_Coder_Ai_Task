
/**
 * Normalize Employee ID
 *
 * Why?
 * HRMS JSON me employee id do formats me hai.
 *
 * Example:
 * EmployeeID
 * employee_id
 *
 * Dashboard aur join ke liye ek hi field chahiye.
 *
 * Output:
 * employeeId
 */

const normalizeEmployeeId = (employee) => {

    // Check every possible employee id field
    const employeeId =
        employee.employee_id ||
        employee.EmployeeID;

    // If not found return Unknown
    if (!employeeId) {
        return "Unknown";
    }

    // Remove extra spaces
    return employeeId.toString().trim();

};

/**
 * Normalize Department
 *
 * Why?
 * Dataset me department do jagah hai.
 *
 * department
 * Dept
 *
 * Ek record me department missing bhi hai.
 *
 * Output:
 * Operations
 * Finance
 * Sales
 * HR
 * Marketing
 */

const normalizeDepartment = (employee) => {

    // Find department from both possible fields
    const department =
        employee.department ||
        employee.Dept;

    // Missing department
    if (!department) {
        return "Unknown";
    }

    // Remove unwanted spaces
    return department.trim();

};

/**
 * Normalize Employee Role
 *
 * Why?
 * Dataset me role 3 jagah ho sakta hai.
 *
 * role
 * Role
 * meta.role
 *
 * Hume ek standard role return karna hai.
 *
 * @param {Object} employee
 * @returns {String}
 */

const normalizeRole = (employee) => {

    // Read role from every possible location
    const role =
        employee.role ||
        employee.Role ||
        employee?.meta?.role;

    // If role is missing
    if (!role) {
        return "Unknown";
    }

    // Remove extra spaces
    return role.trim();

};

/**
 * Normalize Employee Compensation
 *
 * Dataset contains salary in multiple formats:
 *
 * salary_LPA
 * annual_ctc_inr
 * hourly_rate_inr
 * meta.compensation.annual
 *
 * We convert everything into:
 *
 * annualSalary
 * hourlyRate
 */

const normalizeCompensation = (employee) => {

    let annualSalary = 0;
    let hourlyRate = 0;

    /**
     * salary_LPA
     *
     * Example
     * 12.5
     *
     * ↓
     *
     * 1250000
     */

    if (employee.salary_LPA) {

        annualSalary =
            Number(employee.salary_LPA) * 100000;

    }

    /**
     * annual_ctc_inr
     */

    else if (employee.annual_ctc_inr) {

        annualSalary =
            Number(employee.annual_ctc_inr);

    }

    /**
     * meta.compensation.annual
     */

    else if (employee?.meta?.compensation?.annual) {

        annualSalary =
            Number(employee.meta.compensation.annual);

    }

    /**
     * Hourly Rate
     */

    if (employee.hourly_rate_inr) {

        hourlyRate =
            Number(employee.hourly_rate_inr);

    }

    /**
     * If only annual salary exists,
     * calculate hourly rate.
     *
     * Formula:
     *
     * 22 working days
     * 8 hours/day
     */

    else if (annualSalary) {

        hourlyRate =
            annualSalary / 12 / 22 / 8;

    }

    return {

        annualSalary,

        hourlyRate:
            Number(hourlyRate.toFixed(2))

    };

};

/**
 * Normalize Working Hours
 *
 * Dataset contains:
 *
 * workingHours
 * working_hours
 * meta.working_hours
 *
 * Some records contain:
 *
 * "9-18"
 *
 * Some contain:
 *
 * {
 *   start:"09:00",
 *   end:"18:00"
 * }
 */

const normalizeWorkingHours = (employee) => {

    const workingHours =

        employee.workingHours ??

        employee.working_hours ??

        employee?.meta?.working_hours ??

        "09:00-18:00";

    /**
     * If working hours are already object
     */

    if (typeof workingHours === "object") {

        return {

            start: workingHours.start,

            end: workingHours.end,

            timezone:

                workingHours.timezone ||

                "Asia/Kolkata"

        };

    }

    /**
     * String Example:
     *
     * 9-18
     */

    const [start, end] =

        workingHours.split("-");

    return {

        start: start.trim(),

        end: end.trim(),

        timezone: "Asia/Kolkata"

    };

};

/**
 * Normalize Complete Employee Dataset
 *
 * This is the final function.
 *
 * It calls every helper function
 * and returns one clean employee object.
 */

const normalizeEmployee = (employees) => {

    // Return empty array if invalid input
    if (!Array.isArray(employees)) {

        return [];

    }

    // Map to automatically remove duplicate employee IDs
    const employeeMap = new Map();

    // Process every employee
    employees.forEach((employee) => {

        // Normalize salary
        const compensation =

            normalizeCompensation(employee);

        // Store employee using employeeId as key
        employeeMap.set(

            normalizeEmployeeId(employee),

            {

                employeeId:

                    normalizeEmployeeId(employee),

                name:

                    employee.name ||

                    employee.Name ||

                    "Unknown",

                department:

                    normalizeDepartment(employee),

                role:

                    normalizeRole(employee),

                annualSalary:

                    compensation.annualSalary,

                hourlyRate:

                    compensation.hourlyRate,

                tenureMonths:

                    employee.tenure_months ||

                    employee.tenureMonths ||

                    employee?.meta?.tenure_months ||

                    0,

                workingHours:

                    normalizeWorkingHours(employee),

                status:

                    employee.status ||

                    employee.Status ||

                    "active",

                terminatedOn:

                    employee.terminated_on ||

                    null

            }

        );

    });

    /**
     * Map automatically overwrites duplicate keys.
     * So duplicate Employee E007 keeps
     * the latest record.
     */

    return [...employeeMap.values()];

};

module.exports = {
    normalizeEmployeeId,
    normalizeDepartment,
    normalizeRole,
    normalizeCompensation,
    normalizeWorkingHours,
    normalizeEmployee
};