
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

module.exports = {
  importData,
};