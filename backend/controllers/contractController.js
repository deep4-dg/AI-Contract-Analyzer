const { v4: uuidv4 } = require("uuid");
const pool = require("../config/db");

const {
  analyzeContractWithAI,
  compareContractsWithAI,
  extractClausesOnly
} = require("../services/aiService");

const { saveAuditLog } = require("../services/auditService");

exports.analyzeContract = async (req, res) => {
  try {
    const { contractText, language } = req.body;

    if (!contractText || contractText.trim().length < 20) {
      return res.status(400).json({
        error: "Please provide valid contract text."
      });
    }

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

    res.json({
      referenceId,
      status: "COMPLETED",
      result
    });
  } catch (err) {
    res.status(500).json({
      error: "Contract analysis failed",
      details: err.message
    });
  }
};

exports.extractClauses = async (req, res) => {
  try {
    const { contractText } = req.body;

    if (!contractText || contractText.trim().length < 20) {
      return res.status(400).json({
        error: "Please provide valid contract text."
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
    res.status(500).json({
      error: "Clause extraction failed",
      details: err.message
    });
  }
};

exports.getContractResult = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await pool.query(
      "SELECT * FROM contract_analyses WHERE reference_id=$1",
      [id]
    );

    if (data.rows.length === 0) {
      return res.status(404).json({ error: "Result not found" });
    }

    res.json(data.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch result",
      details: err.message
    });
  }
};

exports.compareContracts = async (req, res) => {
  try {
    const { oldContract, newContract } = req.body;

    if (!oldContract || !newContract) {
      return res.status(400).json({
        error: "Both oldContract and newContract are required."
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
    res.status(500).json({
      error: "Contract comparison failed",
      details: err.message
    });
  }
};