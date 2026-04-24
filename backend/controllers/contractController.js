const { v4: uuidv4 } = require("uuid");
const pdfParse = require("pdf-parse/lib/pdf-parse.js");
const pool = require("../config/db");

const {
  analyzeContractWithAI,
  compareContractsWithAI,
  extractClausesOnly
} = require("../services/aiService");

const { saveAuditLog } = require("../services/auditService");

// ─── Shared helper: run analysis + save to DB + audit log ───────────────────
// Used by both analyzeContract (text input) and analyzeContractFile (PDF input)
async function runAnalysis(contractText, language) {
  const referenceId = uuidv4();
  const start = Date.now();

  const result = await analyzeContractWithAI(contractText, language);
  result.processingTimeMs = Date.now() - start;

  await pool.query(
    `INSERT INTO contract_analyses
     (reference_id, contract_text, language, result, confidence_score, status)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      referenceId,
      contractText,
      language || "English",
      result,
      result.confidenceScore || 0,
      "COMPLETED"
    ]
  );

  await saveAuditLog({
    referenceId,
    inputText: contractText,
    outputJson: result,
    modelVersion: result.modelVersion,
    promptVersion: result.promptVersion,
    confidenceScore: result.confidenceScore
  });

  return { referenceId, result };
}

// ────────────────────────────────────────────────────────────────────────────
// POST /contracts/analyze
// Analyze a contract passed as plain text
// ────────────────────────────────────────────────────────────────────────────
exports.analyzeContract = async (req, res) => {
  try {
    const { contractText, language } = req.body;

    if (!contractText || contractText.trim().length < 20) {
      return res.status(400).json({
        error: "Please provide valid contract text (minimum 20 characters)."
      });
    }

    const { referenceId, result } = await runAnalysis(contractText, language);

    res.json({
      referenceId,
      status: "COMPLETED",
      sourceType: "text",
      result
    });
  } catch (err) {
    console.error("[analyzeContract] Error:", err.message);
    res.status(500).json({
      error: "Contract analysis failed.",
      details: err.message
    });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// POST /contracts/analyze-file
// Analyze a contract uploaded as a PDF file (via multer)
// Extracts text using pdf-parse, then runs the same analysis pipeline
// ────────────────────────────────────────────────────────────────────────────
exports.analyzeContractFile = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        error: "No PDF file received. Please attach a file with field name 'file'."
      });
    }

    const language = req.body.language || "English";

    // Extract text from the PDF buffer provided by multer
    const pdfData = await pdfParse(req.file.buffer);
    const contractText = pdfData.text.trim();

    // Guard: pdf-parse succeeded but the PDF had no readable text
    // (this happens with scanned-image PDFs without OCR)
    if (!contractText || contractText.length < 20) {
      return res.status(400).json({
        error:
          "Could not extract readable text from the PDF. " +
          "The PDF may be a scanned image. Please paste the text manually instead."
      });
    }

    const { referenceId, result } = await runAnalysis(contractText, language);

    res.json({
      referenceId,
      status: "COMPLETED",
      sourceType: "pdf",
      filename: req.file.originalname,
      extractedChars: contractText.length,
      totalPages: pdfData.numpages,
      result
    });
  } catch (err) {
    console.error("[analyzeContractFile] Error:", err.message);
    res.status(500).json({
      error: "PDF contract analysis failed.",
      details: err.message
    });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// POST /contracts/extract-clauses
// Extract clauses only — faster, no full risk analysis (SRS §3.2)
// ────────────────────────────────────────────────────────────────────────────
exports.extractClauses = async (req, res) => {
  try {
    const { contractText } = req.body;

    if (!contractText || contractText.trim().length < 20) {
      return res.status(400).json({
        error: "Please provide valid contract text (minimum 20 characters)."
      });
    }

    const result = await extractClausesOnly(contractText);

    res.json({
      status: "COMPLETED",
      measurable: true,
      targetSeconds: 3,
      passed: result.processingTimeSeconds <= 3,
      result
    });
  } catch (err) {
    console.error("[extractClauses] Error:", err.message);
    res.status(500).json({
      error: "Clause extraction failed.",
      details: err.message
    });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /contracts/:id/result
// Fetch a previously stored analysis result by reference ID
// ────────────────────────────────────────────────────────────────────────────
exports.getContractResult = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await pool.query(
      "SELECT * FROM contract_analyses WHERE reference_id = $1",
      [id]
    );

    if (data.rows.length === 0) {
      return res.status(404).json({
        error: "Result not found for the given reference ID."
      });
    }

    res.json(data.rows[0]);
  } catch (err) {
    console.error("[getContractResult] Error:", err.message);
    res.status(500).json({
      error: "Failed to fetch result.",
      details: err.message
    });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// POST /contracts/compare
// Compare two contract versions and return redline diff
// ────────────────────────────────────────────────────────────────────────────
exports.compareContracts = async (req, res) => {
  try {
    const { oldContract, newContract } = req.body;

    if (!oldContract || oldContract.trim().length < 20) {
      return res.status(400).json({
        error: "oldContract is required and must be at least 20 characters."
      });
    }
    if (!newContract || newContract.trim().length < 20) {
      return res.status(400).json({
        error: "newContract is required and must be at least 20 characters."
      });
    }

    const referenceId = uuidv4();
    const result = await compareContractsWithAI(oldContract, newContract);

    await pool.query(
      `INSERT INTO contract_comparisons
       (reference_id, old_contract, new_contract, result, confidence_score)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        referenceId,
        oldContract,
        newContract,
        result,
        result.confidenceScore || 0
      ]
    );

    await saveAuditLog({
      referenceId,
      inputText: oldContract + "\n\n" + newContract,
      outputJson: result,
      modelVersion: result.modelVersion,
      promptVersion: result.promptVersion,
      confidenceScore: result.confidenceScore
    });

    res.json({
      referenceId,
      status: "COMPLETED",
      result
    });
  } catch (err) {
    console.error("[compareContracts] Error:", err.message);
    res.status(500).json({
      error: "Contract comparison failed.",
      details: err.message
    });
  }
};