# Workforce Analytics Dashboard

## Project Overview

I built Workforce Analytics Dashboard as an AI-powered analytics platform to help organizations understand how employee time is spent across applications, tasks, departments, and repetitive workflows.

The business problem I focused on is that workforce activity data usually arrives as disconnected CSV and JSON exports. In this project, the raw data contains inconsistent naming, missing values, duplicate categories, and no direct path to automation insight. I designed the backend to convert that raw operational data into clean, joined, auditable, and analytics-ready information.

Expected users include operations teams, business leaders, HR analysts, automation consultants, and managers who need clear visibility into employee productivity, repetitive work, recoverable time, and cost-saving opportunities.

The business value of the system is to support better decision making through:

- Workforce activity visibility
- Automation opportunity discovery
- Recoverable hours and cost estimation
- Department, task, and application-level breakdowns
- Employee drill-down analytics
- AI-powered workforce insights using Google Gemini
- PDF report generation for sharing analysis

## Backend Execution Flow

```text
CSV Import
    |
    v
JSON Import
    |
    v
Activity Normalization
    |
    v
Employee Normalization
    |
    v
Join Service
    |
    v
MongoDB Storage
    |
    v
Analytics Service
    |
    v
Dashboard API
    |
    v
Employee Drilldown
    |
    v
Gemini AI Analysis
    |
    v
PDF Export
```

### CSV Import

The backend reads activity records from `data/activity_logs.csv` using `csv-parser`. These records contain employee activity logs such as application usage, task category, duration, timestamp, and repetitive-work flags.

### JSON Import

The backend reads employee master data from `data/employees.json`. This file provides employee metadata such as employee ID, name, department, role, salary, working hours, and status.

### Activity Normalization

Raw activity rows are cleaned and standardized in `activityNormalizer.js`. This stage handles inconsistent timestamps, negative or invalid durations, boolean values, application aliases, task aliases, missing values, casing differences, and extra spaces.

### Employee Normalization

Employee records are normalized in `employeeNormalizer.js`. This prepares employee metadata for consistent joining and analytics by standardizing identifiers, compensation fields, working-hour information, and status-related values.

### Join Service

`join.service.js` combines normalized activity logs with normalized employee records using employee IDs. It produces joined analytics records, detects missing employees, and identifies employees that exist in metadata but have no activity.

### MongoDB Storage

The joined records are saved into MongoDB using the `EmployeeActivity` model. This creates a persistent normalized dataset for backend analytics and future reporting workflows.

### Analytics Service

`analytics.service.js` generates business metrics such as recoverable hours, recoverable money, department breakdown, task breakdown, application breakdown, automation ranking, weekly trend, and anomaly detection.

### Dashboard API

The dashboard API exposes the generated analytics as JSON for the React dashboard. It returns dashboard metrics, missing employees, employees without activity, and total processed records.

### Employee Drilldown

The employee drill-down endpoint provides employee-level summary analytics, top tasks, repetitive tasks, and peer comparison for a selected employee.

### Gemini AI Analysis

The AI workflow sends dashboard data and the user question to Google Gemini through a controlled prompt. The AI response is grounded only in the generated dashboard data.

### PDF Export

The PDF export service uses PDFKit to generate a report from dashboard analytics, allowing the insights to be shared outside the application.

## Project Architecture

The backend follows an Express MVC and service-oriented architecture.

```text
Routes
    |
    v
Controllers
    |
    v
Services
    |
    v
Models
    |
    v
MongoDB
```

### Routes

Routes define the public API endpoints and forward requests to the correct controller.

### Controllers

Controllers manage request and response handling. They coordinate service calls but avoid embedding business logic directly.

### Services

Services contain the main business logic, including importing, normalization, joining, analytics, AI prompt handling, persistence, employee drill-down, and export generation.

### Models

Models define the MongoDB schema used to persist normalized and joined employee activity records.

### MongoDB

MongoDB stores the cleaned and joined workforce activity dataset through Mongoose.

I kept this separation of concerns intentionally so the project remains readable, scalable, testable, and easier to maintain as new features are added.

# Architecture Decisions

I selected the `Routes -> Controllers -> Services -> Models -> MongoDB` flow because this project is data-heavy and every stage needs to be explainable. Putting parsing, normalization, joining, analytics, AI prompts, persistence, and PDF generation directly inside controllers would make the backend difficult to test and hard to reason about.

My architecture decision was to keep controllers thin and move business logic into services. This follows the Single Responsibility Principle: each file owns one major responsibility and exposes reusable functions for the rest of the pipeline.

Controllers in this project coordinate request and response behavior. The actual implementation logic stays inside services such as `import.service.js`, `activityNormalizer.js`, `employeeNormalizer.js`, `join.service.js`, `analytics.service.js`, `employee.service.js`, `ai.service.js`, `saveData.service.js`, and `export.service.js`.

This improves maintainability because changing task normalization does not require changing dashboard routes. It improves scalability because new services can be added without rewriting controllers. It improves testability because service functions can be tested independently with raw input and expected output. It improves future extensibility because authentication, scheduled reports, cached dashboards, and advanced AI workflows can be added around the existing service boundaries.

# Engineering Decisions

## Normalization Before Analytics

I intentionally normalize activity data before analytics because chart categories and KPI calculations are only useful when the input data is consistent. Without `normalizeApp()` and `normalizeTask()`, values like `Gmail`, `gmail`, and ` Gmail ` would become three chart categories. Normalization is a small preprocessing cost in exchange for trustworthy analytics.

## Separate Employee Normalization

I kept employee normalization separate from activity normalization because HRMS data has different problems than activity logs. Employee data contains salary formats, role fields, department aliases, working-hour shapes, status fields, and duplicate employee IDs. `normalizeEmployee()` handles those concerns before the join step.

## Join Before Analytics

I run `joinData()` before analytics because recoverable money, department breakdown, role-based drilldown, and peer comparison require both activity data and HRMS metadata. Analytics on activity logs alone would show time, but not business cost or organizational context.

## MongoDB Stores Joined Data Instead Of Raw CSV

I store normalized and joined records in MongoDB through `EmployeeActivity` because the joined dataset is the version that analytics actually uses. Raw CSV is treated as an import source, while MongoDB stores the cleaned business-ready representation.

## Dashboard Metrics Before AI

I generate dashboard metrics before calling AI because the AI should explain validated analytics, not interpret raw operational files. The AI workflow receives the dashboard object produced by `generateDashboard()`, which keeps the AI layer grounded in reproducible backend calculations.

## AI Receives Dashboard Data Instead Of CSV

I decided not to send raw CSV to Gemini. Raw CSV contains inconsistent values and unnecessary row-level noise. The AI receives normalized dashboard analytics through `buildPrompt()`, which reduces hallucination risk and keeps responses aligned with the same numbers shown in the dashboard.

## PDF Exports Dashboard Analytics

I generate PDF reports from the live dashboard object so exported reports match the API response. This avoids a second calculation path and keeps the dashboard and PDF consistent.

## Employee Drilldown Reuses The Same Pipeline

Employee drilldown reuses import, normalization, and join logic before calculating employee summary, top tasks, repetitive tasks, and peer comparison. This ensures employee-level analysis is consistent with the main dashboard.

# Service Engineering Notes

## `import.service.js`

Service Name: `services/import.service.js`

Functions: `loadData()`

Problem Solved: I needed to load activity logs from CSV and employee master data from JSON without crashing when a file is missing or malformed.

Engineering Decision: I created a reusable async import function that reads `activity_logs.csv` with `csv-parser` and reads `employees.json` with `fs`.

Implementation Reasoning: Import is isolated so controllers do not know file parsing details. This makes the source of raw data replaceable later.

Conflict Solved: CSV and JSON are different formats, but the rest of the backend needs both as JavaScript arrays.

Validation Strategy: I verified the loader returns activity and employee counts before downstream processing.

Business Value: The dashboard starts from controlled source ingestion instead of manual data preparation.

Tradeoffs: File-based import is simple and transparent, but a production system could later move this behind upload workflows or scheduled ingestion.

Production Consideration: Errors are handled gracefully so bad input does not crash the full API.

Future Scalability: This service can be extended to support file uploads, S3 imports, or database-backed ingestion.

## `activityNormalizer.js`

Service Name: `services/activityNormalizer.js`

Functions: `normalizeTimestamp()`, `normalizeDuration()`, `normalizeBoolean()`, `normalizeApp()`, `normalizeTask()`, `normalizeActivity()`

Problem Solved: Raw activity logs contain inconsistent app names, task names, timestamps, booleans, durations, casing, spacing, and missing values.

Engineering Decision: I normalize all activity fields before join and analytics.

Implementation Reasoning: A dashboard should not decide whether `MS Excel`, `Excel`, and `Microsoft Excel` are the same application. That decision belongs in backend normalization.

Conflict Solved: Duplicate chart categories, invalid durations, mixed timestamp formats, and string booleans are converted into one clean activity shape.

Validation Strategy: I tested representative aliases and confirmed they map to one standard value before they reach analytics.

Business Value: Charts become auditable because every category comes from a controlled mapping.

Tradeoffs: The mapping requires maintenance when new aliases appear, but the benefit is consistent reporting.

Production Consideration: Every downstream service receives identical task and app categories.

Future Scalability: The alias mappings can later move into database configuration or admin-managed taxonomy rules.

## `employeeNormalizer.js`

Service Name: `services/employeeNormalizer.js`

Functions: `normalizeEmployeeId()`, `normalizeDepartment()`, `normalizeRole()`, `normalizeCompensation()`, `normalizeWorkingHours()`, `normalizeEmployee()`

Problem Solved: HRMS data contains inconsistent field names, salary formats, working-hour shapes, and duplicate employee IDs.

Engineering Decision: I normalize employee metadata separately from activity logs and use a `Map` to keep one record per employee ID.

Implementation Reasoning: Employee data is needed for recoverable money, department analysis, role analysis, and employee drilldown, so it must be clean before joining.

Conflict Solved: Fields such as `EmployeeID`, `employee_id`, `Dept`, `department`, `Role`, `role`, and nested metadata are converted into one consistent employee object.

Validation Strategy: I verified employee records are reduced into stable fields such as `employeeId`, `department`, `role`, `annualSalary`, and `hourlyRate`.

Business Value: The dashboard can calculate money and organizational breakdowns instead of only activity counts.

Tradeoffs: Duplicate employee IDs overwrite previous records in the `Map`, which is simple and deterministic. In a larger system, duplicate resolution rules could become configurable.

Production Consideration: Missing employee fields are given safe defaults so downstream services do not fail.

Future Scalability: Additional HRMS systems can be supported by adding field adapters inside the normalizer.

## `join.service.js`

Service Name: `services/join.service.js`

Functions: `createEmployeeMap()`, `joinEmployeeActivity()`, `findEmployeesWithoutActivity()`, `joinData()`

Problem Solved: Activity logs and HRMS records must be joined without silently hiding missing or extra employees.

Engineering Decision: I use an employee lookup map for fast matching, return unique `missingEmployees`, and return `employeesWithoutActivity`.

Implementation Reasoning: The join step is where data integrity issues become visible. I wanted the API response to show mismatches instead of dropping them.

Conflict Solved: Missing employees, duplicate missing IDs, and metadata records with no activity are all surfaced clearly.

Validation Strategy: I verified duplicate missing IDs are reduced to unique values using `Set` logic.

Business Value: Analysts can identify HRMS/activity-log mismatch issues that would otherwise distort analytics.

Tradeoffs: Records without matching employees are not included in joined analytics, but they are reported separately for auditability.

Production Consideration: The return object keeps dashboard data and data-quality warnings together.

Future Scalability: Join rules can later support multiple identifiers, email matching, or HRMS reconciliation workflows.

## `analytics.service.js`

Service Name: `services/analytics.service.js`

Functions: `getRecoverableHours()`, `getRecoverableMoney()`, `getDepartmentBreakdown()`, `getTaskBreakdown()`, `getAppBreakdown()`, `getAutomationRanking()`, `getWeeklyTrend()`, `getAnomalies()`, `generateDashboard()`

Problem Solved: I needed KPIs that are reproducible and explainable, not just headline numbers.

Engineering Decision: I implemented each KPI as a dedicated function and combined them through `generateDashboard()`.

Implementation Reasoning: Separate functions make every metric traceable and easier to debug.

Conflict Solved: Recoverable hours, recoverable money, department breakdown, task breakdown, app breakdown, automation ranking, weekly trend, and anomalies are calculated through one centralized analytics layer.

Validation Strategy: Each metric can be checked against the normalized joined records that feed it.

Business Value: Decision makers can understand where time and money are being spent and which tasks should be automated first.

Tradeoffs: The current calculations are direct and transparent. More advanced statistical models could be added later, but this implementation favors auditability.

Production Consideration: Dashboard, AI, and PDF export all reuse the same analytics output.

Future Scalability: More KPIs can be added without changing routes or controllers.

## `saveData.service.js`

Service Name: `services/saveData.service.js`

Functions: `saveEmployeeActivities()`

Problem Solved: The backend needs persistent storage for normalized and joined employee activity records.

Engineering Decision: I save the cleaned joined dataset to MongoDB using the `EmployeeActivity` model.

Implementation Reasoning: Persisting joined data creates a stable analytics-ready collection instead of forcing every downstream workflow to re-interpret raw files.

Conflict Solved: The source CSV and JSON remain raw input, while MongoDB stores the clean operational view.

Validation Strategy: The service validates that input is an array before saving and returns the number of saved records.

Business Value: Clean workforce activity data can be reused for dashboards, reports, and future workflows.

Tradeoffs: The current implementation refreshes records by deleting old data before inserting fresh data. This is simple for assignment scope, but production systems may use versioned imports.

Production Consideration: Database persistence uses Mongoose and environment-based connection configuration.

Future Scalability: The service can evolve into incremental sync, import history, or tenant-based storage.

## `employee.service.js`

Service Name: `services/employee.service.js`

Functions: `getEmployeeById()`, `getEmployeeSummary()`, `getTopTasks()`, `getTopRepetitiveTasks()`, `getPeerComparison()`

Problem Solved: The dashboard needs employee-level analysis beyond aggregate charts.

Engineering Decision: I created employee drilldown functions that reuse the same joined dataset as the dashboard.

Implementation Reasoning: Employee detail should never use a different data path from the main dashboard.

Conflict Solved: The service returns summary, top tasks, repetitive tasks, and peer comparison without exposing raw peer activity records.

Validation Strategy: I verified peer comparison aggregates same-role employees into total hours, repetitive hours, averages, employee count, and rank.

Business Value: Managers can move from department-level insight into employee-specific workload and repetitive-work patterns.

Tradeoffs: Peer comparison currently ranks by total hours. More scoring dimensions can be added later.

Production Consideration: Aggregated peer comparison is safer and more useful than returning every peer activity row.

Future Scalability: The service can support manager views, employee benchmarking, and role-level productivity insights.

## `ai.service.js`

Service Name: `services/ai.service.js`

Functions: `buildPrompt()`, `askAI()`

Problem Solved: AI needs to answer workforce questions without inventing unsupported statistics.

Engineering Decision: I ground Gemini on the generated dashboard object instead of raw CSV.

Implementation Reasoning: The dashboard object is already normalized, joined, and calculated. This gives AI a trusted context.

Conflict Solved: Prompt rules prevent the model from answering outside the current dataset.

Validation Strategy: The prompt explicitly instructs the model to use only dashboard data and return a fallback when the answer is unavailable.

Business Value: AI becomes an explanation layer over verified analytics, not an uncontrolled data source.

Tradeoffs: AI can only answer questions covered by dashboard data. This limitation is intentional for correctness.

Production Consideration: Gemini configuration uses `process.env.GEMINI_API_KEY`, so secrets are not hardcoded.

Future Scalability: The prompt can be extended for multi-turn analysis, role-based answers, or executive summaries.

## `export.service.js`

Service Name: `services/export.service.js`

Functions: `exportDashboardPDF()`

Problem Solved: Stakeholders need a report that matches the dashboard instead of a generic static export.

Engineering Decision: I generate the PDF from the live dashboard analytics object.

Implementation Reasoning: Export should reuse the same metrics as the dashboard so there is no mismatch between UI and report.

Conflict Solved: Report consistency is maintained because there is no separate PDF calculation path.

Validation Strategy: The report uses dashboard sections such as recoverable hours, recoverable money, department breakdown, automation opportunities, weekly trend, and anomalies.

Business Value: Leaders can download and share the same analytics shown in the product.

Tradeoffs: The current PDF is summary-focused. More formatting and charts can be added later.

Production Consideration: PDFKit streams the report directly to the HTTP response.

Future Scalability: The export service can support scheduled reports, branded templates, and multiple report formats.

## Technologies Used

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- PDFKit
- Google Gemini API
- dotenv
- csv-parser

### Frontend

- React
- Vite
- TailwindCSS
- Axios
- Recharts

### Development

- Git
- GitHub
- Postman
- VS Code

## AI Assisted Development

I used AI responsibly as a development assistant during the project lifecycle. AI helped me move faster, but it did not replace engineering ownership, debugging, testing, or architecture decisions.

### ChatGPT

- Architecture planning
- Backend debugging
- API design
- Code review
- Documentation

### Claude

- Backend structure refinement
- Refactoring suggestions
- Prompt engineering
- Service optimization

### OpenAI Codex

- Boilerplate generation
- Repetitive CRUD generation
- Documentation support
- Productivity improvements

All business logic, testing, debugging, integration decisions, architecture decisions, and final implementation were reviewed, validated and integrated manually.

Every generated implementation was manually reviewed, tested, debugged and integrated into the architecture.

Several generated implementations were rejected or rewritten whenever they did not satisfy data correctness, engineering quality or business requirements.

Engineering ownership always remained with the developer.

## Features

- CSV Import
- JSON Import
- Normalization
- Validation
- Join Service
- MongoDB Storage
- Dashboard Analytics
- Recoverable Hours
- Recoverable Money
- Department Breakdown
- Task Breakdown
- Application Breakdown
- Automation Ranking
- Weekly Trend
- Anomaly Detection
- Employee Drilldown
- Gemini AI Insights
- PDF Export

## Backend Folder Structure

```text
Vibe_Backend/
|-- config/
|   `-- db.js
|-- controllers/
|   |-- ai.controller.js
|   |-- dashboard.controller.js
|   |-- employee.controller.js
|   |-- export.controller.js
|   `-- import.controller.js
|-- data/
|   |-- activity_logs.csv
|   `-- employees.json
|-- middleware/
|-- models/
|   `-- EmployeeActivity.js
|-- routes/
|   |-- ai.routes.js
|   |-- dashboard.routes.js
|   |-- employee.routes.js
|   |-- export.routes.js
|   `-- import.routes.js
|-- services/
|   |-- activityNormalizer.js
|   |-- ai.service.js
|   |-- analytics.service.js
|   |-- employee.service.js
|   |-- employeeNormalizer.js
|   |-- export.service.js
|   |-- import.service.js
|   |-- join.service.js
|   `-- saveData.service.js
|-- utils/
|--.env.example
|-- package.json
|-- package-lock.json
|-- README.md
`-- server.js
```

## API Documentation

### GET `/api/dashboard`

Generates the complete dashboard analytics response.

#### Request

No request body is required.

#### Response

```json
{
  "success": true,
  "dashboard": {
    "recoverableHours": 0,
    "recoverableMoney": 0,
    "departmentBreakdown": [],
    "taskBreakdown": [],
    "appBreakdown": [],
    "automationRanking": [],
    "weeklyTrend": [],
    "anomalies": []
  },
  "missingEmployees": [],
  "employeesWithoutActivity": [],
  "totalRecords": 0
}
```

### POST `/api/ai`

Sends a user question and dashboard data context to Gemini AI for grounded analysis.

#### Request

```json
{
  "question": "Which task has the highest automation opportunity?"
}
```

#### Response

```json
{
  "success": true,
  "answer": "AI-generated response based only on dashboard data."
}
```

### GET `/api/employees/:employeeId`

Returns drill-down analytics for a single employee.

#### Request

Path parameter:

```text
employeeId
```

Example:

```text
GET /api/employees/E001
```

#### Response

```json
{
  "success": true,
  "summary": {
    "employeeId": "E001",
    "name": "Employee Name",
    "department": "Operations",
    "role": "Analyst",
    "hourlyRate": 0,
    "totalHours": 0,
    "repetitiveHours": 0
  },
  "topTasks": [],
  "topRepetitiveTasks": [],
  "peerComparison": {
    "employeeHours": 0,
    "peerAverageHours": 0,
    "employeeRepetitiveHours": 0,
    "peerAverageRepetitiveHours": 0,
    "sameRoleEmployees": 0,
    "employeeRank": 0
  }
}
```

### GET `/api/export/pdf`

Generates and returns a PDF dashboard report.

#### Request

No request body is required.

#### Response

Returns a generated PDF file response.

### GET `/api/import`

Verifies that CSV and JSON source files can be loaded successfully.

#### Request

No request body is required.

#### Response

```json
{
  "success": true,
  "message": "Files loaded successfully",
  "activityRows": 0,
  "employeeRows": 0
}
```

## Database

The backend uses MongoDB with Mongoose.

### Collection: `EmployeeActivity`

The `EmployeeActivity` collection stores normalized and joined records created from employee master data and activity logs.

### Fields

- `employeeId`: Unique employee identifier
- `name`: Employee name
- `department`: Employee department
- `role`: Employee role
- `appUsed`: Normalized application name
- `taskCategory`: Normalized task category
- `duration`: Activity duration in minutes
- `isRepetitive`: Boolean flag for repetitive work
- `timestamp`: Activity timestamp
- `annualSalary`: Annual salary value
- `hourlyRate`: Estimated hourly cost
- `workingHours`: Employee working hours and timezone
- `status`: Employee status
- `terminatedOn`: Termination date when available
- `createdAt`: MongoDB document creation timestamp
- `updatedAt`: MongoDB document update timestamp

### Purpose

This collection provides a persistent analytics-ready source for dashboard metrics, employee analysis, automation opportunity detection, and reporting.

## Analytics Engine

### Recoverable Hours

Calculates the total time spent on repetitive activities and converts it from minutes into hours.

### Recoverable Money

Estimates recoverable salary cost by combining repetitive activity duration with employee hourly rate.

### Automation Ranking

Ranks tasks based on repetitive hours and recoverable cost so high-impact automation opportunities can be prioritized.

### Weekly Trend

Groups activity duration by week to show workforce time trends across the reporting period.

### Department Breakdown

Aggregates total hours by department to show where work effort is concentrated.

### Task Breakdown

Aggregates total hours by normalized task category to prevent duplicate task names and improve dashboard clarity.

### Application Breakdown

Aggregates total hours by normalized application name to show tool usage patterns across the workforce.

### Employee Drilldown

Provides employee-level summary, top tasks, repetitive work profile, and peer comparison against employees with the same role.

## AI Workflow

```text
Dashboard
    |
    v
Prompt Engineering
    |
    v
Gemini
    |
    v
Grounded Response
    |
    v
Hallucination Prevention
```

The AI workflow builds a controlled prompt using the generated dashboard data and the user's question. Gemini receives the dashboard context and must answer only from the provided data.

The prompt includes strict rules to prevent hallucination:

- Do not create unsupported numbers
- Do not answer outside the available dataset
- Use only dashboard data
- Return a fallback message when the answer is not available

## Environment Variables

Do not commit real secrets to GitHub. Use environment variables for all sensitive configuration.

```env
PORT=
MONGODB_URI=
GEMINI_API_KEY=
```

## Installation

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The backend runs on the configured `PORT`.

## Deployment

### Backend

Deploy the Node.js and Express backend on Render.

Recommended production setup:

- Add all required environment variables in Render
- Connect the backend repository
- Set the start command to `npm start`
- Ensure MongoDB Atlas network access is configured

### Frontend

Deploy the React frontend on Vercel.

Recommended production setup:

- Configure the backend API base URL
- Add required frontend environment variables
- Connect the frontend repository
- Use the Vite production build

### Environment Variables

Production secrets should be stored only in deployment platform environment settings.

### MongoDB Atlas

Use MongoDB Atlas for hosted database storage and configure the connection using `MONGODB_URI`.

# How This Project Solves the Assignment Challenges

This section documents the engineering decisions I made in the current backend implementation. My goal was not only to show charts, but to prove that every dashboard value comes from a controlled, auditable data pipeline.

## Challenge: Raw CSV Directly Into Charts

During implementation I identified that raw CSV data was not reliable enough to send directly into dashboard charts. Values such as `Gmail`, `gmail`, and ` Gmail ` represent the same application, but charting them directly would create separate categories and produce misleading visual analytics. The same issue appears in task names, timestamps, booleans, and duration values.

I decided not to fix this visually in the frontend because that would hide dirty data instead of fixing it at the source. My implementation cleans the data before it reaches joining, analytics, AI, or export.

Service: `services/activityNormalizer.js`

Functions:

- `normalizeApp()`
- `normalizeTask()`
- `normalizeBoolean()`
- `normalizeTimestamp()`
- `normalizeDuration()`

Engineering decision:

- Application names are normalized through a mapping strategy so aliases such as `MS Excel`, `Excel`, and `Microsoft Excel` are treated as one application.
- Task names are normalized into consistent business categories such as `Lead Entry`, `Calendar Management`, `Invoice Processing`, and `Internal Communication`.
- Boolean values such as `YES`, `true`, and `1` are converted into real JavaScript booleans.
- Timestamp strings are parsed into standard `Date` objects.
- Invalid, empty, or negative durations are converted into safe numeric values.

Why this implementation is reliable:

- The normalization happens before joining, analytics, AI analysis, and PDF export.
- Every downstream service receives the same cleaned activity structure.
- Case differences, extra spaces, aliases, null values, undefined values, `-`, `NA`, `N/A`, and `Unknown` are handled consistently.

Business impact:

- Task breakdown and application breakdown become trustworthy.
- Leaders do not see duplicate categories for the same work.
- Automation decisions are based on cleaned operational data instead of raw CSV noise.

Evidence From Implementation:

- Service: `services/activityNormalizer.js`
- Functions: `normalizeApp()`, `normalizeTask()`, `normalizeBoolean()`, `normalizeTimestamp()`, `normalizeDuration()`
- Actual Result: `Gmail`, `gmail`, and ` Gmail ` become `Gmail`.
- Business Effect: One chart category is produced instead of three.

How I verified it:

- I tested representative aliases for applications and tasks.
- I confirmed invalid values such as `-`, `NA`, `N/A`, `Unknown`, `null`, and `undefined` are handled safely.
- I validated that dashboard breakdowns use normalized names instead of raw CSV variants.

## Challenge: Skipping HRMS JSON

During implementation I found that activity logs alone could not calculate business value. A CSV row can show that an employee spent time on repetitive work, but it cannot calculate recoverable money without salary, role, department, and hourly-rate information from HRMS data.

I intentionally avoided a CSV-only dashboard because that would create activity counts without financial or organizational context.

Services:

- `services/employeeNormalizer.js`
- `services/join.service.js`

Functions:

- `normalizeEmployee()`
- `joinData()`

Engineering decision:

- `normalizeEmployee()` standardizes employee IDs, departments, roles, compensation, working hours, status, and termination fields from inconsistent HRMS JSON shapes.
- Salary values from formats such as `salary_LPA`, `annual_ctc_inr`, and nested compensation fields are converted into a consistent `annualSalary`.
- `hourlyRate` is calculated from annual salary when direct hourly-rate data is not available.
- `joinData()` merges normalized employees with normalized activities using `employeeId`.

Why this implementation is reliable:

- Analytics never depend on activity logs alone.
- Recoverable money uses employee-specific hourly rates.
- Department and role breakdowns are calculated from normalized employee metadata.
- Duplicate employee IDs are protected by a `Map` in `normalizeEmployee()`, so the final employee dataset has one record per employee ID.

Business impact:

- The dashboard can estimate financial opportunity, not just time spent.
- Managers can compare departments, roles, employees, and repetitive work cost.
- Automation opportunities become measurable in monetary terms.

Evidence From Implementation:

- Services: `services/employeeNormalizer.js`, `services/join.service.js`
- Functions: `normalizeEmployee()`, `joinData()`
- Actual Result: salary, department, role, and hourly rate are attached to activity records before analytics.
- Business Effect: Recoverable money can be calculated from repetitive duration and employee hourly rate.

How I verified it:

- I confirmed employee records are normalized into `employeeId`, `department`, `role`, `annualSalary`, and `hourlyRate`.
- I confirmed analytics receive joined records instead of isolated CSV rows.
- I validated that dashboard cost metrics depend on employee metadata.

## Challenge: Duplicate, Missing, and Extra Employees

During implementation I treated missing, duplicate, and extra employees as data-quality problems, not edge cases to ignore. Real workforce datasets often contain activity logs for employees missing from HRMS metadata, HRMS records with no activity, or duplicate employee records. Ignoring these issues causes silent data loss, incorrect analytics, and broken AI answers.

I rejected the quick-fix approach of doing a simple join and dropping unmatched records because it would make the dashboard look clean while hiding data-quality problems.

Service: `services/join.service.js`

Function: `joinData()`

Engineering decision:

- Employee lookup is built using a `Map` for reliable employee ID matching.
- Missing employees are collected instead of being silently ignored.
- Missing employee IDs are de-duplicated using `Set` logic.
- Employees present in HRMS but missing from activity logs are returned as `employeesWithoutActivity`.
- Joined records are created only when valid employee metadata exists, while unmatched IDs remain visible in the response.

Why this implementation is reliable:

- Records are not silently discarded without trace.
- The API response exposes `missingEmployees` and `employeesWithoutActivity`.
- Duplicate missing IDs such as `E013`, `E013`, `E013` are reduced to a unique list.
- Data-quality gaps are visible to both backend users and dashboard consumers.

Business impact:

- Analysts can identify HRMS and activity-log mismatch issues.
- AI answers are less likely to be based on incomplete assumptions.
- Dashboard trust improves because data problems are reported instead of hidden.

Evidence From Implementation:

- Service: `services/join.service.js`
- Function: `joinData()`
- Actual Result: duplicate missing employee IDs such as `E013`, `E013`, `E013`, `?`, `E013` are reduced to `E013`, `?`.
- Business Effect: Data-quality issues are visible without inflating warning lists.

How I verified it:

- I tested duplicate missing employee IDs and confirmed they are returned uniquely.
- I confirmed employees with no activity are returned as `employeesWithoutActivity`.
- I validated that unmatched records are reported instead of silently disappearing.

## Challenge: Large Headline Numbers Without Methodology

During implementation I treated high-level KPIs as calculations that must be explainable. Recoverable hours and recoverable money are not useful unless decision makers understand how they were calculated. Without a clear methodology, dashboard numbers become difficult to trust.

I avoided generic headline KPIs by keeping each metric inside a named analytics function with a clear calculation path.

Service: `services/analytics.service.js`

Functions:

- `getRecoverableHours()`
- `getRecoverableMoney()`
- `getDepartmentBreakdown()`
- `getTaskBreakdown()`
- `getAppBreakdown()`
- `getAutomationRanking()`
- `getWeeklyTrend()`
- `getAnomalies()`
- `generateDashboard()`

Engineering decision:

- `getRecoverableHours()` sums repetitive-task duration and converts minutes into hours.
- `getRecoverableMoney()` multiplies repetitive hours by employee hourly rate.
- `getDepartmentBreakdown()` groups total hours by department.
- `getTaskBreakdown()` groups total hours by normalized task category.
- `getAppBreakdown()` groups total hours by normalized application name.
- `getAutomationRanking()` ranks task categories by repetitive hours and recoverable money.
- `getWeeklyTrend()` groups activity hours by week.
- `getAnomalies()` flags unusual records such as high-duration activity.
- `generateDashboard()` combines all analytics functions into one dashboard response.

Why this implementation is reliable:

- Every KPI is generated from normalized and joined records.
- Each metric is calculated by a named function with a single responsibility.
- The dashboard response is reproducible because the calculation pipeline is deterministic.
- The same analytics object is used by dashboard, AI, and export workflows.

Business impact:

- Decision makers can audit how each number was produced.
- Automation ranking has a clear cost and time basis.
- Dashboard KPIs become explainable business metrics instead of black-box numbers.

Evidence From Implementation:

- Service: `services/analytics.service.js`
- Functions: `getRecoverableHours()`, `getRecoverableMoney()`, `getDepartmentBreakdown()`, `getTaskBreakdown()`, `getAppBreakdown()`, `getAutomationRanking()`, `getWeeklyTrend()`, `getAnomalies()`, `generateDashboard()`
- Actual Result: every dashboard metric is created by a dedicated function.
- Business Effect: KPI values are reproducible and auditable from normalized joined data.

How I verified it:

- I confirmed all required analytics functions are exported.
- I validated that `generateDashboard()` composes the dashboard from the same centralized analytics service.
- I checked that dashboard, AI, and PDF workflows use the same analytics object.

## Challenge: AI Hallucination

During implementation I treated AI hallucination as a product risk. AI can invent statistics when it receives vague prompts or incomplete context. For workforce analytics, hallucinated numbers can mislead leadership and create false business conclusions.

I did not send raw user questions directly to AI. I grounded every AI request in the generated dashboard data.

Service: `services/ai.service.js`

Functions:

- `buildPrompt()`
- `askAI()`

Engineering decision:

- `buildPrompt()` injects the generated dashboard JSON into the AI prompt.
- The prompt explicitly instructs Gemini to answer only using the provided dashboard data.
- The prompt includes strict rules against hallucination and fake numbers.
- `askAI()` sends the controlled prompt to Gemini using `GEMINI_API_KEY` from environment variables.
- AI receives the dashboard summary, not raw CSV rows.

Why this implementation is reliable:

- The AI workflow is grounded in already-normalized and already-aggregated analytics.
- Raw CSV inconsistencies are removed before AI analysis.
- The fallback instruction tells AIa to reply with `Data not available in the current dataset.` when the answer is not present.
- The same dashboard object used by the API becomes the source of truth for AI.

Business impact:

- AI insights stay aligned with actual dashboard metrics.
- Leadership receives explanations based on the current dataset.
- I avoid treating AI as a source of truth; AI becomes an explanation layer over verified analytics.

Evidence From Implementation:

- Service: `services/ai.service.js`
- Functions: `buildPrompt()`, `askAI()`
- Actual Result: Gemini receives dashboard JSON plus strict rules, not raw CSV.
- Business Effect: AI answers are tied to the same metrics shown in the dashboard.

How I verified it:

- I reviewed the prompt generated by `buildPrompt()`.
- I confirmed the prompt includes grounding rules and a fallback response.
- I validated that the AI service uses `process.env.GEMINI_API_KEY` instead of hardcoded secrets.

## Challenge: Five Charts But No Business Insight

During implementation I recognized that charts alone do not create business value. A dashboard must explain what work can be automated, how much time can be recovered, where cost is concentrated, and which employee or role patterns require attention.

I designed the analytics layer to convert chart data into decisions rather than stopping at visualization.

Services:

- `services/analytics.service.js`
- `services/employee.service.js`

Functions:

- `getAutomationRanking()`
- `getRecoverableHours()`
- `getRecoverableMoney()`
- `getEmployeeSummary()`
- `getTopTasks()`
- `getTopRepetitiveTasks()`
- `getPeerComparison()`

Engineering decision:

- Automation ranking prioritizes tasks by repetitive effort and recoverable money.
- Recoverable hours identifies how much time is spent on repetitive tasks.
- Recoverable money converts repetitive time into estimated salary cost.
- Employee drilldown exposes individual workload, top tasks, and repetitive-task concentration.
- Peer comparison aggregates employees with the same role and compares total hours, repetitive hours, averages, and rank.

Why this implementation is reliable:

- Business insight is generated from joined employee and activity data.
- Peer comparison returns summary values instead of raw activity rows.
- Employee-level analytics use the same normalized activity and employee pipeline as the main dashboard.

Business impact:

- Managers can prioritize automation work by value.
- Teams can identify repetitive-work pressure points.
- Employee drilldown supports targeted operational decisions instead of generic dashboard review.

Evidence From Implementation:

- Services: `services/analytics.service.js`, `services/employee.service.js`
- Functions: `getAutomationRanking()`, `getRecoverableHours()`, `getRecoverableMoney()`, `getEmployeeSummary()`, `getTopTasks()`, `getTopRepetitiveTasks()`, `getPeerComparison()`
- Actual Result: the dashboard exposes automation ranking, recoverable time, recoverable money, employee top tasks, repetitive tasks, and peer comparison.
- Business Effect: Managers can prioritize automation and operational improvements using measurable indicators.

How I verified it:

- I confirmed `getPeerComparison()` returns aggregated summary values instead of raw peer activity records.
- I validated that employee drilldown uses the same normalized and joined data pipeline.
- I checked that automation ranking is generated from repetitive hours and recoverable money.

## Challenge: Export Downloads Generic Report

During implementation I treated export consistency as part of dashboard correctness. An export is not useful if it does not match the dashboard. Generic reports create confusion because stakeholders may see different numbers in the app and in the downloaded file.

I avoided static or hardcoded reports by generating the PDF from the live dashboard analytics object.

Service: `services/export.service.js`

Function: `exportDashboardPDF()`

Engineering decision:

- The PDF is generated from the live `dashboard` object produced by `generateDashboard()`.
- The report includes dashboard summary, department breakdown, top automation opportunities, weekly trend, and anomaly information.
- PDFKit streams the generated report directly to the API response.

Why this implementation is reliable:

- Dashboard and PDF export share the same analytics source.
- There is no separate report calculation path.
- Report values stay consistent with the API response.

Business impact:

- Stakeholders can download reports that match the live dashboard.
- PDF exports are suitable for management review and offline sharing.
- Reporting remains consistent across product surfaces.

Evidence From Implementation:

- Service: `services/export.service.js`
- Function: `exportDashboardPDF()`
- Actual Result: the PDF report uses `dashboard.recoverableHours`, `dashboard.recoverableMoney`, `dashboard.departmentBreakdown`, `dashboard.automationRanking`, `dashboard.weeklyTrend`, and `dashboard.anomalies`.
- Business Effect: The exported report matches the dashboard instead of becoming a disconnected document.

How I verified it:

- I confirmed `export.controller.js` generates the dashboard before calling `exportDashboardPDF()`.
- I validated that the export service does not calculate separate KPI values.
- I checked that the PDF is streamed from live dashboard data.

## Challenge: Messy Architecture

During implementation I kept business logic out of controllers because analytics systems need traceable processing stages. When business logic is scattered across controllers, the backend becomes hard to debug, test, extend, and explain.

I avoided putting import logic, normalization, analytics, AI prompts, and exports directly inside route handlers or controllers.

Architecture:

```text
Routes
    |
    v
Controllers
    |
    v
Services
    |
    v
Models
    |
    v
MongoDB
```

Engineering decision:

- Routes only define API endpoints.
- Controllers handle request and response coordination.
- Services own business logic such as import, normalization, joining, analytics, AI, employee drilldown, persistence, and export.
- Models define database schema and persistence structure.
- MongoDB stores normalized joined records through Mongoose.

Why this implementation is reliable:

- Each backend layer has a clear responsibility.
- Changes to analytics do not require route changes.
- Changes to AI prompt behavior do not affect import or join logic.
- The processing pipeline is easier to audit and explain during review.

Business impact:

- The project can grow without becoming fragile.
- New features such as authentication, scheduled reports, or advanced AI can be added cleanly.
- Recruiters and reviewers can understand the backend architecture quickly.

## Assignment Challenge Summary

| Assignment Challenge | Service | Function | Engineering Decision | Business Impact |
| --- | --- | --- | --- | --- |
| Raw CSV directly into charts | `activityNormalizer.js` | `normalizeApp()`, `normalizeTask()`, `normalizeBoolean()`, `normalizeTimestamp()`, `normalizeDuration()` | Normalize aliases, casing, spacing, dates, booleans, and durations before analytics | Trustworthy chart categories and clean KPI inputs |
| Skipping HRMS JSON | `employeeNormalizer.js`, `join.service.js` | `normalizeEmployee()`, `joinData()` | Normalize employee metadata and join salary, department, role, and hourly rate with activity | Enables recoverable money, department analysis, and role-based insight |
| Duplicate / Missing / Extra Employees | `join.service.js` | `joinData()` | Use lookup maps, unique missing employee IDs, and employees-without-activity reporting | Prevents silent data loss and exposes data-quality gaps |
| Large headline numbers without methodology | `analytics.service.js` | `getRecoverableHours()`, `getRecoverableMoney()`, `getDepartmentBreakdown()`, `getTaskBreakdown()`, `getAppBreakdown()`, `getAutomationRanking()`, `getWeeklyTrend()`, `getAnomalies()`, `generateDashboard()` | Calculate each KPI through a dedicated deterministic function | Makes dashboard numbers reproducible and auditable |
| AI Hallucination | `ai.service.js` | `buildPrompt()`, `askAI()` | Ground Gemini in dashboard JSON with strict prompt rules and fallback response | Produces safer AI insights based on verified analytics |
| Five charts but no business insight | `analytics.service.js`, `employee.service.js` | `getAutomationRanking()`, `getRecoverableHours()`, `getRecoverableMoney()`, `getEmployeeSummary()`, `getTopTasks()`, `getTopRepetitiveTasks()`, `getPeerComparison()` | Convert charts into automation, cost, employee, and peer-comparison decisions | Helps leaders prioritize operational improvements |
| Export downloads generic report | `export.service.js` | `exportDashboardPDF()` | Generate PDF from the same live dashboard analytics object | Keeps downloaded reports consistent with the dashboard |
| Messy architecture | Routes, Controllers, Services, Models | Existing Express MVC flow | Keep business logic in services and request handling in controllers | Improves maintainability, scalability, and reviewability |

Rather than optimizing for a quick AI-generated dashboard, this implementation prioritizes data correctness, auditability, maintainability, AI grounding, and production-ready engineering practices. Every metric shown in the dashboard can be traced back to normalized source data and a clearly defined processing pipeline.

# Engineering Lessons Learned

This project taught me that workforce analytics is primarily a data engineering problem instead of a dashboard problem.

The charts are only the final layer. The real engineering work happens before the frontend receives anything: importing raw files, cleaning inconsistent fields, joining HRMS metadata, preserving data-quality warnings, calculating reproducible KPIs, grounding AI responses, and keeping reports consistent with dashboard analytics.

## Normalization

I learned that normalization is not a cosmetic step. It directly controls whether analytics are trustworthy. If app and task aliases are not normalized before aggregation, the dashboard can produce technically valid but business-wrong charts.

## Data Integrity

I treated missing employees, duplicate employees, and employees without activity as important signals. Instead of hiding these issues, the backend returns them so the user can understand the quality of the dataset.

## Joining

The join step is where raw activity becomes business data. Activity duration becomes more valuable only after it is connected with department, role, salary, and hourly rate.

## Business KPIs

Recoverable hours and recoverable money are not just UI labels. They require a methodology that can be explained and reproduced from the source data.

## AI Grounding

AI is useful only when it is grounded. I learned to treat Gemini as an explanation layer over dashboard analytics, not as a replacement for backend calculations.

## Auditability

Every number in the dashboard should be traceable back to normalized source data. This is why the project uses named services and functions for each stage instead of mixing logic in controllers.

# Production Readiness

This backend is structured for production-style deployment and review.

## Environment Variables

Sensitive values are handled through environment variables:

- `PORT`
- `MONGODB_URI`
- `GEMINI_API_KEY`

Real secrets are not documented in the README and should be configured only in the deployment platform.

## No Hardcoded Secrets

The MongoDB connection uses `process.env.MONGODB_URI`, and Gemini configuration uses `process.env.GEMINI_API_KEY`. This keeps credentials outside source code.

## MongoDB Persistence

The backend persists normalized and joined records through the `EmployeeActivity` model. This creates a stable analytics-ready collection instead of depending only on raw files.

## Reusable Services

Import, normalization, joining, analytics, persistence, employee drilldown, AI, and export logic are separated into services. This keeps the codebase maintainable and makes future features easier to add.

## Centralized Analytics

Dashboard, AI, and PDF export all depend on the same analytics output. This avoids inconsistent calculations across product surfaces.

## Grounded AI

The AI workflow is grounded in dashboard data and includes strict prompt rules. This reduces hallucination risk and keeps AI answers tied to verified metrics.

## PDF Consistency

PDF reports are generated from live dashboard analytics, so exported reports remain consistent with the dashboard response.

## Scalable Architecture

The route-controller-service-model structure allows the backend to grow without turning controllers into large business-logic files.

## Future Extensibility

The current design can support authentication, role-based access, scheduled reports, cached analytics, multi-turn AI, and additional export formats.

# Why This Implementation Is Different

| Common Submission Problem | My Solution |
| --- | --- |
| Raw CSV directly into charts | Normalized activity pipeline through `activityNormalizer.js` |
| Skip HRMS data | Employee normalization plus join pipeline through `employeeNormalizer.js` and `join.service.js` |
| Generic KPI numbers | Auditable analytics methodology through `analytics.service.js` |
| AI hallucination | Grounded Gemini prompt through `ai.service.js` |
| Generic export | Live dashboard-driven PDF through `export.service.js` |
| Messy controllers | Service-oriented architecture with thin controllers |

I did not optimize for a quick visual dashboard. I optimized for a backend pipeline where the data can be explained, corrected, audited, extended, and safely used by charts, AI, and exported reports.

## Future Improvements

- Authentication
- Role Based Access
- Scheduled Reports
- Real-time Dashboard
- Interactive Charts
- Advanced AI Assistant
- Multi-turn Conversation

## Developer Notes

This project follows a service-oriented backend architecture with clear separation between Routes, Controllers, Services and Models.

I prioritized code readability, scalability and maintainability throughout the implementation. Each major backend responsibility is isolated into a dedicated service so the project can grow without tightly coupling import, normalization, analytics, AI, persistence, and export logic.

# Design Tradeoffs

This implementation intentionally prioritizes correctness and auditability over raw performance.

Examples:

- Full dataset normalization before analytics instead of on-demand normalization.
- Full refresh MongoDB import instead of incremental synchronization.
- Dashboard-grounded AI instead of direct CSV reasoning.
- Service-oriented architecture instead of embedding business logic inside controllers.

These tradeoffs were chosen to maximize data integrity, maintainability, and explainability for the assessment.