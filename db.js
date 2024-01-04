/** Database setup for BizTime. */

const { Client } = require("pg");

let DB_URI;

if (process.env.NODE_ENV === "test") {
    DB_URI = "biztime_test";
}
else {
    DB_URI = "biztime";
}

const DB_PASSWORD = process.env.DB_PASSWORD

let db = new Client({
    host: "/var/run/postgresql",
    database: DB_URI,
    password: DB_PASSWORD
});

db.connect();

module.exports = db;