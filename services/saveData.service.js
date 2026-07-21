const EmployeeActivity = require("../models/EmployeeActivity");

/**
 * ============================================================
 * Save Employee Activities
 * ============================================================
 *
 * Purpose
 * -------
 * Save normalized + joined employee activity
 * data into MongoDB.
 *
 */

const saveEmployeeActivities = async (joinedData) => {

    try {

        // Validate Input
        if (!Array.isArray(joinedData)) {

            throw new Error("Invalid joined dataset.");

        }

        /**
         * Remove old records
         */

        await EmployeeActivity.deleteMany({});

        /**
         * Insert fresh records
         */

        const savedData = await EmployeeActivity.insertMany(joinedData);

        return {

            success: true,

            totalRecords: savedData.length,

            data: savedData

        };

    }

    catch (error) {

        console.error(

            "Save Data Error:",

            error.message

        );

        throw error;

    }

};

module.exports = {

    saveEmployeeActivities

};