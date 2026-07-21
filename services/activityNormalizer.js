const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const normalizeTimestamp = (timestamp) => {
    if (
        timestamp === null ||
        timestamp === undefined ||
        ["", "-", "na", "n/a", "unknown"].includes(timestamp.toString().trim().toLowerCase())
    ) {
        return null;
    }

    const normalizedTimestamp = timestamp.toString().trim();

    const formats = [
        "YYYY-MM-DD HH:mm:ss",
        "YYYY-MM-DD HH:mm",
        "DD/MM/YYYY HH:mm",
        "DD/MM/YYYY HH:mm:ss",
        "YYYY/MM/DD HH:mm:ss",
        "YYYY/MM/DD HH:mm"
    ];

    for (const format of formats) {
        const parsed = dayjs(normalizedTimestamp, format, true);

        if (parsed.isValid()) {
            return parsed.toDate();
        }
    }

    return null;
};
/**
 * Normalize duration value from CSV.
 *
 * Why?
 * CSV me duration string, negative, blank ya invalid ho sakti hai.
 * Dashboard aur analytics ke liye hume hamesha valid positive number chahiye.
 *
 * Rules:
 * - Blank / null / invalid => 0
 * - Negative => Positive (absolute value)
 * - Positive => Same value
 *
 * @param {string | number} duration - Raw duration from CSV
 * @returns {number} Normalized duration in minutes
 */
const normalizeDuration = (duration) => {

    if (
        duration === null ||
        duration === undefined ||
        ["", "-", "na", "n/a", "unknown"].includes(duration.toString().trim().toLowerCase())
    ) {
        return 0;
    }

    // Convert incoming value to a number
    const value = Number(duration);

    // If conversion fails (NaN), return default value
    if (isNaN(value)) {
        return 0;
    }

    // If duration is negative, convert it to positive
    if (value < 0) {
        return Math.abs(value);
    }

    // Valid positive duration
    return value;
};

/**
 * Normalize different boolean values from the CSV.
 *
 * Why?
 * CSV me boolean values consistent nahi hoti.
 * Example:
 * TRUE, true, True, YES, yes, 1, Y
 * FALSE, false, No, 0, "", null, NA
 *
 * Dashboard aur AI ko sirf JavaScript boolean (true/false) chahiye.
 *
 * Rules:
 * - true values  => true
 * - everything else => false
 *
 * @param {string | number | boolean} value
 * @returns {boolean}
 */
const normalizeBoolean = (value) => {

    // If value is null, undefined or empty
    if (
        value === null ||
        value === undefined ||
        ["", "-", "na", "n/a", "unknown"].includes(value.toString().trim().toLowerCase())
    ) {
        return false;
    }

    // Convert value into lowercase string
    // Example:
    // " YES " -> "yes"
    // "TRUE"  -> "true"
    const normalizedValue = value
        .toString()
        .trim()
        .toLowerCase();

    // List of values that should be considered TRUE
    const trueValues = [
        "true",
        "1",
        "yes",
        "y"
    ];

    // Check whether normalized value exists in trueValues array
    return trueValues.includes(normalizedValue);
};

/**
 * Normalize application names from activity logs.
 *
 * Why?
 * Real-world data me same application alag-alag naam se likhi hoti hai.
 *
 * Example:
 * " Gmail "
 * "gmail"
 * "GMAIL"
 * "Google Mail"
 *
 * Dashboard me ye sab alag categories nahi banne chahiye.
 * Hume inhe ek hi canonical naam me convert karna hai.
 *
 * Rules:
 * - Remove extra spaces
 * - Convert to lowercase
 * - Replace known aliases with one standard name
 * - Unknown apps ko Title Case me return karo
 *
 * @param {string} app
 * @returns {string}
 */
const normalizeApp = (app) => {

    // Return "Unknown" if app name is missing
    if (
        app === null ||
        app === undefined ||
        ["", "-", "na", "n/a", "unknown"].includes(app.toString().trim().toLowerCase())
    ) {
        return "Unknown";
    }

    // Remove extra spaces and convert to lowercase
    const normalizedValue = app
        .toString()
        .trim()
        .toLowerCase();

    /**
     * Mapping Object
     *
     * Key   -> Dirty value
     * Value -> Standard value shown on dashboard
     */
    const appMapping = {

        // Gmail
        "gmail": "Gmail",
        "google mail": "Gmail",

        // Salesforce
        "salesforce": "Salesforce",
        "sales force": "Salesforce",
        "sfdc": "Salesforce",

        // Slack
        "slack": "Slack",

        // Excel
        "excel": "Excel",
        "ms excel": "Excel",
        "microsoft excel": "Excel",

        // Outlook
        "outlook": "Outlook",
        "ms outlook": "Outlook",
        "microsoft outlook": "Outlook",

        // Jira
        "jira": "Jira",

        // Notion
        "notion": "Notion",

        // Chrome
        "chrome": "Chrome",
        "google chrome": "Chrome",

        // PowerPoint
        "powerpoint": "PowerPoint",
        "power point": "PowerPoint",
        "ppt": "PowerPoint",
        "ms powerpoint": "PowerPoint",
        "ms power point": "PowerPoint",
        "microsoft powerpoint": "PowerPoint",
        "microsoft power point": "PowerPoint",

        // Word
        "word": "Word",
        "ms word": "Word",
        "microsoft word": "Word",

        // Zoho
        "zoho": "Zoho",
        "zoho crm": "Zoho",

        // WhatsApp
        "whatsapp": "WhatsApp",
        "whatsapp web": "WhatsApp",

        // Tally
        "tally": "Tally",
        "tally erp": "Tally"
    };

    // Return mapped value if found
    if (appMapping[normalizedValue]) {
        return appMapping[normalizedValue];
    }

    /**
     * If app is unknown,
     * convert first letter to uppercase.
     *
     * Example:
     * zoom -> Zoom
     * figma -> Figma
     */
    return normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1);
};

/**
 * Normalize task category names from activity logs.
 *
 * Why?
 * Same task ko employees different names se log kar sakte hain.
 *
 * Example:
 * "crm"
 * "CRM"
 * "crm update"
 * "CRM Updates"
 *
 * Agar normalize nahi karenge to dashboard me
 * alag-alag task categories ban jayengi.
 *
 * Rules:
 * - Remove extra spaces
 * - Convert to lowercase
 * - Map known aliases to one standard name
 * - Missing task => "Unknown"
 * - Unknown task => Title Case
 *
 * @param {string} task
 * @returns {string}
 */
const normalizeTask = (task) => {

    // Return default value if task is empty
    if (
        task === null ||
        task === undefined ||
        ["", "-", "na", "n/a", "unknown"].includes(task.toString().trim().toLowerCase())
    ) {
        return "Unknown";
    }

    // Remove extra spaces and convert into lowercase
    const normalizedValue = task
        .toString()
        .trim()
        .toLowerCase();

    /**
     * Task Mapping
     *
     * Key   -> Dirty Value
     * Value -> Standard Dashboard Value
     */
    const taskMapping = {

        // CRM
        "crm": "CRM Updates",
        "crm update": "CRM Updates",
        "crm updates": "CRM Updates",

        // Email
        "email": "Email Triage",
        "email triage": "Email Triage",

        // Documentation
        "documentation": "Documentation",
        "docs": "Documentation",

        // Meetings
        "meeting": "Meeting",
        "meetings": "Meeting",
        "internal meeting": "Meeting",

        // Reporting
        "report": "Reporting",
        "reporting": "Reporting",

        // Customer Support
        "support": "Customer Support",
        "customer support": "Customer Support",

        // Data Entry
        "data-entry": "Data Entry",
        "data entry": "Data Entry",

        // Follow Ups
        "follow up": "Follow Ups",
        "follow ups": "Follow Ups",

        // Lead Entry
        "lead-entry": "Lead Entry",
        "lead entry": "Lead Entry",

        // Calendar Management
        "calendar mgmt": "Calendar Management",
        "calendar management": "Calendar Management",
        "cal mgmt": "Calendar Management",

        // Client Communication
        "client communication": "Client Communication",
        "client comms": "Client Communication",

        // Reconciliation
        "recon": "Reconciliation",
        "reconciliation": "Reconciliation",

        // Vendor Portal
        "vendor portals": "Vendor Portal",
        "vendor portal": "Vendor Portal",

        // Status Updates
        "status updates": "Status Updates",
        "status update": "Status Updates",

        // Internal Communication
        "internal comms": "Internal Communication",
        "internal communication": "Internal Communication",

        // Vendor Management
        "vendor mgmt": "Vendor Management",
        "vendor management": "Vendor Management",

        // Invoice Processing
        "invoice proc": "Invoice Processing",
        "invoice processing": "Invoice Processing",

        // Document Drafting
        "doc drafting": "Document Drafting",
        "document drafting": "Document Drafting"

    };

    // Return mapped task if available
    if (taskMapping[normalizedValue]) {
        return taskMapping[normalizedValue];
    }

    /**
     * Unknown task
     * Convert first letter into uppercase.
     *
     * Example:
     * planning -> Planning
     */
    return normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1);

};

/**
 * Normalize complete activity dataset.
 *
 * Why?
 * Raw CSV data dashboard me direct use nahi ho sakta.
 * Har record ko clean aur standard format me convert karna zaroori hai.
 *
 * This function:
 * - Renames fields
 * - Normalizes timestamp
 * - Normalizes duration
 * - Normalizes boolean
 * - Normalizes app names
 * - Normalizes task categories
 *
 * @param {Array} activities - Raw activity logs from CSV
 * @returns {Array} Clean activity dataset
 */
const normalizeActivity = (activities) => {

    // Return empty array if no activity records found
    if (!Array.isArray(activities)) {
        return [];
    }

    // Convert every raw activity into clean object
    return activities.map((activity) => {

        return {

            /**
             * Employee ID
             * Remove extra spaces.
             *
             * Example:
             * " E001 "
             * ↓
             * "E001"
             */
            employeeId: activity.employee_id?.toString().trim() || "Unknown",

            /**
             * Department
             */
            department: activity.department?.toString().trim() || "Unknown",

            /**
             * Normalize timestamp
             */
            timestamp: normalizeTimestamp(activity.timestamp),

            /**
             * Normalize application name
             */
            appUsed: normalizeApp(activity.app_used),

            /**
             * Normalize task category
             */
            taskCategory: normalizeTask(activity.task_category),

            /**
             * Normalize duration
             */
            duration: normalizeDuration(activity.duration_minutes),

            /**
             * Normalize repetitive flag
             */
            isRepetitive: normalizeBoolean(activity.is_repetitive)

        };

    });

};

module.exports = {
    normalizeTimestamp,
    normalizeDuration,
    normalizeBoolean,
    normalizeApp,
    normalizeTask,
    normalizeActivity
};
