const mongoose = require("mongoose");

/**
 * ============================================================
 * Employee Activity Schema
 * ============================================================
 *
 * This collection stores
 * normalized + joined records.
 *
 * Data Source
 * ----------
 * employees.json
 * +
 * activity_logs.csv
 */

const employeeActivitySchema = new mongoose.Schema(

    {

        /**
         * Employee Information
         */

        employeeId: {
            type: String,
            required: true,
            trim: true
        },

        name: {
            type: String,
            default: "Unknown"
        },

        department: {
            type: String,
            default: "Unknown"
        },

        role: {
            type: String,
            default: "Unknown"
        },

        /**
         * Activity Information
         */

        appUsed: {
            type: String,
            required: true
        },

        taskCategory: {
            type: String,
            required: true
        },

        duration: {
            type: Number,
            default: 0
        },

        isRepetitive: {
            type: Boolean,
            default: false
        },

        timestamp: {
            type: Date
        },

        /**
         * Compensation
         */

        annualSalary: {
            type: Number,
            default: 0
        },

        hourlyRate: {
            type: Number,
            default: 0
        },

        /**
         * Working Hours
         */

        workingHours: {

            start: {
                type: String
            },

            end: {
                type: String
            },

            timezone: {
                type: String,
                default: "Asia/Kolkata"
            }

        },

        /**
         * Employee Status
         */

        status: {
            type: String,
            default: "active"
        },

        terminatedOn: {
            type: Date,
            default: null
        }

    },

    {
        timestamps: true
    }

);

module.exports = mongoose.model(
    "EmployeeActivity",
    employeeActivitySchema
);