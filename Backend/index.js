/**
 * Backend/index.js  (updated — add the two lines marked NEW)
 * Replace your existing index.js with this file.
 */

const connectToMongo = require("./database/db");
const express        = require("express");
const app            = express();
const path           = require("path");
connectToMongo();

const port = process.env.PORT || 4000;
const cors = require("cors");

app.use(cors({ origin: process.env.FRONTEND_API_LINK }));
app.use(express.json());

app.get("/", (req, res) => res.send("Hello 👋 I am Working Fine 🚀"));
app.use("/media", express.static(path.join(__dirname, "media")));

// ── Existing routes ───────────────────────────────────────────────────────────
app.use("/api/admin",    require("./routes/details/admin-details.route"));
app.use("/api/faculty",  require("./routes/details/faculty-details.route"));
app.use("/api/student",  require("./routes/details/student-details.route"));
app.use("/api/branch",   require("./routes/branch.route"));
app.use("/api/subject",  require("./routes/subject.route"));
app.use("/api/notice",   require("./routes/notice.route"));
app.use("/api/timetable",require("./routes/timetable.route"));
app.use("/api/material", require("./routes/material.route"));
app.use("/api/exam",     require("./routes/exam.route"));
app.use("/api/marks",    require("./routes/marks.route"));

// ── NEW: AI Dashboard route ───────────────────────────────────────────────────
app.use("/api/ai",       require("./routes/ai.route"));         // ← NEW

app.listen(port, () =>
  console.log(`Server listening on http://localhost:${port}`)
);
