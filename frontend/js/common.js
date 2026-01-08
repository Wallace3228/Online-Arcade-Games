// ============================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================
const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let isDarkMode = false;

// ============================================
// HELPERS PARA RUTAS RELATIVAS
// ============================================
function getCorrectPath(relativePath) {
    // Si estamos en /games/, necesitamos subir un nivel
    if (window.location.pathname.includes('/games/')) {
        return '../' + relativePath;
    }
    return relativePath;
}

function isInGamesFolder() {
    return window.location.pathname.includes('/games/');
}

// ============================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================
$(document).ready(function() {
    console.log('Common JavaScript loaded');
    
    // Cargar estado del tema - PRIMERO
    loadTheme();
    
    // Configurar event listener del tema - SEGUNDO
    setupThemeToggle();
    
    // Cargar estado de autenticación
    loadAuthState();
    
    // Configurar event listeners globales
    setupGlobalEventListeners();
    
    // Verificar conexión con la API
    checkAPIHealth();
});

// ============================================
// GESTIÓN DEL TEMA (CLARO/OSCURO)
// ============================================
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    console.log('Tema guardado:', savedTheme);
    
    // Por defecto: tema claro
    if (savedTheme === null) {
        localStorage.setItem('theme', 'light');
        isDarkMode = false;
    } else {
        isDarkMode = savedTheme === 'dark';
    }
    
    // Aplicar tema inmediatamente
    if (isDarkMode) {
        $('body').addClass('dark');
    } else {
        $('body').removeClass('dark');
    }
    
    // Actualizar icono
    updateThemeToggleIcon();
}

function setupThemeToggle() {
    // Usar event delegation para manejar clics en el botón de tema
    $(document).on('click', '#theme-toggle', function(e) {
        e.preventDefault();
        toggleTheme();
    });
    
    // También manejar clics en el icono dentro del botón
    $(document).on('click', '#theme-toggle i', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleTheme();
    });
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    console.log('Cambiando tema a:', isDarkMode ? 'dark' : 'light');
    
    if (isDarkMode) {
        $('body').addClass('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        $('body').removeClass('dark');
        localStorage.setItem('theme', 'light');
    }
    
    updateThemeToggleIcon();
    
    // Notificar a otros componentes si es necesario
    if (typeof window.onThemeChanged === 'function') {
        window.onThemeChanged(isDarkMode);
    }
}

function updateThemeToggleIcon() {
    const icon = $('#theme-toggle i');
    if (icon.length) {
        if (isDarkMode) {
            icon.removeClass('fa-moon').addClass('fa-sun');
        } else {
            icon.removeClass('fa-sun').addClass('fa-moon');
        }
    }
}

// Función para obtener el tema actual (útil para otros scripts)
function getCurrentTheme() {
    return isDarkMode ? 'dark' : 'light';
}

// ============================================
// AUTENTICACIÓN Y USUARIO
// ============================================
function loadAuthState() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
        try {
            currentUser = JSON.parse(userData);
            updateUIForLoggedInUser();
            
            // Notificar que el usuario está logueado
            if (typeof window.onUserLoggedIn === 'function') {
                window.onUserLoggedIn(currentUser);
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
            logout();
        }
    } else {
        updateUIForLoggedOutUser();
        
        // Notificar que el usuario no está logueado
        if (typeof window.onUserLoggedOut === 'function') {
            window.onUserLoggedOut();
        }
    }
}

function updateUIForLoggedInUser() {
    // Crear avatar con inicial (máximo 2 caracteres)
    const avatarText = currentUser.username
        .charAt(0)
        .toUpperCase()
        .substring(0, 2);
    
    // Actualizar navbar
    $('#auth-buttons').html(`
        <div class="user-info">
            <div class="user-avatar" title="${currentUser.username}">
                ${avatarText}
            </div>
            <div class="user-details">
                <div class="user-name">${currentUser.username}</div>
                <div class="user-email">${currentUser.email}</div>
            </div>
            <button class="btn btn-outline btn-small logout-btn" title="Logout">
                <i class="fas fa-sign-out-alt"></i>
            </button>
        </div>
    `);
    
    // Actualizar mensajes de bienvenida si existen
    if ($('#user-welcome').length) {
        $('#user-welcome').html(`
            <div class="welcome-message">
                Welcome back, <strong>${currentUser.username}</strong>! 
                Your scores will be saved automatically.
            </div>
        `);
    }
    
    // Esconder botones de login en hero section
    $('#login-action-btn').hide();
}

function updateUIForLoggedOutUser() {
    // Usar rutas correctas
    const loginPath = getCorrectPath('login.html');
    const registerPath = getCorrectPath('login.html') + '?register=true';
    
    $('#auth-buttons').html(`
        <div class="auth-buttons">
            <a href="${loginPath}" class="btn btn-outline" style="height: 40px; display: flex; align-items: center;">
                <i class="fas fa-sign-in-alt"></i> Login
            </a>
            <a href="${registerPath}" class="btn btn-primary" style="height: 40px; display: flex; align-items: center;">
                <i class="fas fa-user-plus"></i> Register
            </a>
        </div>
    `);
    
    if ($('#user-welcome').length) {
        const loginPathForMessage = getCorrectPath('login.html');
        $('#user-welcome').html(`
            <div class="welcome-message">
                Please <a href="${loginPathForMessage}">log in</a> to save your scores and compete on the leaderboard!
            </div>
        `);
    }
    
    // Mostrar botones de login en hero section
    $('#login-action-btn').show();
}

function logout() {
    // Mostrar confirmación
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        currentUser = null;
        updateUIForLoggedOutUser();
        
        // Notificar logout
        if (typeof window.onUserLoggedOut === 'function') {
            window.onUserLoggedOut();
        }
        
        // Usar la ruta correcta según la ubicación
        const homePath = getCorrectPath('index.html');
        window.location.href = homePath;
    }
}

// ============================================
// COMUNICACIÓN CON LA API
// ============================================
async function saveScore(gameData) {
    if (!currentUser) {
        console.log('User not logged in, score not saved');
        return {
            success: false,
            message: 'Please log in to save scores'
        };
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await $.ajax({
            url: `${API_URL}/scores`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(gameData)
        });
        
        console.log('Score saved successfully:', response);
        return {
            success: true,
            data: response
        };
        
    } catch (error) {
        console.error('Error saving score:', error);
        return {
            success: false,
            message: error.responseJSON?.error || 'Failed to save score'
        };
    }
}

async function getTopScores(game, difficulty = null, limit = 10) {
    try {
        let url = `${API_URL}/scores/top/${game}`;
        const params = [];
        
        if (difficulty && difficulty !== 'all') {
            params.push(`difficulty=${difficulty}`);
        }
        if (limit !== 10) {
            params.push(`limit=${limit}`);
        }
        
        if (params.length > 0) {
            url += '?' + params.join('&');
        }
        
        const response = await $.ajax({
            url: url,
            method: 'GET'
        });
        
        return {
            success: true,
            data: response
        };
        
    } catch (error) {
        console.error('Error fetching top scores:', error);
        return {
            success: false,
            message: error.responseJSON?.error || 'Failed to load scores'
        };
    }
}

async function getUserScores(limit = 20) {
    if (!currentUser) return { success: false, data: [] };
    
    try {
        const token = localStorage.getItem('token');
        const response = await $.ajax({
            url: `${API_URL}/scores/user/me?limit=${limit}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        return {
            success: true,
            data: response
        };
        
    } catch (error) {
        console.error('Error fetching user scores:', error);
        return {
            success: false,
            message: error.responseJSON?.error || 'Failed to load your scores'
        };
    }
}

async function getUserStats() {
    if (!currentUser) return { success: false, data: {} };
    
    try {
        const token = localStorage.getItem('token');
        
        // Obtener las puntuaciones del usuario
        const scoresResponse = await $.ajax({
            url: `${API_URL}/scores/user/me?limit=1000`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Obtener las mejores puntuaciones del usuario por juego
        const bestScoresResponse = await $.ajax({
            url: `${API_URL}/scores/user/me`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Procesar estadísticas
        const userScores = scoresResponse.scores || [];
        const bestScores = bestScoresResponse.best_scores || [];
        
        let totalGames = userScores.length;
        let highestScore = 0;
        
        // Encontrar la puntuación más alta del usuario
        userScores.forEach(score => {
            if (score.score > highestScore) {
                highestScore = score.score;
            }
        });
        
        // Si no hay puntuaciones, usar las mejores puntuaciones por juego
        if (highestScore === 0 && bestScores.length > 0) {
            bestScores.forEach(best => {
                if (best.best_score > highestScore) {
                    highestScore = best.best_score;
                }
            });
        }
        
        return {
            success: true,
            data: {
                total_games: totalGames,
                highest_score: highestScore,
                games_played: totalGames,
                best_scores: bestScores
            }
        };
        
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return {
            success: false,
            message: error.responseJSON?.error || 'Failed to load your statistics',
            data: {
                total_games: 0,
                highest_score: 0,
                games_played: 0,
                best_scores: []
            }
        };
    }
}

async function getGameStats() {
    try {
        const response = await $.ajax({
            url: `${API_URL}/scores/stats`,
            method: 'GET'
        });
        
        return {
            success: true,
            data: response
        };
        
    } catch (error) {
        console.error('Error fetching game stats:', error);
        return {
            success: false,
            message: 'Failed to load statistics'
        };
    }
}

async function getRegisteredPlayersCount() {
    if (!currentUser) {
        return {
            success: false,
            message: 'User not logged in',
            count: 0
        };
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await $.ajax({
            url: `${API_URL}/auth/registered-players`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        return {
            success: true,
            count: response.count
        };
        
    } catch (error) {
        console.error('Error fetching registered players:', error);
        return {
            success: false,
            message: error.responseJSON?.error || 'Failed to load statistics',
            count: 0
        };
    }
}

// ============================================
// HELPERS Y UTILIDADES
// ============================================
function formatTime(seconds) {
    if (!seconds) return 'N/A';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

function showAlert(message, type = 'info', duration = 5000) {
    // Crear elemento de alerta
    const alertId = 'alert-' + Date.now();
    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type}">
            ${message}
        </div>
    `;
    
    // Añadir al cuerpo
    $('body').append(alertHtml);
    
    // Posicionar en la esquina superior derecha
    $(`#${alertId}`).css({
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '9999',
        maxWidth: '400px',
        animation: 'slideInRight 0.3s ease'
    });
    
    // Remover después de la duración
    setTimeout(() => {
        $(`#${alertId}`).fadeOut(300, function() {
            $(this).remove();
        });
    }, duration);
}

// ============================================
// EVENT LISTENERS GLOBALES
// ============================================
function setupGlobalEventListeners() {
    // Cerrar sesión
    $(document).on('click', '.logout-btn', function(e) {
        e.preventDefault();
        logout();
    });
    
    // Navegación suave para enlaces internos
    $(document).on('click', 'a[href^="#"]', function(e) {
        const target = $(this.getAttribute('href'));
        if (target.length) {
            e.preventDefault();
            $('html, body').animate({
                scrollTop: target.offset().top - 80
            }, 500);
        }
    });
    
    // Manejar errores de AJAX globalmente
    $(document).ajaxError(function(event, jqxhr, settings, thrownError) {
        if (jqxhr.status === 401) {
            // Token expirado o inválido
            showAlert('Your session has expired. Please log in again.', 'error');
            logout();
        } else if (jqxhr.status === 0) {
            // Sin conexión
            showAlert('Cannot connect to server. Please check your connection.', 'error');
        }
    });
}

// ============================================
// VERIFICACIÓN DE SALUD DE LA API
// ============================================
async function checkAPIHealth() {
    try {
        const response = await $.ajax({
            url: `${API_URL}/health`,
            method: 'GET',
            timeout: 3000
        });
        
        console.log('API Health:', response.status);
        updateAPIStatus(true);
        
    } catch (error) {
        console.error('API is not reachable:', error);
        updateAPIStatus(false);
    }
}

function updateAPIStatus(isOnline) {
    const statusElement = $('#api-status');
    if (statusElement.length) {
        if (isOnline) {
            statusElement.html('<i class="fas fa-circle api-status-online"></i> API: Online');
        } else {
            statusElement.html('<i class="fas fa-circle api-status-offline"></i> API: Offline');
        }
    }
}

// ============================================
// EXPORTAR FUNCIONES PARA USO EN JUEGOS
// ============================================
window.ArcadeAPI = {
    saveScore,
    getTopScores,
    getUserScores,
    getUserStats,  // NUEVA FUNCIÓN
    getGameStats,
    getRegisteredPlayersCount,
    showAlert,
    formatTime,
    formatDate,
    getCurrentTheme,
    getCorrectPath,
    getCurrentUser: () => currentUser,
    isLoggedIn: () => currentUser !== null
};

// Eventos para notificar cambios de estado de autenticación
window.onUserLoggedIn = null;
window.onUserLoggedOut = null;
