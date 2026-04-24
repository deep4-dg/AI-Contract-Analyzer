const pool = require("../config/db");

exports.saveAuditLog = async ({
  referenceId,
  inputText,
  outputJson,
  modelVersion,
  promptVersion,
  confidenceScore
}) => {
  await pool.query(
    `INSERT INTO audit_logs 
    (reference_id, input_text, output_json, model_version, prompt_version, confidence_score)
    VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      referenceId,
      inputText,
      outputJson,
      modelVersion,
      promptVersion,
      confidenceScore
    ]
  );
};