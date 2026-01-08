const db = require('../config/database');

class Score {
    /**
     * Guardar una nueva puntuación
     * @param {Object} scoreData - Datos de la puntuación
     * @returns {Promise<Object>} Puntuación guardada
     */
    static async create(scoreData) {
        try {
            const { user_id, game, difficulty, score, moves, time_seconds } = scoreData;
            
            // Validar datos requeridos
            if (!user_id || !game || score === undefined) {
                throw new Error('Faltan campos requeridos: user_id, game, score');
            }
            
            // Validar juego permitido
            const validGames = ['memory', 'minesweeper', 'sliding_puzzle', '2048'];
            if (!validGames.includes(game)) {
                throw new Error(`Juego no válido. Debe ser uno de: ${validGames.join(', ')}`);
            }
            
            // Usar la fecha/hora actual del servidor
            const played_at = new Date().toISOString();
            
            const result = await db.runQuery(
                `INSERT INTO scores 
                 (user_id, game, difficulty, score, moves, time_seconds, played_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [user_id, game, difficulty, score, moves, time_seconds, played_at]
            );
            
            return {
                id: result.id,
                ...scoreData,
                played_at: played_at
            };
            
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * Obtener las mejores puntuaciones de un juego
     * @param {string} game - Nombre del juego
     * @param {string} difficulty - Dificultad (opcional)
     * @param {number} limit - Límite de resultados (default: 10)
     * @returns {Promise<Array>} Lista de puntuaciones
     */
    static async getTopScores(game, difficulty = null, limit = 10) {
        try {
            let query = `
                SELECT 
                    scores.id,
                    scores.user_id,
                    users.username,
                    scores.game,
                    scores.difficulty,
                    scores.score,
                    scores.moves,
                    scores.time_seconds,
                    scores.played_at
                FROM scores
                JOIN users ON scores.user_id = users.id
                WHERE scores.game = ?
            `;
            
            const params = [game];
            
            if (difficulty) {
                query += ` AND scores.difficulty = ?`;
                params.push(difficulty);
            }
            
            query += `
                ORDER BY scores.score DESC, scores.time_seconds ASC
                LIMIT ?
            `;
            params.push(limit);
            
            return await db.query(query, params);
            
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * Obtener las puntuaciones de un usuario específico
     * @param {number} userId - ID del usuario
     * @param {string} game - Juego (opcional)
     * @param {number} limit - Límite (default: 20)
     * @returns {Promise<Array>} Puntuaciones del usuario
     */
    static async getUserScores(userId, game = null, limit = 20) {
        try {
            let query = `
                SELECT * FROM scores 
                WHERE user_id = ?
            `;
            
            const params = [userId];
            
            if (game) {
                query += ` AND game = ?`;
                params.push(game);
            }
            
            query += `
                ORDER BY played_at DESC
                LIMIT ?
            `;
            params.push(limit);
            
            return await db.query(query, params);
            
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * Obtener la mejor puntuación personal de un usuario por juego
     * @param {number} userId - ID del usuario
     * @param {string} game - Juego (opcional)
     * @returns {Promise<Object>} Mejor puntuación
     */
    static async getUserBestScore(userId, game = null) {
        try {
            let query = `
                SELECT game, MAX(score) as best_score
                FROM scores
                WHERE user_id = ?
            `;
            
            const params = [userId];
            
            if (game) {
                query += ` AND game = ?`;
                params.push(game);
            }
            
            query += ` GROUP BY game`;
            
            return await db.query(query, params);
            
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * Obtener estadísticas globales
     * @returns {Promise<Object>} Estadísticas
     */
    static async getStats() {
        try {
            const stats = await db.query(`
                SELECT 
                    game,
                    COUNT(*) as total_games,
                    COUNT(DISTINCT user_id) as unique_players,
                    MAX(score) as highest_score,
                    AVG(score) as average_score
                FROM scores
                GROUP BY game
            `);
            
            const recentGames = await db.query(`
                SELECT 
                    scores.game,
                    users.username,
                    scores.score,
                    scores.played_at
                FROM scores
                JOIN users ON scores.user_id = users.id
                ORDER BY scores.played_at DESC
                LIMIT 5
            `);
            
            return {
                byGame: stats,
                recentGames
            };
            
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Score;
