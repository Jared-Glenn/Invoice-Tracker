// Routes for the industries in the Invoice Tracker.

const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

// Get full list of industries.
router.get('/', async (req, res) => {
    const results = await db.query(`    SELECT i.code, i.industry, ci.comp_code
                                        FROM industries as i
                                        LEFT JOIN companies_industries AS ci
                                        ON i.code = ci.ind_code`);
    return res.json(results.rows)
});

// Add a new industry as a JSON.
router.post('/', async (req, res, next) => {
    try {
        let { code, industry } = req.body;

        const result = await db.query(`INSERT INTO industries (code, industry) VALUES ($1, $2)
        RETURNING code, industry`, [code, industry]);
        return res.status(201).json({industry: result.rows});
    }
    catch (e) {
        return next(e);
    }
})

// Add an industry to a company.
router.post('/:companyCode/:industryCode', async (req, res, next) => {
    try {

        console.log(req.params.companyCode);

        const result = await db.query(
            `INSERT INTO companies_industries VALUES ($1, $2)
            RETURNING comp_code, ind_code`,
            [req.params.companyCode, req.params.industryCode]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(`Can't find company with code ${req.params.code}.`, 404);
        }
        return res.json({Response: `Company ${req.params.companyCode} now associated with industry ${req.params.industryCode}`});
    }
    catch (err) {
        return next (err);
    }
});

module.exports = router;