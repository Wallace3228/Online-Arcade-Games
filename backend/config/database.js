const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta donde se guardará la base de datos
const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Crear conexión a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('✅ Conectado a la base de datos SQLite');
        initializeDatabase();
    }
});

// Función para inicializar las tablas
function initializeDatabase() {
    db.serialize(() => {
        console.log('📊 Inicializando tablas de la base de datos...');
        
        // 1. Tabla de usuarios
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Error creando tabla users:', err.message);
            } else {
                console.log('✅ Tabla "users" lista');
            }
        });
        
        // 2. Tabla de puntuaciones
        db.run(`
            CREATE TABLE IF NOT EXISTS scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                game TEXT NOT NULL,
                difficulty TEXT,
                score INTEGER NOT NULL,
                moves INTEGER,
                time_seconds INTEGER,
                played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `, (err) => {
            if (err) {
                console.error('Error creando tabla scores:', err.message);
            } else {
                console.log('✅ Tabla "scores" lista');
            }
        });
        
        // 3. Crear índices para mejor rendimiento
        db.run(`
            CREATE INDEX IF NOT EXISTS idx_scores_game 
            ON scores(game)
        `);
        
        db.run(`
            CREATE INDEX IF NOT EXISTS idx_scores_user_game 
            ON scores(user_id, game)
        `);
        
        db.run(`
            CREATE INDEX IF NOT EXISTS idx_scores_top 
            ON scores(game, difficulty, score DESC)
        `);
        
        console.log('🎯 Índices creados para búsquedas rápidas');
        
        // 4. Insertar usuario de prueba (opcional, para testing)
        insertTestUser();
    });
}

// Función para insertar un usuario de prueba
function insertTestUser() {
    const bcrypt = require('bcryptjs');
    const testPassword = 'test123';
    
    bcrypt.hash(testPassword, 10, (err, hash) => {
        if (err) return;
        
        db.run(
            `INSERT OR IGNORE INTO users (username, email, password_hash) 
             VALUES (?, ?, ?)`,
            ['testuser', 'test@example.com', hash],
            (err) => {
                if (err && !err.message.includes('UNIQUE constraint')) {
                    console.error('Error insertando usuario de prueba:', err.message);
                }
            }
        );
    });
}

// Función para hacer consultas más fácilmente
db.query = function(sql, params = []) {
    return new Promise((resolve, reject) => {
        this.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

db.getOne = function(sql, params = []) {
    return new Promise((resolve, reject) => {
        this.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

db.runQuery = function(sql, params = []) {
    return new Promise((resolve, reject) => {
        this.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

module.exports = db;
