process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
beforeEach(async () => {
    const result = await db.query(`INSERT INTO companies (code, name, description)
    VALUES ('apple', 'Apple Computers', 'Created iOS.')
    RETURNING code, name, description`);
    testCompany = result.rows[0];
})

afterEach(async () => {
    // Clean up database after each test
    await db.query('DELETE FROM companies');
});

afterAll(async () => {
    await db.end();
})

describe("GET /companies", () => {
    test("Get a list with one company", async () => {
        const res = await request(app).get('/companies');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual([testCompany]);
    })
})

describe("GET /companies/:code", () => {
    test("Get a specific company", async () => {
        const res = await request(app).get('/companies/apple');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual( {"company": testCompany, "invoices": []});
    })
})

describe("POST /companies", () => {
    test("Add a new company", async () => {
        const res = (await request(app).post('/companies')
        .send({"code": "star", "name": "Starlance Studios", "description": "Creators of ZeroSpace"}));
        expect(res.statusCode).toBe(201);
        expect(res.body)
        .toEqual({company: [{code: 'star', name: 'Starlance Studios', description: 'Creators of ZeroSpace'}]})
    })
})

describe("PUT /companies/:code", () => {
    test("Update a company", async () => {
        const res = (await request(app).put(`/companies/${testCompany.code}`)
        .send({name: "Apple Computers", description: 'Created iOS and hardware.'}));
        expect(res.statusCode).toBe(200);
        expect(res.body)
        .toEqual({code: 'apple', name: 'Apple Computers', description: 'Created iOS and hardware.'})
    })
})

describe("DELETE /companies/:code", () => {
    test("Delete a company", async () => {
        const res = await request(app).delete(`/companies/${testCompany.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body)
        .toEqual({message: "Deleted"})
    })
})