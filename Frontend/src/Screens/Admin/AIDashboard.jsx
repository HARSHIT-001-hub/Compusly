/**
 * AIDashboard.jsx
 * Place at: Frontend/src/Screens/Admin/AIDashboard.jsx
 *
 * Features:
 *  - Summary cards (total students, avg SGPA, at-risk, top performers)
 *  - Performance Predictor  (bar chart: current vs predicted %)
 *  - Grade Classifier        (doughnut chart + student table)
 *  - Anomaly Detector        (highlighted anomaly cards)
 *  - Semester Trend          (line chart)
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler
);

// ── Config ────────────────────────────────────────────────────────────────────
const AI_BASE = process.env.REACT_APP_APILINK
  ? `${process.env.REACT_APP_APILINK}/ai`
  : "http://localhost:4000/api/ai";

// ── Colour palette (matches Compusly's blue theme) ───────────────────────────
const BLUE   = "#3B82F6";
const INDIGO = "#6366F1";
const TEAL   = "#14B8A6";
const AMBER  = "#F59E0B";
const RED    = "#EF4444";
const GREEN  = "#22C55E";
const PURPLE = "#A855F7";

const GRADE_COLORS = {
  O: GREEN, "A+": TEAL, A: BLUE, "B+": INDIGO,
  B: PURPLE, C: AMBER, F: RED,
};

// ── Small helpers ─────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="flex justify-center items-center py-16">
    <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
  </div>
);

const ErrorBox = ({ msg }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 my-4 text-sm">
    ⚠️ {msg}
  </div>
);

const SummaryCard = ({ title, value, sub, color, icon }) => (
  <div className={`rounded-2xl p-5 shadow-md text-white`} style={{ background: color }}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium opacity-90">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs opacity-75 mt-1">{sub}</p>}
      </div>
      <span className="text-3xl opacity-80">{icon}</span>
    </div>
  </div>
);

const Badge = ({ text, color }) => (
  <span
    className="px-2 py-0.5 rounded-full text-xs font-semibold"
    style={{ background: `${color}22`, color }}
  >
    {text}
  </span>
);

const severityColor = (s) =>
  s === "High" ? RED : s === "Medium" ? AMBER : GREEN;

// ── Main Component ────────────────────────────────────────────────────────────
const AIDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [summary,   setSummary]   = useState(null);
  const [predict,   setPredict]   = useState([]);
  const [grades,    setGrades]    = useState([]);
  const [anomalies, setAnomalies] = useState({ data: [], anomalies: [] });
  const [loading,   setLoading]   = useState({});
  const [errors,    setErrors]    = useState({});

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  const fetchJSON = useCallback(async (key, endpoint) => {
    setLoading(p => ({ ...p, [key]: true }));
    setErrors(p => ({ ...p, [key]: null }));
    try {
      const res  = await fetch(`${AI_BASE}${endpoint}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Unknown error");
      return json;
    } catch (e) {
      setErrors(p => ({ ...p, [key]: e.message }));
      return null;
    } finally {
      setLoading(p => ({ ...p, [key]: false }));
    }
  }, []);

  // ── Data loads ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchJSON("summary", "/dashboard-summary").then(d => d && setSummary(d.data));
  }, [fetchJSON]);

  useEffect(() => {
    if (activeTab === "predictor") {
      fetchJSON("predict", "/predict-performance").then(d => d && setPredict(d.data));
    }
    if (activeTab === "grades") {
      fetchJSON("grades", "/grade-classify").then(d => d && setGrades(d.data));
    }
    if (activeTab === "anomaly") {
      fetchJSON("anomaly", "/anomaly-detect").then(d => d && setAnomalies(d));
    }
  }, [activeTab, fetchJSON]);

  // ── Chart data builders ───────────────────────────────────────────────────
  const predictChartData = () => {
    const top = predict.slice(0, 12);
    return {
      labels: top.map(s => s.name.split(" ")[0] + " " + s.enrollment_no),
      datasets: [
        {
          label: "Current %",
          data: top.map(s => s.current_avg),
          backgroundColor: BLUE + "CC",
          borderRadius: 6,
        },
        {
          label: "Predicted %",
          data: top.map(s => s.predicted_pct),
          backgroundColor: TEAL + "CC",
          borderRadius: 6,
        },
      ],
    };
  };

  const gradeChartData = () => {
    const dist = {};
    grades.forEach(s => { dist[s.grade] = (dist[s.grade] || 0) + 1; });
    const labels = Object.keys(dist);
    return {
      labels,
      datasets: [{
        data: labels.map(l => dist[l]),
        backgroundColor: labels.map(l => GRADE_COLORS[l] || PURPLE),
        borderWidth: 2,
        borderColor: "#fff",
      }],
    };
  };

  const trendChartData = () => {
    if (!summary?.semesterAvgTrend) return null;
    const sorted = [...summary.semesterAvgTrend].sort((a, b) => a.sem - b.sem);
    return {
      labels: sorted.map(s => `Sem ${s.sem}`),
      datasets: [{
        label: "Avg Performance %",
        data: sorted.map(s => s.avg),
        fill: true,
        backgroundColor: BLUE + "33",
        borderColor: BLUE,
        tension: 0.4,
        pointBackgroundColor: BLUE,
        pointRadius: 5,
      }],
    };
  };

  // ── Tab definitions ────────────────────────────────────────────────────────
  const TABS = [
    { id: "overview",  label: "📊 Overview"    },
    { id: "predictor", label: "🎯 Predictor"   },
    { id: "grades",    label: "📋 Grades"      },
    { id: "anomaly",   label: "🔍 Anomalies"   },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 pb-10">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🤖 Compusly AI Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Machine Learning powered academic analytics
          </p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
          ● Live
        </span>
      </div>

      {/* ── Summary Cards ── */}
      {loading.summary && <Spinner />}
      {errors.summary && <ErrorBox msg={errors.summary} />}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            title="Total Students"
            value={summary.totalStudents}
            sub="Registered in DB"
            color={BLUE}
            icon="🎓"
          />
          <SummaryCard
            title="Avg SGPA"
            value={summary.avgSGPA}
            sub="Across all semesters"
            color={INDIGO}
            icon="📈"
          />
          <SummaryCard
            title="At Risk"
            value={summary.atRisk}
            sub="SGPA < 5.0"
            color={RED}
            icon="⚠️"
          />
          <SummaryCard
            title="Top Performers"
            value={summary.topPerformers}
            sub="SGPA ≥ 9.0"
            color={GREEN}
            icon="🏆"
          />
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === t.id
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════
          TAB: Overview — semester trend + grade distribution
          ════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && summary && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Semester trend */}
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="font-semibold text-gray-700 mb-4">
              📉 Semester-wise Avg Performance
            </h2>
            {trendChartData() ? (
              <Line
                data={trendChartData()}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { min: 0, max: 100, ticks: { stepSize: 20 } },
                  },
                }}
              />
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No semester data yet</p>
            )}
          </div>

          {/* Grade distribution */}
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="font-semibold text-gray-700 mb-4">
              🎓 Grade Distribution
            </h2>
            {summary.gradeDistribution && Object.keys(summary.gradeDistribution).length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-48 mx-auto">
                  <Doughnut
                    data={{
                      labels: Object.keys(summary.gradeDistribution),
                      datasets: [{
                        data: Object.values(summary.gradeDistribution),
                        backgroundColor: Object.keys(summary.gradeDistribution)
                          .map(g => GRADE_COLORS[g] || PURPLE),
                        borderWidth: 2,
                        borderColor: "#fff",
                      }],
                    }}
                    options={{
                      plugins: { legend: { position: "right" } },
                      cutout: "65%",
                    }}
                  />
                </div>
                {/* Legend table */}
                <div className="flex-1">
                  {Object.entries(summary.gradeDistribution).map(([g, c]) => (
                    <div key={g} className="flex justify-between text-sm py-1 border-b last:border-0">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full inline-block"
                          style={{ background: GRADE_COLORS[g] || PURPLE }} />
                        Grade {g}
                      </span>
                      <span className="font-semibold">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No grade data yet</p>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB: Performance Predictor
          ════════════════════════════════════════════════════════════ */}
      {activeTab === "predictor" && (
        <div>
          {loading.predict && <Spinner />}
          {errors.predict  && <ErrorBox msg={errors.predict} />}
          {!loading.predict && predict.length > 0 && (
            <>
              <div className="bg-white rounded-2xl shadow p-5 mb-6">
                <h2 className="font-semibold text-gray-700 mb-1">
                  🎯 End-Term Performance Prediction
                </h2>
                <p className="text-xs text-gray-400 mb-4">
                  Ridge Regression model trained on past marks, consistency, and semester
                </p>
                <Bar
                  data={predictChartData()}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: "top" } },
                    scales: {
                      y: { min: 0, max: 100, ticks: { stepSize: 20 } },
                    },
                  }}
                />
              </div>

              {/* Prediction table */}
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-5 py-4 border-b">
                  <h3 className="font-semibold text-gray-700">
                    All Students — Prediction Detail
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        {["#", "Name", "Enrollment", "Current %", "Predicted %", "SGPA", "Grade", "Trend"].map(h => (
                          <th key={h} className="px-4 py-3 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {predict.map((s, i) => (
                        <tr key={s.student_id} className="border-b hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                          <td className="px-4 py-3 text-gray-600">{s.enrollment_no}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full bg-blue-400"
                                  style={{ width: `${s.current_avg}%` }}
                                />
                              </div>
                              <span>{s.current_avg}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full bg-teal-400"
                                  style={{ width: `${s.predicted_pct}%` }}
                                />
                              </div>
                              <span>{s.predicted_pct}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold" style={{ color: BLUE }}>
                              {s.predicted_sgpa}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              text={s.predicted_grade}
                              color={GRADE_COLORS[s.predicted_grade] || PURPLE}
                            />
                          </td>
                          <td className="px-4 py-3 text-lg">
                            <span style={{ color: s.trend === "↑" ? GREEN : RED }}>
                              {s.trend}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          {!loading.predict && predict.length === 0 && !errors.predict && (
            <div className="text-center text-gray-400 py-16">
              <p className="text-4xl mb-3">📭</p>
              <p>No student marks data available yet.</p>
              <p className="text-sm mt-1">Add marks via Faculty → Upload Marks first.</p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB: Grade Classifier
          ════════════════════════════════════════════════════════════ */}
      {activeTab === "grades" && (
        <div>
          {loading.grades && <Spinner />}
          {errors.grades  && <ErrorBox msg={errors.grades} />}
          {!loading.grades && grades.length > 0 && (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Doughnut */}
                <div className="bg-white rounded-2xl shadow p-5 flex flex-col items-center">
                  <h2 className="font-semibold text-gray-700 mb-3 self-start">
                    📊 Grade Breakdown
                  </h2>
                  <div className="w-56">
                    <Doughnut
                      data={gradeChartData()}
                      options={{
                        plugins: { legend: { position: "bottom" } },
                        cutout: "60%",
                      }}
                    />
                  </div>
                </div>

                {/* Status buckets */}
                <div className="bg-white rounded-2xl shadow p-5">
                  <h2 className="font-semibold text-gray-700 mb-3">
                    🏷️ Performance Status
                  </h2>
                  {["Excellent", "Good", "Average", "At Risk"].map(status => {
                    const count = grades.filter(g => g.status === status).length;
                    const pct   = Math.round(count / grades.length * 100);
                    const color = status === "Excellent" ? GREEN
                                : status === "Good"      ? BLUE
                                : status === "Average"   ? AMBER
                                : RED;
                    return (
                      <div key={status} className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{status}</span>
                          <span style={{ color }}>{count} students ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grade table */}
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-5 py-4 border-b">
                  <h3 className="font-semibold text-gray-700">SGPA & Grade Table</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        {["#", "Name", "Enrollment", "Semester", "Branch", "Avg %", "SGPA", "Grade", "Status"].map(h => (
                          <th key={h} className="px-4 py-3 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {grades.map((s, i) => (
                        <tr key={s.student_id} className="border-b hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                          <td className="px-4 py-3 font-medium">{s.name}</td>
                          <td className="px-4 py-3 text-gray-600">{s.enrollment_no}</td>
                          <td className="px-4 py-3">{s.semester}</td>
                          <td className="px-4 py-3 text-gray-600">{s.branch}</td>
                          <td className="px-4 py-3 font-semibold">{s.avg_pct}%</td>
                          <td className="px-4 py-3 font-bold text-blue-600">{s.sgpa}</td>
                          <td className="px-4 py-3">
                            <Badge text={s.grade} color={GRADE_COLORS[s.grade] || PURPLE} />
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              text={s.status}
                              color={
                                s.status === "Excellent" ? GREEN :
                                s.status === "Good" ? BLUE :
                                s.status === "Average" ? AMBER : RED
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          {!loading.grades && grades.length === 0 && !errors.grades && (
            <div className="text-center text-gray-400 py-16">
              <p className="text-4xl mb-3">📭</p>
              <p>No grade data available. Upload marks first.</p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB: Anomaly Detector
          ════════════════════════════════════════════════════════════ */}
      {activeTab === "anomaly" && (
        <div>
          {loading.anomaly && <Spinner />}
          {errors.anomaly  && <ErrorBox msg={errors.anomaly} />}
          {!loading.anomaly && anomalies.data && anomalies.data.length > 0 && (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl shadow p-4 text-center">
                  <p className="text-3xl font-bold text-gray-800">{anomalies.total}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Analysed</p>
                </div>
                <div className="bg-red-50 rounded-2xl shadow p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">{anomalies.anomaly_count}</p>
                  <p className="text-sm text-red-400 mt-1">Anomalies Detected</p>
                </div>
                <div className="bg-green-50 rounded-2xl shadow p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {anomalies.total - anomalies.anomaly_count}
                  </p>
                  <p className="text-sm text-green-500 mt-1">Normal Patterns</p>
                </div>
              </div>

              {/* Anomaly cards */}
              {anomalies.anomalies.length > 0 && (
                <div className="mb-6">
                  <h2 className="font-semibold text-gray-700 mb-3">
                    🚨 Flagged Students
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {anomalies.anomalies.map(s => (
                      <div
                        key={s.student_id}
                        className="bg-white rounded-2xl shadow border-l-4 p-4"
                        style={{ borderColor: severityColor(s.severity) }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-800">{s.name}</p>
                            <p className="text-xs text-gray-500">
                              {s.enrollment_no} • Sem {s.semester} • {s.branch}
                            </p>
                          </div>
                          <Badge
                            text={s.severity}
                            color={severityColor(s.severity)}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-center mb-3">
                          <div className="bg-gray-50 rounded-lg py-2">
                            <p className="font-bold text-gray-800">{s.avg_pct}%</p>
                            <p className="text-gray-400">Avg</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg py-2">
                            <p className="font-bold text-red-500">{s.min_pct}%</p>
                            <p className="text-gray-400">Min</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg py-2">
                            <p className="font-bold text-green-500">{s.max_pct}%</p>
                            <p className="text-gray-400">Max</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {s.reasons.map((r, idx) => (
                            <p key={idx} className="text-xs text-red-600 flex items-center gap-1">
                              <span>⚡</span> {r}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full table */}
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-5 py-4 border-b flex justify-between items-center">
                  <h3 className="font-semibold text-gray-700">All Students — Anomaly Analysis</h3>
                  <span className="text-xs text-gray-400">Isolation Forest · Contamination 15%</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        {["Name", "Enrollment", "Avg%", "Min%", "Max%", "Std%", "Status", "Reason"].map(h => (
                          <th key={h} className="px-4 py-3 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {anomalies.data.map(s => (
                        <tr
                          key={s.student_id}
                          className={`border-b transition-colors ${
                            s.is_anomaly ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-4 py-3 font-medium">{s.name}</td>
                          <td className="px-4 py-3 text-gray-600">{s.enrollment_no}</td>
                          <td className="px-4 py-3 font-semibold">{s.avg_pct}%</td>
                          <td className="px-4 py-3 text-red-500">{s.min_pct}%</td>
                          <td className="px-4 py-3 text-green-600">{s.max_pct}%</td>
                          <td className="px-4 py-3 text-amber-600">{s.std_pct}%</td>
                          <td className="px-4 py-3">
                            <Badge
                              text={s.severity}
                              color={severityColor(s.severity)}
                            />
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                            {s.reasons[0]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          {!loading.anomaly && (!anomalies.data || anomalies.data.length === 0) && !errors.anomaly && (
            <div className="text-center text-gray-400 py-16">
              <p className="text-4xl mb-3">🔍</p>
              <p>Need at least 5 students with marks to run anomaly detection.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AIDashboard;
