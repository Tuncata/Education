const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "game.db");

let db;

// Wrapper to match better-sqlite3 API
const wrapper = {
    prepare(sql) {
        return {
            run(...params) {
                db.run(sql, params);
                return { lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] };
            },
            get(...params) {
                const stmt = db.prepare(sql);
                stmt.bind(params);
                if (stmt.step()) {
                    const cols = stmt.getColumnNames();
                    const vals = stmt.get();
                    stmt.free();
                    const row = {};
                    cols.forEach((c, i) => row[c] = vals[i]);
                    return row;
                }
                stmt.free();
                return undefined;
            },
            all(...params) {
                const stmt = db.prepare(sql);
                stmt.bind(params);
                const rows = [];
                const cols = stmt.getColumnNames();
                while (stmt.step()) {
                    const vals = stmt.get();
                    const row = {};
                    cols.forEach((c, i) => row[c] = vals[i]);
                    rows.push(row);
                }
                stmt.free();
                return rows;
            }
        };
    },
    exec(sql) {
        db.run(sql);
    }
};

// Save database to file periodically
function saveDb() {
    if (!db) return;
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Auto-save every 30 seconds
setInterval(saveDb, 30000);

// Initialize
async function init() {
    const SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    // Create tables
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            level_reached TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    saveDb();
}

// Override prepare().run to also save after writes
const originalPrepare = wrapper.prepare.bind(wrapper);
wrapper.prepare = function(sql) {
    const stmt = originalPrepare(sql);
    const originalRun = stmt.run.bind(stmt);
    stmt.run = function(...params) {
        const result = originalRun(...params);
        saveDb();
        return result;
    };
    return stmt;
};

wrapper.init = init;

module.exports = wrapper;
