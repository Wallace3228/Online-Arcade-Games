const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    /**
     * Crear un nuevo usuario
     * @param {string} username - Nombre de usuario
     * @param {string} email - Correo electrónico
     * @param {string} password - Contraseña en texto plano
     * @returns {Promise<Object>} Usuario creado
     */
    static async create(username, email, password) {
        try {
            // 1. Encriptar la contraseña
            const passwordHash = await bcrypt.hash(password, 10);
            
            // 2. Insertar en la base de datos
            const result = await db.runQuery(
                `INSERT INTO users (username, email, password_hash) 
                 VALUES (?, ?, ?)`,
                [username, email, passwordHash]
            );
            
            // 3. Retornar el usuario (sin la contraseña)
            return {
                id: result.id,
                username,
                email,
                created_at: new Date()
            };
            
        } catch (error) {
            // Si es error de duplicado, dar mensaje más amigable
            if (error.message.includes('UNIQUE constraint failed')) {
                if (error.message.includes('username')) {
                    throw new Error('El nombre de usuario ya está en uso');
                } else if (error.message.includes('email')) {
                    throw new Error('El correo electrónico ya está registrado');
                }
            }
            throw error;
        }
    }
    
    /**
     * Buscar usuario por nombre de usuario
     * @param {string} username - Nombre de usuario
     * @returns {Promise<Object|null>} Usuario encontrado o null
     */
    static async findByUsername(username) {
        try {
            const user = await db.getOne(
                `SELECT * FROM users WHERE username = ?`,
                [username]
            );
            return user;
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * Buscar usuario por ID
     * @param {number} id - ID del usuario
     * @returns {Promise<Object|null>} Usuario encontrado o null
     */
    static async findById(id) {
        try {
            const user = await db.getOne(
                `SELECT id, username, email, created_at 
                 FROM users WHERE id = ?`,
                [id]
            );
            return user;
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * Verificar si la contraseña es correcta
     * @param {string} password - Contraseña en texto plano
     * @param {string} hash - Hash almacenado en la base de datos
     * @returns {Promise<boolean>} True si la contraseña es correcta
     */
    static async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }
    
    /**
     * Actualizar información del usuario (ejemplo para futuro)
     * @param {number} id - ID del usuario
     * @param {Object} updates - Campos a actualizar
     * @returns {Promise<Object>} Usuario actualizado
     */
    static async update(id, updates) {
        const allowedFields = ['email', 'password_hash'];
        const fieldsToUpdate = {};
        
        // Filtrar solo campos permitidos
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                fieldsToUpdate[key] = updates[key];
            }
        });
        
        if (Object.keys(fieldsToUpdate).length === 0) {
            throw new Error('No hay campos válidos para actualizar');
        }
        
        // Construir la consulta dinámicamente
        const setClause = Object.keys(fieldsToUpdate)
            .map(key => `${key} = ?`)
            .join(', ');
        
        const values = Object.values(fieldsToUpdate);
        values.push(id); // Para el WHERE
        
        await db.runQuery(
            `UPDATE users SET ${setClause} WHERE id = ?`,
            values
        );
        
        return await this.findById(id);
    }
}

module.exports = User;
