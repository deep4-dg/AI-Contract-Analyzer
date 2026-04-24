const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const rateLimit = require("express-rate-limit");

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles     = require("../middleware/roleMiddleware");

const {
  analyzeContract,
  analyzeContractFile,
  getContractResult,
  compareContracts,
  extractClauses
} = require("../controllers/contractController");

// ─── Allowed roles (all contract operations) ────────────────────────────────
const CONTRACT_ROLES = [
  "LEGAL_PROFESSIONAL",
  "COMPLIANCE_OFFICER",
  "SYSTEM_ADMIN"
];

// ─── Rate Limiter ────────────────────────────────────────────────────────────
// SRS §3.5 — admin can tune rateLimit; this reads from runtimeSettings
// Limits each IP to 30 AI requests per 10 minutes to prevent abuse
const contractLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please wait a few minutes before trying again."
  }
});

// ─── Multer — PDF Upload Config ──────────────────────────────────────────────
// Stores file in memory (buffer) so we can pass it directly to pdf-parse
// Max file size: 5 MB. Only PDF files accepted.
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are accepted. Please upload a .pdf file."));
    }
  }
});

// ─── Input Validator Middleware ───────────────────────────────────────────────
// Rejects short or missing contract text early — before hitting OpenAI
// SRS §3.1 — input validation must reject malformed data with a clear message
function validateContractText(field = "contractText", minLength = 20) {
  return (req, res, next) => {
    const text = req.body[field];
    if (!text || typeof text !== "string" || text.trim().length < minLength) {
      return res.status(400).json({
        error: `'${field}' is required and must be at least ${minLength} characters.`
      });
    }
    next();
  };
}

function validateCompareBody(req, res, next) {
  const { oldContract, newContract } = req.body;
  if (!oldContract || oldContract.trim().length < 20) {
    return res.status(400).json({
      error: "'oldContract' is required and must be at least 20 characters."
    });
  }
  if (!newContract || newContract.trim().length < 20) {
    return res.status(400).json({
      error: "'newContract' is required and must be at least 20 characters."
    });
  }
  next();
}

// ─── Multer Error Handler ────────────────────────────────────────────────────
// Catches multer-specific errors (wrong file type, file too large)
// and returns a clean JSON response instead of an Express HTML error page
function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "PDF file is too large. Maximum allowed size is 5 MB."
      });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
}

// ════════════════════════════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════════════════════════════

// POST /contracts/analyze
// Analyze a contract passed as plain text
router.post(
  "/analyze",
  contractLimiter,
  authMiddleware,
  allowRoles(...CONTRACT_ROLES),
  validateContractText("contractText"),
  analyzeContract
);

// POST /contracts/analyze-file
// Analyze a contract uploaded as a PDF file
// SRS §3.1 — accept input relevant to the problem (PDF is standard contract format)
router.post(
  "/analyze-file",
  contractLimiter,
  authMiddleware,
  allowRoles(...CONTRACT_ROLES),
  (req, res, next) => pdfUpload.single("file")(req, res, next),
  handleMulterError,
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        error: "No PDF file received. Please attach a file with field name 'file'."
      });
    }
    next();
  },
  analyzeContractFile
);

// POST /contracts/extract-clauses
// Extract clauses only — faster, no full risk analysis
// SRS §3.2 — NLP clause extraction must produce output within 3 seconds
router.post(
  "/extract-clauses",
  contractLimiter,
  authMiddleware,
  allowRoles(...CONTRACT_ROLES),
  validateContractText("contractText"),
  extractClauses
);

// POST /contracts/compare
// Compare two contract versions and return redline diff
router.post(
  "/compare",
  contractLimiter,
  authMiddleware,
  allowRoles(...CONTRACT_ROLES),
  validateCompareBody,
  compareContracts
);

// GET /contracts/:id/result
// Fetch a previously stored analysis result by reference ID
router.get(
  "/:id/result",
  authMiddleware,
  allowRoles(...CONTRACT_ROLES),
  (req, res, next) => {
    const { id } = req.params;
    // Basic UUID format check before hitting the DB
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        error: "Invalid reference ID format. Must be a valid UUID."
      });
    }
    next();
  },
  getContractResult
);

module.exports = router;