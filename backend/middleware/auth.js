const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar token JWT
 */
const authenticateToken = (req, res, next) => {
    // Obtener token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"
    
    if (!token) {
        return res.status(401).json({ 
            error: 'Acceso denegado. Token no proporcionado.' 
        });
    }
    
    try {
        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        
        // Añadir información del usuario a la request
        req.user = decoded;
        next();
        
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expirado. Por favor, inicia sesión nuevamente.' 
            });
        }
        
        return res.status(403).json({ 
            error: 'Token inválido.' 
        });
    }
};

/**
 * Middleware opcional para rutas públicas/privadas
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
            req.user = decoded;
        } catch (error) {
            // Si el token es inválido, continuamos sin usuario
            req.user = null;
        }
    }
    
    next();
};

module.exports = { authenticateToken, optionalAuth };
