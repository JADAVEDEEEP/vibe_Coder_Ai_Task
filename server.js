require("dotenv").config();

const express = require("express");
const cors = require("cors");
const dashboardRoutes = require("./routes/dashboard.routes");
const connectDB = require("./config/db");
const importRoutes = require("./routes/import.routes");
const Airouter = require("./routes/ai.routes");
const employeeRoutes = require("./routes/employee.routes");
const exportrouter = require("./routes/export.routes");

require("dotenv").config();
const app = express();
connectDB()
app.use(cors());
app.use(express.json());

app.use("/api/import", importRoutes);
app.use("/api/dashboard", dashboardRoutes);         
app.use("/api/ai", Airouter);
app.use("/api/employees", employeeRoutes);
app.use("/api/export", exportrouter);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});