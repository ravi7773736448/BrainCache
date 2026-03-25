import { body } from "express-validator";

export const registerValidator = [

    // username validation
    body("username")
        .trim()
        .notEmpty().withMessage("Username is required")
        .isLength({ min: 3, max: 30 }).withMessage("Username must be 3-30 characters")
        .matches(/^[a-zA-Z0-9_]+$/).withMessage("Username can only contain letters, numbers, and underscore"),

    // email validation (STRONG 🔥)
    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Invalid email format")
        .matches(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/).withMessage("Email syntax is incorrect")
        .normalizeEmail(),

    // password validation
    body("password")
        .trim()
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
        .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
        .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
        .matches(/[0-9]/).withMessage("Password must contain at least one number")
];


