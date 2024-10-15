import express from "express";
import jwt from "jsonwebtoken";
import { login, register } from "../controller/authController";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

export default router;