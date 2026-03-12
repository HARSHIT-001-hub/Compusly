/**
 * ai.route.js  —  Drop this file into Backend/routes/
 * Mounts at /api/ai  (registered in index.js)
 *
 * All routes proxy to the Python Flask AI service (default: localhost:5001).
 * If Flask is down the route returns a 503 with a clear message.
 */

const express  = require("express");
const axios    = require("axios");
const router   = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5001";

/** Generic proxy helper */
async function proxyToAI(path, req, res) {
  try {
    const params = req.params.id ? {} : req.query;   // forward query params
    const url    = `${AI_SERVICE_URL}${path}`;

    const response = await axios.get(url, {
      params,
      timeout: 15000,                                 // 15 s timeout
    });

    return res.status(response.status).json(response.data);
  } catch (err) {
    if (err.code === "ECONNREFUSED" || err.code === "ECONNRESET") {
      return res.status(503).json({
        success: false,
        message: "AI service is not running. Start it with: python ai_service/app.py",
      });
    }
    const status = err.response?.status || 500;
    return res.status(status).json(
      err.response?.data || { success: false, message: err.message }
    );
  }
}

// Dashboard summary cards
router.get("/dashboard-summary", (req, res) =>
  proxyToAI("/api/ai/dashboard-summary", req, res)
);

// All students with AI metrics
router.get("/students", (req, res) =>
  proxyToAI("/api/ai/students", req, res)
);

// Performance prediction (regression)
router.get("/predict-performance", (req, res) =>
  proxyToAI("/api/ai/predict-performance", req, res)
);

// Grade classification
router.get("/grade-classify", (req, res) =>
  proxyToAI("/api/ai/grade-classify", req, res)
);

// Anomaly detection
router.get("/anomaly-detect", (req, res) =>
  proxyToAI("/api/ai/anomaly-detect", req, res)
);

// Single student deep dive
router.get("/student/:id", (req, res) =>
  proxyToAI(`/api/ai/student/${req.params.id}`, req, res)
);

module.exports = router;
