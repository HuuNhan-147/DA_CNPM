import express from "express";
import { createPayment, vnpayReturn } from "../controller/vnpayController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/create", protect, createPayment);
router.get("/return", vnpayReturn);

export default router;
