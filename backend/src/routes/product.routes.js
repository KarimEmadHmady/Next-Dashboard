import express from "express";
import { ProductController } from "../controllers/product.controller.js";
import { asyncHandler } from "../middlewares/error.middleware.js";
import { validateCreateProduct } from "../middlewares/validate.middleware.js";

const router = express.Router();


router.post("/", validateCreateProduct, asyncHandler(ProductController.createProductController));
router.get("/", asyncHandler(ProductController.getAllProductsController));
router.get("/:id", asyncHandler(ProductController.getProductByIdController));
router.put("/:id", validateCreateProduct, asyncHandler(ProductController.updateProductController));
router.delete("/:id", asyncHandler(ProductController.deleteProductController));


export default router;
