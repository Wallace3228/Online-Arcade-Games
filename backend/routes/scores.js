const express = require('express');
const Score = require('../models/Score');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const router = express.Router();

/**
 * @route   POST /api/scores
 * @desc    Guardar una nueva puntuación
 * @access  Private (requiere estar logueado)
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id; // Del token verificado
        const { game, difficulty, score, moves, time_seconds } = req.body;
        
        console.log('🎯 Guardando puntuación:', { 
            user: req.user.username, 
            game, 
            score 
        });
        
        // Validar datos requeridos
        if (!game || score === undefined) {
            return res.status(400).json({ 
                error: 'Los campos "game" y "score" son requeridos' 
            });
        }
        
        // Crear objeto de puntuación
        const scoreData = {
            user_id: userId,
            game,
            difficulty: difficulty || null,
            score: parseInt(score),
            moves: moves ? parseInt(moves) : null,
            time_seconds: time_seconds ? parseInt(time_seconds) : null
        };
        
        // Guardar en la base de datos
        const savedScore = await Score.create(scoreData);
        
        console.log('✅ Puntuación guardada ID:', savedScore.id);
        
        res.status(201).json({
            success: true,
            message: 'Puntuación guardada exitosamente',
            score: savedScore
        });
        
    } catch (error) {
        console.error('❌ Error guardando puntuación:', error.message);
        
        if (error.message.includes('Juego no válido') || 
            error.message.includes('Faltan campos requeridos')) {
            return res.status(400).json({ error: error.message });
        }
        
        res.status(500).json({ 
            error: 'Error al guardar la puntuación' 
        });
    }
});

/**
 * @route   GET /api/scores/top/:game
 * @desc    Obtener las mejores puntuaciones de un juego
 * @access  Public
 */
router.get('/top/:game', optionalAuth, async (req, res) => {
    try {
        const { game } = req.params;
        const { difficulty, limit = 10 } = req.query;
        
        console.log('🏆 Obteniendo top scores para:', game);
        
        // Validar que el juego sea permitido
        const validGames = ['memory', 'minesweeper', 'sliding_puzzle', '2048'];
        if (!validGames.includes(game)) {
            return res.status(400).json({ 
                error: `Juego no válido. Debe ser uno de: ${validGames.join(', ')}` 
            });
        }
        
        // Obtener las mejores puntuaciones
        const topScores = await Score.getTopScores(
            game, 
            difficulty || null, 
            parseInt(limit)
        );
        
        // Formatear respuesta
        const formattedScores = topScores.map(score => ({
            rank: topScores.indexOf(score) + 1,
            username: score.username,
            score: score.score,
            moves: score.moves,
            time_seconds: score.time_seconds,
            played_at: score.played_at,
            is_current_user: req.user && score.user_id === req.user.id
        }));
        
        res.json({
            success: true,
            game,
            difficulty: difficulty || 'all',
            scores: formattedScores,
            count: formattedScores.length
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo top scores:', error.message);
        res.status(500).json({ error: 'Error al obtener las puntuaciones' });
    }
});

/**
 * @route   GET /api/scores/user/me
 * @desc    Obtener las puntuaciones del usuario actual
 * @access  Private
 */
router.get('/user/me', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { game, limit = 20 } = req.query;
        
        console.log('📊 Obteniendo scores para usuario:', req.user.username);
        
        const userScores = await Score.getUserScores(
            userId, 
            game || null, 
            parseInt(limit)
        );
        
        // Obtener mejor puntuación por juego
        const bestScores = await Score.getUserBestScore(userId, game || null);
        
        res.json({
            success: true,
            user: {
                id: req.user.id,
                username: req.user.username
            },
            scores: userScores,
            best_scores: bestScores,
            total_games: userScores.length
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo scores de usuario:', error.message);
        res.status(500).json({ error: 'Error al obtener tus puntuaciones' });
    }
});

/**
 * @route   GET /api/scores/stats
 * @desc    Obtener estadísticas globales
 * @access  Public
 */
router.get('/stats', async (req, res) => {
    try {
        console.log('📈 Obteniendo estadísticas globales');
        
        const stats = await Score.getStats();
        
        res.json({
            success: true,
            stats: stats.byGame,
            recent_games: stats.recentGames,
            generated_at: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error.message);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

/**
 * @route   GET /api/scores/games
 * @desc    Obtener información de los juegos disponibles
 * @access  Public
 */
router.get('/games', (req, res) => {
    const games = [
        {
            id: 'memory',
            name: 'Memory Match',
            description: 'Test your memory with card matching',
            difficulties: ['novice', 'standard', 'expert'],
            metrics: ['moves', 'time'],
            icon: 'brain'
        },
        {
            id: 'minesweeper',
            name: 'Minesweeper',
            description: 'Find mines without detonating them',
            difficulties: ['easy', 'medium', 'hard'],
            metrics: ['time', 'flags'],
            icon: 'bomb'
        },
        {
            id: 'sliding_puzzle',
            name: 'Sliding Puzzle',
            description: 'Slide tiles to arrange them in order',
            difficulties: ['3x3', '4x4', '5x5'],
            metrics: ['moves', 'time'],
            icon: 'puzzle-piece'
        },
        {
            id: '2048',
            name: '2048',
            description: 'Join numbers to get to the 2048 tile',
            difficulties: ['standard'],
            metrics: ['score', 'moves'],
            icon: 'superscript'
        }
    ];
    
    res.json({
        success: true,
        games,
        count: games.length
    });
});

module.exports = router;
