const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const {
  analyzeContract,
  getContractResult,
  compareContracts,
  extractClauses
} = require("../controllers/contractController");

router.post(
  "/analyze",
  authMiddleware,
  allowRoles("LEGAL_PROFESSIONAL", "COMPLIANCE_OFFICER", "SYSTEM_ADMIN"),
  analyzeContract
);

router.post(
  "/extract-clauses",
  authMiddleware,
  allowRoles("LEGAL_PROFESSIONAL", "COMPLIANCE_OFFICER", "SYSTEM_ADMIN"),
  extractClauses
);

router.get(
  "/:id/result",
  authMiddleware,
  allowRoles("LEGAL_PROFESSIONAL", "COMPLIANCE_OFFICER", "SYSTEM_ADMIN"),
  getContractResult
);

router.post(
  "/compare",
  authMiddleware,
  allowRoles("LEGAL_PROFESSIONAL", "COMPLIANCE_OFFICER", "SYSTEM_ADMIN"),
  compareContracts
);

module.exports = router;