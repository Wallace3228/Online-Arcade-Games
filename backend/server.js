const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth');
const scoreRoutes = require('./routes/scores');

// Importar base de datos (se conecta automáticamente)
require('./config/database');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// =====================
// MIDDLEWARE
// =====================

// CORS configuration - simplificado para desarrollo
app.use(cors({
    origin: 'http://localhost:5500', // Puerto de Live Server
    credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Logging middleware (personalizado)
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// =====================
// RUTAS
// =====================

// Ruta principal
app.get('/', (req, res) => {
    res.json({
        message: '🎮 Welcome to Arcade Games API',
        documentation: 'Check /api/health for API status',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                logout: 'POST /api/auth/logout'
            },
            scores: {
                save: 'POST /api/scores',
                top: 'GET /api/scores/top/:game',
                user: 'GET /api/scores/user/me',
                stats: 'GET /api/scores/stats',
                games: 'GET /api/scores/games'
            }
        }
    });
});

// Ruta de prueba/health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Arcade Games API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/scores', scoreRoutes);

// =====================
// MANEJO DE ERRORES
// =====================

// Ruta para 404 (no encontrado) - CORREGIDO
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        method: req.method,
        available_endpoints: [
            'GET    /',
            'GET    /api/health',
            'POST   /api/auth/register',
            'POST   /api/auth/login',
            'POST   /api/auth/logout',
            'POST   /api/scores',
            'GET    /api/scores/top/:game',
            'GET    /api/scores/user/me',
            'GET    /api/scores/stats',
            'GET    /api/scores/games'
        ]
    });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error('❌ Error no manejado:', err.message);
    console.error(err.stack);
    
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        timestamp: new Date().toISOString()
    });
});

// =====================
// INICIAR SERVIDOR
// =====================

app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════╗
    ║       🎮 ARCADE GAMES API            ║
    ║       🚀 Servidor iniciado           ║
    ╠══════════════════════════════════════╣
    ║ 📍 URL: http://localhost:${PORT}     ${PORT < 1000 ? ' ' : ''}   ║
    ║ ⏰ Hora: ${new Date().toLocaleTimeString()}                    ║
    ║ 🌍 Entorno: ${process.env.NODE_ENV || 'development'}              ║
    ╚══════════════════════════════════════╝
    
    📊 Endpoints disponibles:
    🌐 Principal:  http://localhost:${PORT}/
    💚 Health:     http://localhost:${PORT}/api/health
    
    Presiona Ctrl+C para detener el servidor.
    `);
});

// Manejar cierre limpio
process.on('SIGINT', () => {
    console.log('\n\n👋 Servidor detenido. ¡Hasta luego!');
    process.exit(0);
});
