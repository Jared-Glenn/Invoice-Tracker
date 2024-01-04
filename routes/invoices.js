// Routes for the company Invoice Tracker.

const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

// Get full list of invoices.
router.get('/', async (req, res) => {
    const results = await db.query(`SELECT * FROM invoices`);
    return res.json(results.rows)
})


// Get a specific invoice by its id.
router.get('/:id', async (req, res, next) => {
    try {
        const result = await db.query(`SELECT * FROM invoices WHERE id=$1`, [ req.params.id ]);

        if (result.rows.length === 0) {
            console.log("throw error")
            throw new ExpressError(`Can't find invoice with id of ${req.params.id}`, 404);
        }
        const company = await db.query(`SELECT * FROM companies WHERE code=$1`,
        [result.rows[0]["comp_code"]]);
        return res.json({invoice: result.rows[0], company: company.rows[0]});
    }
    catch (e) {
        return next(e);
    }
});

// Add a new invoice as a JSON.
router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const result = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2)
        RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]);
        return res.status(201).json({invoice: result.rows});
    }
    catch (e) {
        return next(e);
    }
})

// START HERE!!!!!!!!!!!!!!

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