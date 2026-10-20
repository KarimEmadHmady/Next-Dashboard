export const validateCreateProduct = (req, res, next) => {
  const { name, price, description } = req.body;
  const errors = [];
    if (!name || typeof name !== "string" || name.trim() === "") {
      errors.push("Name is required and must be a non-empty string");
    }
    if (typeof price !== "number" || price <= 0) {
      errors.push("Price must be a positive number");
    }
    if (!description || typeof description !== "string") {
      errors.push("Description is required and must be a string");
    }
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }
    next();
};

// استخدامه في الراوت