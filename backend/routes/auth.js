const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const db = require('../config/database');
const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar un nuevo usuario
 * @access  Public
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        console.log('📝 Intentando registrar usuario:', { username, email });
        
        // Validaciones básicas
        if (!username || !email || !password) {
            return res.status(400).json({ 
                error: 'Todos los campos son requeridos: username, email, password' 
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ 
                error: 'La contraseña debe tener al menos 6 caracteres' 
            });
        }
        
        if (!email.includes('@')) {
            return res.status(400).json({ 
                error: 'El email no es válido' 
            });
        }
        
        // Crear usuario
        const user = await User.create(username, email, password);
        console.log('✅ Usuario registrado:', user.id);
        
        // Crear token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                email: user.email
            },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '7d' } // Token válido por 7 días
        );
        
        // Respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at
            }
        });
        
    } catch (error) {
        console.error('❌ Error en registro:', error.message);
        
        if (error.message.includes('ya está en uso') || 
            error.message.includes('ya está registrado')) {
            return res.status(400).json({ 
                error: error.message 
            });
        }
        
        res.status(500).json({ 
            error: 'Error en el servidor. Por favor, intenta nuevamente.' 
        });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Autenticar usuario y obtener token
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('🔐 Intentando login para:', username);
        
        if (!username || !password) {
            return res.status(400).json({ 
                error: 'Username y password son requeridos' 
            });
        }
        
        // Buscar usuario
        const user = await User.findByUsername(username);
        if (!user) {
            console.log('❌ Usuario no encontrado:', username);
            return res.status(401).json({ 
                error: 'Credenciales inválidas' 
            });
        }
        
        // Verificar contraseña
        const isValid = await User.verifyPassword(password, user.password_hash);
        if (!isValid) {
            console.log('❌ Contraseña incorrecta para:', username);
            return res.status(401).json({ 
                error: 'Credenciales inválidas' 
            });
        }
        
        // Crear token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                email: user.email
            },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '7d' }
        );
        
        console.log('✅ Login exitoso para:', username);
        
        // Respuesta exitosa (no enviar password_hash)
        res.json({
            success: true,
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at
            }
        });
        
    } catch (error) {
        console.error('❌ Error en login:', error.message);
        res.status(500).json({ 
            error: 'Error en el servidor. Por favor, intenta nuevamente.' 
        });
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario actual
 * @access  Private (requiere token)
 */
router.get('/me', async (req, res) => {
    try {
        // Este middleware necesita el token verificado
        // Lo implementaremos después
        res.json({ message: 'Esta ruta necesita autenticación' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión (en el cliente se borra el token)
 * @access  Private
 */
router.post('/logout', (req, res) => {
    // En JWT, el logout es del lado del cliente (borrando el token)
    // Pero podemos registrar la acción si queremos
    res.json({ 
        success: true, 
        message: 'Logout exitoso. Borra el token en el cliente.' 
    });
});

/**
 * @route   GET /api/auth/registered-players
 * @desc    Obtener número de usuarios registrados
 * @access  Private (requiere estar logueado)
 */
router.get('/registered-players', async (req, res) => {
    try {
        // Verificar token primero
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                error: 'Acceso denegado. Token no proporcionado.' 
            });
        }
        
        try {
            // Verificar el token
            jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        } catch (error) {
            return res.status(403).json({ 
                error: 'Token inválido o expirado.' 
            });
        }
        
        console.log('📊 Obteniendo número de usuarios registrados');
        
        const result = await db.getOne('SELECT COUNT(*) as count FROM users');
        
        res.json({
            success: true,
            count: result.count
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo usuarios registrados:', error.message);
        res.status(500).json({ 
            error: 'Error al obtener estadísticas' 
        });
    }
});

module.exports = router;
