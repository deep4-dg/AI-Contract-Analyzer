module.exports = function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied. You do not have permission."
      });
    }

    next();
  };
};