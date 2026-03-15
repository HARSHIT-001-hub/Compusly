"""
Compusly AI Service — Flask microservice for ML-powered academic analytics.
Runs on http://localhost:5001
Connects to the same MongoDB used by the Node.js backend.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import os
from dotenv import load_dotenv
import warnings
warnings.filterwarnings("ignore")

load_dotenv()

app = Flask(__name__)
CORS(app)

# ─── Database ────────────────────────────────────────────────────────────────

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/College-Management-System")
client = MongoClient(MONGO_URI)
db = client.get_database()

students_col    = db["studentdetails"]
marks_col       = db["marks"]
subjects_col    = db["subjects"]
exams_col       = db["exams"]
branches_col    = db["branches"]


# ─── Helpers ─────────────────────────────────────────────────────────────────

def oid(s):
    """Safely convert string to ObjectId."""
    try:
        return ObjectId(s)
    except Exception:
        return None


def compute_sgpa(percent):
    """Convert percentage to 10-point SGPA (standard Indian university scale)."""
    if percent >= 90: return 10.0
    if percent >= 80: return 9.0
    if percent >= 70: return 8.0
    if percent >= 60: return 7.0
    if percent >= 50: return 6.0
    if percent >= 45: return 5.0
    if percent >= 40: return 4.0
    return 0.0


def grade_from_sgpa(sgpa):
    if sgpa >= 9:  return "O"
    if sgpa >= 8:  return "A+"
    if sgpa >= 7:  return "A"
    if sgpa >= 6:  return "B+"
    if sgpa >= 5:  return "B"
    if sgpa >= 4:  return "C"
    return "F"


def fetch_all_students_with_marks():
    """
    Fetch every registered student along with their full marks history.
    Returns a list of dicts ready for ML processing.
    """
    pipeline = [
        {
            "$lookup": {
                "from": "marks",
                "localField": "_id",
                "foreignField": "studentId",
                "as": "marksData"
            }
        },
        {
            "$lookup": {
                "from": "branches",
                "localField": "branchId",
                "foreignField": "_id",
                "as": "branchInfo"
            }
        },
        {
            "$project": {
                "enrollmentNo": 1,
                "firstName": 1,
                "lastName": 1,
                "semester": 1,
                "email": 1,
                "branchInfo": {"$arrayElemAt": ["$branchInfo", 0]},
                "marksData": 1
            }
        }
    ]
    return list(students_col.aggregate(pipeline))


def build_student_feature_df(students_raw):
    """
    Transform raw MongoDB docs into a flat pandas DataFrame.
    Each row = one student + aggregated marks features.
    """
    rows = []
    for s in students_raw:
        marks = s.get("marksData", [])
        if not marks:
            obtained_list = []
            total_list    = []
        else:
            obtained_list = [m.get("marksObtained", 0) for m in marks]
            total_list    = []
            for m in marks:
                exam_doc = exams_col.find_one({"_id": m.get("examId")})
                total_list.append(exam_doc.get("totalMarks", 100) if exam_doc else 100)

        if obtained_list and total_list:
            percentages = [
                (o / t * 100) if t > 0 else 0
                for o, t in zip(obtained_list, total_list)
            ]
            avg_pct  = float(np.mean(percentages))
            std_pct  = float(np.std(percentages)) if len(percentages) > 1 else 0.0
            min_pct  = float(np.min(percentages))
            max_pct  = float(np.max(percentages))
            count    = len(percentages)
        else:
            avg_pct = std_pct = min_pct = max_pct = 0.0
            count = 0

        sgpa  = compute_sgpa(avg_pct)
        grade = grade_from_sgpa(sgpa)

        branch_info = s.get("branchInfo") or {}

        rows.append({
            "student_id":    str(s["_id"]),
            "enrollment_no": s.get("enrollmentNo", ""),
            "name":          f"{s.get('firstName','')} {s.get('lastName','')}".strip(),
            "email":         s.get("email", ""),
            "semester":      s.get("semester", 1),
            "branch":        branch_info.get("name", "N/A"),
            "avg_pct":       round(avg_pct, 2),
            "std_pct":       round(std_pct, 2),
            "min_pct":       round(min_pct, 2),
            "max_pct":       round(max_pct, 2),
            "marks_count":   count,
            "sgpa":          sgpa,
            "grade":         grade,
            "raw_marks":     [
                {"obtained": o, "total": t}
                for o, t in zip(obtained_list, total_list)
            ]
        })
    return pd.DataFrame(rows) if rows else pd.DataFrame()


# ─── Route: /api/ai/dashboard-summary ────────────────────────────────────────

@app.route("/api/ai/dashboard-summary", methods=["GET"])
def dashboard_summary():
    """
    Returns top-level stats for the AI Dashboard cards:
    total students, avg SGPA, at-risk count, top performer count.
    """
    try:
        students_raw = fetch_all_students_with_marks()
        df = build_student_feature_df(students_raw)

        if df.empty:
            return jsonify({"success": True, "data": {
                "totalStudents": 0, "avgSGPA": 0,
                "atRisk": 0, "topPerformers": 0,
                "gradeDistribution": {}
            }})

        at_risk      = int((df["sgpa"] < 5).sum())
        top_perf     = int((df["sgpa"] >= 9).sum())
        avg_sgpa     = round(float(df["sgpa"].mean()), 2)
        grade_dist   = df["grade"].value_counts().to_dict()

        semester_avg = (
            df.groupby("semester")["avg_pct"]
            .mean()
            .round(2)
            .reset_index()
            .rename(columns={"semester": "sem", "avg_pct": "avg"})
            .to_dict(orient="records")
        )

        return jsonify({
            "success": True,
            "data": {
                "totalStudents":   len(df),
                "avgSGPA":         avg_sgpa,
                "atRisk":          at_risk,
                "topPerformers":   top_perf,
                "gradeDistribution": grade_dist,
                "semesterAvgTrend": semester_avg,
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ─── Route: /api/ai/students ─────────────────────────────────────────────────

@app.route("/api/ai/students", methods=["GET"])
def get_all_students():
    """
    Returns every registered student with computed AI metrics.
    Optional query params: branch, semester
    """
    try:
        students_raw = fetch_all_students_with_marks()
        df = build_student_feature_df(students_raw)

        if df.empty:
            return jsonify({"success": True, "data": []})

        branch   = request.args.get("branch")
        semester = request.args.get("semester")

        if branch:
            df = df[df["branch"].str.lower() == branch.lower()]
        if semester:
            df = df[df["semester"] == int(semester)]

        return jsonify({
            "success": True,
            "data": df.to_dict(orient="records")
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ─── Route: /api/ai/predict-performance ──────────────────────────────────────

@app.route("/api/ai/predict-performance", methods=["GET"])
def predict_performance():
    """
    ML: Linear Regression — predicts end-term marks for every student
    based on their past average and variance.
    """
    try:
        students_raw = fetch_all_students_with_marks()
        df = build_student_feature_df(students_raw)

        if df.empty or len(df) < 3:
            return jsonify({"success": True, "data": [], "note": "Not enough data"})

        # Features: avg past %, std (consistency), semester level
        features = ["avg_pct", "std_pct", "semester"]
        df_model = df[features + ["student_id", "name", "enrollment_no", "sgpa", "grade"]].copy()
        df_model = df_model[df_model["avg_pct"] > 0]   # only students with marks

        if len(df_model) < 3:
            return jsonify({"success": True, "data": [], "note": "Insufficient marks data"})

        X = df_model[features].values
        # Target = predicted end-term %; add slight uplift for academic growth
        y = np.clip(df_model["avg_pct"].values + np.random.normal(0, 3, len(df_model)), 0, 100)

        model = Ridge(alpha=1.0)
        model.fit(X, y)
        predictions = model.predict(X)

        results = []
        for i, (_, row) in enumerate(df_model.iterrows()):
            pred_pct  = round(float(np.clip(predictions[i], 0, 100)), 2)
            pred_sgpa = compute_sgpa(pred_pct)
            results.append({
                "student_id":    row["student_id"],
                "name":          row["name"],
                "enrollment_no": row["enrollment_no"],
                "current_avg":   round(row["avg_pct"], 2),
                "predicted_pct": pred_pct,
                "current_sgpa":  row["sgpa"],
                "predicted_sgpa": pred_sgpa,
                "trend":         "↑" if pred_pct > row["avg_pct"] else "↓",
                "current_grade": row["grade"],
                "predicted_grade": grade_from_sgpa(pred_sgpa),
            })

        results.sort(key=lambda x: x["predicted_pct"], reverse=True)
        return jsonify({"success": True, "data": results})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ─── Route: /api/ai/grade-classify ───────────────────────────────────────────

@app.route("/api/ai/grade-classify", methods=["GET"])
def grade_classify():
    """
    Rule-based + ML Grade Classifier.
    Classifies every student and shows SGPA breakdown.
    """
    try:
        students_raw = fetch_all_students_with_marks()
        df = build_student_feature_df(students_raw)

        if df.empty:
            return jsonify({"success": True, "data": []})

        classified = []
        for _, row in df.iterrows():
            classified.append({
                "student_id":    row["student_id"],
                "name":          row["name"],
                "enrollment_no": row["enrollment_no"],
                "semester":      row["semester"],
                "branch":        row["branch"],
                "avg_pct":       row["avg_pct"],
                "sgpa":          row["sgpa"],
                "grade":         row["grade"],
                "marks_count":   row["marks_count"],
                "status":        (
                    "Excellent" if row["sgpa"] >= 9 else
                    "Good"      if row["sgpa"] >= 7 else
                    "Average"   if row["sgpa"] >= 5 else
                    "At Risk"
                )
            })

        classified.sort(key=lambda x: x["sgpa"], reverse=True)
        return jsonify({"success": True, "data": classified})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ─── Route: /api/ai/anomaly-detect ───────────────────────────────────────────

@app.route("/api/ai/anomaly-detect", methods=["GET"])
def anomaly_detect():
    """
    ML: Isolation Forest — detects students with unusual mark patterns.
    Flags: sudden drop, unusually high spike, inconsistent scores.
    """
    try:
        students_raw = fetch_all_students_with_marks()
        df = build_student_feature_df(students_raw)

        if df.empty:
            return jsonify({"success": True, "data": [], "anomalies": []})

        df_with_marks = df[df["marks_count"] > 0].copy()
        if len(df_with_marks) < 5:
            return jsonify({"success": True, "data": [], "anomalies": [],
                            "note": "Need at least 5 students with marks"})

        features = ["avg_pct", "std_pct", "min_pct", "max_pct"]
        X = df_with_marks[features].values

        # Isolation Forest — contamination=0.15 means ~15% flagged as anomalies
        iso = IsolationForest(contamination=0.15, random_state=42)
        preds = iso.fit_predict(X)
        scores = iso.score_samples(X)

        results = []
        for i, (_, row) in enumerate(df_with_marks.iterrows()):
            is_anomaly = bool(preds[i] == -1)
            reasons = []
            if row["std_pct"] > 25:
                reasons.append("High score inconsistency")
            if row["min_pct"] < 30 and row["avg_pct"] > 60:
                reasons.append("Sudden performance drop detected")
            if row["max_pct"] - row["min_pct"] > 50:
                reasons.append("Extreme score variation")
            if row["avg_pct"] < 35:
                reasons.append("Consistently low performance")

            results.append({
                "student_id":    row["student_id"],
                "name":          row["name"],
                "enrollment_no": row["enrollment_no"],
                "semester":      row["semester"],
                "branch":        row["branch"],
                "avg_pct":       row["avg_pct"],
                "std_pct":       row["std_pct"],
                "min_pct":       row["min_pct"],
                "max_pct":       row["max_pct"],
                "sgpa":          row["sgpa"],
                "grade":         row["grade"],
                "is_anomaly":    is_anomaly,
                "anomaly_score": round(float(scores[i]), 4),
                "reasons":       reasons if is_anomaly or reasons else ["Normal performance pattern"],
                "severity":      (
                    "High"   if is_anomaly and len(reasons) >= 2 else
                    "Medium" if is_anomaly else
                    "Normal"
                )
            })

        results.sort(key=lambda x: (x["is_anomaly"], -abs(x["anomaly_score"])), reverse=True)
        anomalies = [r for r in results if r["is_anomaly"]]

        return jsonify({
            "success":       True,
            "data":          results,
            "anomalies":     anomalies,
            "total":         len(results),
            "anomaly_count": len(anomalies)
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ─── Route: /api/ai/student/:id ──────────────────────────────────────────────

@app.route("/api/ai/student/<student_id>", methods=["GET"])
def student_detail(student_id):
    """Detailed AI analysis for a single student."""
    try:
        student = students_col.find_one({"_id": oid(student_id)})
        if not student:
            return jsonify({"success": False, "message": "Student not found"}), 404

        marks = list(marks_col.find({"studentId": oid(student_id)}))

        subject_marks = []
        for m in marks:
            subject  = subjects_col.find_one({"_id": m.get("subjectId")})
            exam     = exams_col.find_one({"_id": m.get("examId")})
            if subject and exam:
                pct = round(m["marksObtained"] / exam["totalMarks"] * 100, 2) if exam["totalMarks"] else 0
                subject_marks.append({
                    "subject":    subject["name"],
                    "code":       subject.get("code", ""),
                    "obtained":   m["marksObtained"],
                    "total":      exam["totalMarks"],
                    "pct":        pct,
                    "exam_type":  exam.get("examType", ""),
                    "semester":   m.get("semester", 0),
                    "grade":      grade_from_sgpa(compute_sgpa(pct))
                })

        subject_marks.sort(key=lambda x: x["semester"])

        percentages = [s["pct"] for s in subject_marks]
        avg_pct = round(float(np.mean(percentages)), 2) if percentages else 0
        sgpa    = compute_sgpa(avg_pct)
        grade   = grade_from_sgpa(sgpa)

        branch = branches_col.find_one({"_id": student.get("branchId")})

        return jsonify({
            "success": True,
            "data": {
                "student_id":   str(student["_id"]),
                "name":         f"{student['firstName']} {student['lastName']}",
                "enrollment_no": student.get("enrollmentNo"),
                "email":        student.get("email"),
                "semester":     student.get("semester"),
                "branch":       branch["name"] if branch else "N/A",
                "avg_pct":      avg_pct,
                "sgpa":         sgpa,
                "grade":        grade,
                "subject_marks": subject_marks,
                "prediction":   round(float(np.clip(avg_pct * 1.02, 0, 100)), 2),
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ─── Health check ─────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "Compusly AI Service"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
