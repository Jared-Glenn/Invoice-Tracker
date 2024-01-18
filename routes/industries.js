// Routes for the industries in the Invoice Tracker.

const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

// Get full list of companies.
router.get('/', async (req, res) => {
    const results = await db.query(`    SELECT i.code, i.industry, ci.comp_code
                                        FROM industries as i
                                        LEFT JOIN companies_industries AS ci
                                        ON i.code = ci.ind_code`);
    return res.json(results.rows)
});

// Get a specific company by its code.
router.get('/:code', async (req, res, next) => {
    try {
        const result = await db.query(`SELECT * FROM companies WHERE code=$1`, [ req.params.code ]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${req.params.code}`, 404);
        }

        const invoices = await db.query(`SELECT * FROM invoices WHERE comp_code=$1`, [req.params.code]);

        const industries = await db.query(  `SELECT i.industry
                                            FROM industries as i
                                            LEFT JOIN companies_industries AS ci
                                            ON i.code = ci.ind_code
                                            LEFT JOIN companies AS c
                                            ON ci.comp_code = c.code
                                            WHERE ci.comp_code = $1`,
                                            [req.params.code]);

        return res.json({company: result.rows[0], invoices: invoices.rows, industries: industries.rows});
    }
    catch (e) {
        return next(e);
    }
});

// Add a new company as a JSON and slugify the code if not provided.
// https://www.npmjs.com/package/slugify
router.post('/', async (req, res, next) => {
    try {
        let { code, name, description } = req.body;

        if (code === undefined) {
            code = slugify(name, {
                lower: true,
                strict: true
            });
        }

        const result = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3)
        RETURNING code, name, description`, [code, name, description]);
        return res.status(201).json({company: result.rows});
    }
    catch (e) {
        return next(e);
    }
})

// Edit existing company.
router.put('/:code', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const result = await db.query(
            `UPDATE companies SET name=$2, description=$3
            WHERE code=$1
            RETURNING code, name, description`,
            [req.params.code, name, description]
        );
        console.log(result.rows[0])
        if (result.rows.length === 0) {
            throw new ExpressError(`Can't find company with code ${req.params.code}.`, 404);
        }
        return res.json(result.rows[0]);
    }
    catch (err) {
        return next (err);
    }
});

// Delete existing company.
router.delete('/:code', async (req, res, next) => {
    try {
        const result = await db.query(`SELECT * FROM companies WHERE code=$1`, [req.params.code]);

        if (result.rows.length === 0) {
            throw new ExpressError(`Can't find company with code ${req.params.code} to delete it.`, 404);
        }
        await db.query(`DELETE FROM companies
            WHERE code=$1`,
            [req.params.code]
        );

        return res.json({message: "Deleted"});
    }
    catch (err) {
        return next (err);
    }
})


module.exports = router;