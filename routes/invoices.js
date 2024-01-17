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
            throw new ExpressError(`Can't find invoice with ID of ${req.params.id}`, 404);
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

// Edit existing invoice.
router.put('/:id', async (req, res, next) => {
    try {
        console.log(Date.now());
        
        const { id } = req.params;

        const check = await db.query(`SELECT paid FROM invoices WHERE id=$1`,
        [req.params.id]);

        const wasPaid = check.rows[0]["paid"];

        const { comp_code, amt, paid, add_date, paid_date } = req.body;
        let query = 'UPDATE invoices SET ';
        let queryValues = [];
        let queryParams = [];

        // Check each property in the body. Leave all others the same.
        if (comp_code !== undefined) {
            queryValues.push(`comp_code = $${queryValues.length + 1}`);
            queryParams.push(comp_code);
        }
        if (amt !== undefined) {
            queryValues.push(`amt = $${queryValues.length + 1}`);
            queryParams.push(amt);
        }
        if (paid !== undefined) {
            queryValues.push(`paid = $${queryValues.length + 1}`);
            queryParams.push(paid);
        }
        if (add_date !== undefined) {
            queryValues.push(`add_date = $${queryValues.length + 1}`);
            queryParams.push(add_date);
        }

        if (paid_date !== undefined) {
            queryValues.push(`paid_date = $${queryValues.length + 1}`);
            queryParams.push(paid_date);
        } else if (wasPaid === false && paid === true) {
            queryValues.push(`paid_date = $${queryValues.length + 1}`);
            const new_paid_date = new Date();
            queryParams.push(new_paid_date);
        } else if (wasPaid === true && paid === false) {
            queryValues.push(`paid_date = $${queryValues.length + 1}`);
            queryParams.push(null);
        }

        // Send error if no properties were changed.
        if (queryValues.length === 0) {
            throw new ExpressError("Must update at least one property of the invoice.", 404)
        }

        query += queryValues.join(", ");
        query += ` WHERE id = $${queryValues.length + 1}
            RETURNING id, comp_code, amt, paid, add_date, paid_date`;
        queryParams.push(id);

        const result = await db.query(query, queryParams);
        
        // Send error if the invoice id does not exist.
        if (result.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with ID of ${id}.`, 404);
        }
        return res.json(result.rows[0]);
    }
    catch (err) {
        return next (err);
    }
});

// Delete existing invoice.
router.delete('/:id', async (req, res, next) => {
    try {
        const result = await db.query(`SELECT * FROM invoices WHERE id=$1`, [req.params.id]);

        if (result.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with ID of ${req.params.id} to delete it.`, 404);
        }
        await db.query(`DELETE FROM invoices
            WHERE id=$1`,
            [req.params.id]
        );

        return res.json({message: "Deleted"});
    }
    catch (err) {
        return next (err);
    }
})


module.exports = router;