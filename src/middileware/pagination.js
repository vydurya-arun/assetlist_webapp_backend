export const paginate = (modelName, cacheKey) => {
  return async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      // Attach to req for controller use
      req.pagination = {
        page,
        limit,
        startIndex,
        endIndex,
        modelName,
        cacheKey,
      };

      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
    }
  };
};
