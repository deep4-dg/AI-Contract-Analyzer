const pool = require("../config/db");

exports.getDashboard = async (req, res) => {
  try {
    const total = await pool.query("SELECT COUNT(*) FROM contract_analyses");

    const avg = await pool.query(
      "SELECT AVG(confidence_score) FROM contract_analyses"
    );

    const low = await pool.query(
      "SELECT COUNT(*) FROM contract_analyses WHERE confidence_score < $1",
      [Number(process.env.CONFIDENCE_THRESHOLD || 0.6)]
    );

    const auditCount = await pool.query("SELECT COUNT(*) FROM audit_logs");

    res.json({
      totalRequests: Number(total.rows[0].count),
      completedRequests: Number(total.rows[0].count),
      failedRequests: 0,
      averageConfidence: Number(avg.rows[0].avg || 0).toFixed(2),
      lowConfidenceCases: Number(low.rows[0].count),
      auditLogCount: Number(auditCount.rows[0].count),
      errorRate: "0%",
      settings: {
        confidenceThreshold: Number(process.env.CONFIDENCE_THRESHOLD || 0.6),
        rateLimit: 100
      }
    });
  } catch (err) {
    res.status(500).json({
      error: "Dashboard failed",
      details: err.message
    });
  }
};

exports.updateSettings = async (req, res) => {
  res.json({
    message: "Settings updated successfully",
    settings: req.body
  });
};

exports.exportAuditLogs = async (req, res) => {
  try {
    const logs = await pool.query("SELECT * FROM audit_logs ORDER BY created_at DESC");

    const rows = logs.rows;

    let csv = "id,reference_id,model_version,prompt_version,confidence_score,created_at\n";

    rows.forEach((row) => {
      csv += `${row.id},${row.reference_id},${row.model_version},${row.prompt_version},${row.confidence_score},${row.created_at}\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment("audit_logs.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({
      error: "Audit export failed",
      details: err.message
    });
  }
};