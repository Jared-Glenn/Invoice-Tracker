// Routes for the company Invoice Tracker.

const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

// Get full list of companies.
router.get('/', async (req, res) => {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json(results.rows)
});

// Get a specific company by its code.
router.get('/:code', async (req, res, next) => {
    try {
        const result = await db.query(`SELECT * FROM companies WHERE code=$1`, [ req.params.code ]);

        if (result.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${req.params.code}`, 404);
        }
        return res.json(result.rows[0]);
    }
    catch (e) {
        return next(e);
    }
});

// Add a new company as a JSON.
router.post('/', async (req, res, next) => {
    try {
        const { code, name, description } = req.body;
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