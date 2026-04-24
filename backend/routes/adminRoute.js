const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const {
  getDashboard,
  updateSettings,
  exportAuditLogs
} = require("../controllers/adminController");

router.get(
  "/dashboard",
  authMiddleware,
  allowRoles("COMPLIANCE_OFFICER", "SYSTEM_ADMIN"),
  getDashboard
);

router.put(
  "/settings",
  authMiddleware,
  allowRoles("SYSTEM_ADMIN"),
  updateSettings
);

router.get(
  "/audit-logs/export",
  authMiddleware,
  allowRoles("SYSTEM_ADMIN"),
  exportAuditLogs
);

module.exports = router;