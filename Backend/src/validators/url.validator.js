import { body } from "express-validator";

export const urlValidator = [
  body("link")
    .trim()
    .notEmpty()
    .withMessage("URL is required")

    .isURL({
      protocols: ["http", "https"],
      require_protocol: true,
    })
    .withMessage("Invalid URL (must include http/https)")

    .isLength({ max: 2048 })
    .withMessage("URL too long"),
];