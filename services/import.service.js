const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");

const activityLogsPath = path.join(__dirname, "../data/activity_logs.csv");
const employeesPath = path.join(__dirname, "../data/employees.json");

const readCsvFile = (filePath) =>
  new Promise((resolve) => {
    const rows = [];

    fs.createReadStream(filePath)
      .on("error", (error) => {
        console.warn(`Unable to read CSV file at ${filePath}: ${error.message}`);
        resolve([]);
      })
      .pipe(csvParser())
      .on("data", (row) => {
        rows.push(row);
      })
      .on("end", () => {
        resolve(rows);
      })
      .on("error", (error) => {
        console.warn(`Unable to parse CSV file at ${filePath}: ${error.message}`);
        resolve([]);
      });
  });

const readJsonFile = async (filePath) => {
  try {
    const fileContent = await fs.promises.readFile(filePath, "utf8");
    const data = JSON.parse(fileContent);

    if (Array.isArray(data.employees)) {
      return data.employees;
    }

    if (!Array.isArray(data)) {
      console.warn(`JSON file at ${filePath} did not contain an array.`);
      return [];
    }

    return data;
  } catch (error) {
    console.warn(`Unable to read JSON file at ${filePath}: ${error.message}`);
    return [];
  }
};

const loadData = async () => {
  const [activityLogs, employees] = await Promise.all([
    readCsvFile(activityLogsPath),
    readJsonFile(employeesPath),
  ]);

  return {
    activityLogs,
    employees,
  };
};

module.exports = {
  loadData,
};
