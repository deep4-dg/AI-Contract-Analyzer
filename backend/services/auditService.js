const crypto = require("crypto");
const pool = require("../config/db");

// ═══════════════════════════════════════════════════════════════════════════
// PII Redaction (SRS §3.6)
// Redacts emails, phone numbers, Aadhaar, PAN, credit cards from input text
// before storing in audit log
// ═══════════════════════════════════════════════════════════════════════════
function redactPII(text) {
  if (!text) return text;

  return text
    // Email addresses → [EMAIL_REDACTED]
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[EMAIL_REDACTED]")

    // Indian phone numbers (+91-XXXXXXXXXX, 10 digits)
    .replace(/(\+91[\s-]?)?[6-9]\d{9}/g, "[PHONE_REDACTED]")

    // International phone numbers
    .replace(/\+\d{1,3}[\s-]?\d{3,4}[\s-]?\d{3,4}[\s-]?\d{3,4}/g, "[PHONE_REDACTED]")

    // Aadhaar numbers (12 digits, often in XXXX XXXX XXXX format)
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[AADHAAR_REDACTED]")

    // PAN (5 letters, 4 digits, 1 letter)
    .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, "[PAN_REDACTED]")

    // Credit card numbers (16 digits with or without spaces/dashes)
    .replace(/\b(?:\d[ -]*?){13,16}\b/g, "[CARD_REDACTED]");
}

// ═══════════════════════════════════════════════════════════════════════════
// Tamper-Evident Checksum (SRS §3.6)
// SHA-256 hash of the logged content. If anyone modifies the row in the DB,
// the checksum will no longer match when recomputed — proving tampering.
// ═══════════════════════════════════════════════════════════════════════════
function computeChecksum({ referenceId, inputText, outputJson, modelVersion, promptVersion, confidenceScore }) {
  const payload = JSON.stringify({
    referenceId,
    inputText,
    outputJson,
    modelVersion,
    promptVersion,
    confidenceScore
  });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

// ═══════════════════════════════════════════════════════════════════════════
// Save audit log entry (tamper-evident, PII-redacted)
// ═══════════════════════════════════════════════════════════════════════════
exports.saveAuditLog = async ({
  referenceId,
  inputText,
  outputJson,
  modelVersion,
  promptVersion,
  confidenceScore
}) => {
  try {
    // Redact PII from input text before storing
    const redactedInput = redactPII(inputText);

    // Compute tamper-evident checksum from the REDACTED content
    const checksum = computeChecksum({
      referenceId,
      inputText: redactedInput,
      outputJson,
      modelVersion,
      promptVersion,
      confidenceScore
    });

    await pool.query(
      `INSERT INTO audit_logs 
       (reference_id, input_text, output_json, model_version, prompt_version, confidence_score, checksum)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        referenceId,
        redactedInput,
        outputJson,
        modelVersion,
        promptVersion,
        confidenceScore,
        checksum
      ]
    );

    console.log(`[AUDIT] Logged ${referenceId} | checksum=${checksum.slice(0, 8)}...`);
  } catch (err) {
    console.error("[AUDIT] Failed to save log:", err.message);
    // Do NOT throw — audit failure should not break the main analysis flow
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// Verify tamper-evidence of an existing audit row
// (Exposed for potential admin endpoint)
// ═══════════════════════════════════════════════════════════════════════════
exports.verifyAuditLog = async (referenceId) => {
  const data = await pool.query(
    "SELECT * FROM audit_logs WHERE reference_id = $1",
    [referenceId]
  );

  if (data.rows.length === 0) return { valid: false, error: "Not found" };

  const row = data.rows[0];
  const expectedChecksum = computeChecksum({
    referenceId: row.reference_id,
    inputText: row.input_text,
    outputJson: row.output_json,
    modelVersion: row.model_version,
    promptVersion: row.prompt_version,
    confidenceScore: row.confidence_score
  });

  return {
    valid: expectedChecksum === row.checksum,
    storedChecksum: row.checksum,
    expectedChecksum
  };
};

// Expose helpers for testing
exports._redactPII = redactPII;
exports._computeChecksum = computeChecksum;