const pool = require("../config/db");

// ─── In-memory settings store (persists until server restart) ───────────────
// In production, replace with a DB-backed settings table
let runtimeSettings = {
  confidenceThreshold: Number(process.env.CONFIDENCE_THRESHOLD || 0.6),
  rateLimit: Number(process.env.RATE_LIMIT || 100)
};

// ─── Helper: build CSV safely (handles commas/newlines in values) ────────────
function toCSV(rows) {
  const escape = (val) => {
    if (val === null || val === undefined) return "";
    const str = String(val).replace(/"/g, '""');
    return /[",\n]/.test(str) ? `"${str}"` : str;
  };

  const headers = [
    "id", "reference_id", "model_version",
    "prompt_version", "confidence_score", "created_at"
  ];

  const lines = [headers.join(",")];

  rows.forEach((row) => {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  });

  return lines.join("\n");
}

// ─── Helper: safe float ──────────────────────────────────────────────────────
function safeFloat(val, decimals = 2) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : parseFloat(n.toFixed(decimals));
}

// ────────────────────────────────────────────────────────────────────────────
// GET /admin/dashboard
// Returns real-time summary: volumes, confidence distribution, error rates
// ────────────────────────────────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const threshold = runtimeSettings.confidenceThreshold;

    // Run all queries in parallel for speed
    const [
      totalResult,
      completedResult,
      failedResult,
      avgResult,
      lowConfResult,
      highConfResult,
      auditCountResult,
      recentResult
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM contract_analyses"),
      pool.query("SELECT COUNT(*) FROM contract_analyses WHERE status = 'COMPLETED'"),
      pool.query("SELECT COUNT(*) FROM contract_analyses WHERE status = 'FAILED'"),
      pool.query("SELECT AVG(confidence_score) FROM contract_analyses WHERE status = 'COMPLETED'"),
      pool.query(
        "SELECT COUNT(*) FROM contract_analyses WHERE confidence_score < $1",
        [threshold]
      ),
      pool.query(
        "SELECT COUNT(*) FROM contract_analyses WHERE confidence_score >= $1",
        [threshold]
      ),
      pool.query("SELECT COUNT(*) FROM audit_logs"),
      pool.query(
        `SELECT reference_id, confidence_score, status, created_at
         FROM contract_analyses
         ORDER BY created_at DESC LIMIT 5`
      )
    ]);

    const total     = Number(totalResult.rows[0].count);
    const completed = Number(completedResult.rows[0].count);
    const failed    = Number(failedResult.rows[0].count);
    const avgConf   = safeFloat(avgResult.rows[0].avg);
    const lowConf   = Number(lowConfResult.rows[0].count);
    const highConf  = Number(highConfResult.rows[0].count);
    const errorRate = total > 0
      ? `${((failed / total) * 100).toFixed(1)}%`
      : "0%";

    // Confidence distribution buckets for chart rendering
    const confidenceDistribution = {
      high:   highConf,   // >= threshold
      low:    lowConf,    // < threshold
      total,
      thresholdUsed: threshold
    };

    res.json({
      // Volumes
      totalRequests:    total,
      completedRequests: completed,
      failedRequests:   failed,
      errorRate,

      // AI Quality
      averageConfidence:    avgConf,
      confidenceDistribution,
      lowConfidenceCases:   lowConf,
      humanReviewRequired:  lowConf,

      // Audit
      auditLogCount: Number(auditCountResult.rows[0].count),

      // Recent activity (for dashboard table)
      recentAnalyses: recentResult.rows,

      // Current tunable settings
      settings: {
        confidenceThreshold: runtimeSettings.confidenceThreshold,
        rateLimit:           runtimeSettings.rateLimit
      }
    });

  } catch (err) {
    console.error("[getDashboard] Error:", err.message);
    res.status(500).json({
      error:   "Dashboard data could not be loaded.",
      details: err.message
    });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// PUT /admin/settings
// Updates confidence threshold and rate limit at runtime (no redeploy needed)
// SRS §3.5 — admin must tune thresholds without redeploying
// ────────────────────────────────────────────────────────────────────────────
exports.updateSettings = async (req, res) => {
  try {
    const { confidenceThreshold, rateLimit } = req.body;

    // Validate confidenceThreshold — must be between 0 and 1
    if (confidenceThreshold !== undefined) {
      const val = parseFloat(confidenceThreshold);
      if (isNaN(val) || val < 0 || val > 1) {
        return res.status(400).json({
          error: "confidenceThreshold must be a number between 0 and 1."
        });
      }
      runtimeSettings.confidenceThreshold = val;
    }

    // Validate rateLimit — must be a positive integer
    if (rateLimit !== undefined) {
      const val = parseInt(rateLimit, 10);
      if (isNaN(val) || val < 1) {
        return res.status(400).json({
          error: "rateLimit must be a positive integer."
        });
      }
      runtimeSettings.rateLimit = val;
    }

    console.log("[updateSettings] Settings updated:", runtimeSettings);

    res.json({
      message:  "Settings updated successfully.",
      settings: runtimeSettings
    });

  } catch (err) {
    console.error("[updateSettings] Error:", err.message);
    res.status(500).json({
      error:   "Failed to update settings.",
      details: err.message
    });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /admin/audit-logs/export?from=YYYY-MM-DD&to=YYYY-MM-DD
// Exports audit logs as a CSV file for a selected time range
// SRS §3.5 — admin must export audit log for a selected time range
// ────────────────────────────────────────────────────────────────────────────
exports.exportAuditLogs = async (req, res) => {
  try {
    const { from, to } = req.query;

    let query = "SELECT * FROM audit_logs";
    const params = [];

    // Optional date range filter
    if (from && to) {
      query += " WHERE created_at BETWEEN $1 AND $2";
      params.push(new Date(from), new Date(to));
    } else if (from) {
      query += " WHERE created_at >= $1";
      params.push(new Date(from));
    } else if (to) {
      query += " WHERE created_at <= $1";
      params.push(new Date(to));
    }

    query += " ORDER BY created_at DESC";

    const logs = await pool.query(query, params);

    if (logs.rows.length === 0) {
      return res.status(404).json({
        error: "No audit logs found for the selected time range."
      });
    }

    const csv      = toCSV(logs.rows);
    const filename = `audit_logs_${Date.now()}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);

  } catch (err) {
    console.error("[exportAuditLogs] Error:", err.message);
    res.status(500).json({
      error:   "Audit log export failed.",
      details: err.message
    });
  }
};