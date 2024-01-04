// Routes for the company Invoice Tracker.

const express = require("express");
const router = express.Router();
const db = require("../db");

// Get full list of companies.
router.get('/', async (req, res) => {
    const results = await db.query(`SELECT * FROM invoices`);
    return res.json(results.rows)
})





module.exports = router;