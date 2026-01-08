// ============================================
// GAMES PAGE SPECIFIC JAVASCRIPT
// ============================================

$(document).ready(function() {
    console.log('Games page loaded');
    
    // Inicializar página
    initGamesPage();
    
    // Configurar event listeners
    setupGamesEventListeners();
    
    // Cargar datos iniciales
    loadInitialData();
    
    // Configurar listeners de autenticación
    setupAuthListeners();
});

function initGamesPage() {
    console.log('Initializing games page...');
    
    // Configurar tooltips para botones
    $('.btn-leaderboard').attr('title', 'View leaderboard for this game');
    
    // Inicializar visibilidad del filtro
    updateDifficultyFilterVisibility('memory');
}

function setupGamesEventListeners() {
    // Tabs del leaderboard
    $('.leaderboard-tab').on('click', function() {
        const game = $(this).data('game');
        
        // Actualizar tab activo
        $('.leaderboard-tab').removeClass('active');
        $(this).addClass('active');
        
        // Actualizar título
        updateLeaderboardTitle(game);
        
        // Actualizar visibilidad del filtro
        updateDifficultyFilterVisibility(game);
        
        // Cargar datos (siempre sin dificultad para 2048)
        loadLeaderboard(game);
    });
    
    // Filtro de dificultad
    $('#difficulty-filter').on('change', function() {
        const game = $('.leaderboard-tab.active').data('game');
        
        // Solo cargar si no es 2048
        if (game !== '2048') {
            const difficulty = $(this).val();
            loadLeaderboard(game, difficulty === 'all' ? null : difficulty);
        }
    });
    
    // Botones de leaderboard en las cards
    $('.btn-leaderboard').on('click', function() {
        const game = $(this).data('game');
        
        // Hacer scroll al leaderboard
        $('html, body').animate({
            scrollTop: $('#leaderboard').offset().top - 80
        }, 500);
        
        // Cambiar al tab correspondiente
        $(`.leaderboard-tab[data-game="${game}"]`).click();
    });
}

function setupAuthListeners() {
    // Configurar eventos de autenticación para mostrar/ocultar estadísticas
    window.onUserLoggedIn = function(user) {
        console.log('User logged in, showing stats');
        $('#hero-stats').show();
        loadUserStats();
    };
    
    window.onUserLoggedOut = function() {
        console.log('User logged out, hiding stats');
        $('#hero-stats').hide();
        // Restaurar texto original
        $('#total-players').text('0');
        $('#total-games').text('0');
        $('#total-scores').text('0');
    };
    
    // Inicializar visibilidad basada en estado actual
    if (window.ArcadeAPI.isLoggedIn()) {
        $('#hero-stats').show();
    } else {
        $('#hero-stats').hide();
    }
}

function updateDifficultyFilterVisibility(game) {
    const difficultyControls = $('#difficulty-controls');
    
    // Juegos que NO tienen dificultad
    const gamesWithoutDifficulty = ['2048'];
    
    if (gamesWithoutDifficulty.includes(game)) {
        // Ocultar filtro para 2048
        difficultyControls.hide();
        // Resetear el filtro a "all" cuando se oculta
        $('#difficulty-filter').val('all');
    } else {
        // Mostrar filtro para otros juegos
        difficultyControls.show();
    }
}

function loadInitialData() {
    // Cargar leaderboard inicial
    loadLeaderboard('memory');
    
    // Cargar estadísticas del usuario si está logueado
    if (window.ArcadeAPI.isLoggedIn()) {
        loadUserStats();
    }
}

function updateLeaderboardTitle(game) {
    const gameNames = {
        'memory': 'Memory Match',
        'minesweeper': 'Minesweeper',
        'sliding_puzzle': 'Sliding Puzzle',
        '2048': '2048'
    };
    
    let title = gameNames[game] + ' Leaderboard';
    
    // Añadir dificultad si no es 2048 y hay filtro seleccionado
    if (game !== '2048') {
        const difficulty = $('#difficulty-filter').val();
        if (difficulty && difficulty !== 'all') {
            const difficultyNames = {
                'easy': 'Easy',
                'medium': 'Medium',
                'hard': 'Hard',
                'novice': 'Novice',
                'standard': 'Standard',
                'expert': 'Expert',
                '3x3': '3x3',
                '4x4': '4x4',
                '5x5': '5x5'
            };
            title += ` - ${difficultyNames[difficulty] || difficulty}`;
        }
    }
    
    $('#leaderboard-title').text(title);
}

async function loadLeaderboard(game, difficulty = null) {
    const tbody = $('#leaderboard-body');
    
    // Mostrar loading
    tbody.html(`
        <tr>
            <td colspan="6" class="text-center">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i> Loading leaderboard...
                </div>
            </td>
        </tr>
    `);
    
    try {
        // Para 2048, siempre enviar null para dificultad (ignorar cualquier valor pasado)
        let actualDifficulty = null;
        if (game === '2048') {
            actualDifficulty = null; // Forzar null para 2048
        } else {
            actualDifficulty = difficulty; // Usar el valor proporcionado para otros juegos
        }
        
        // Llamar a la API
        const response = await ArcadeAPI.getTopScores(game, actualDifficulty, 10);
        
        if (response.success && response.data.scores.length > 0) {
            displayLeaderboard(response.data.scores);
        } else {
            displayNoScoresMessage();
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        displayErrorMessage();
    }
}

function displayLeaderboard(scores) {
    const tbody = $('#leaderboard-body');
    const currentUser = ArcadeAPI.getCurrentUser();
    
    let html = '';
    
    scores.forEach((score, index) => {
        const isCurrentUser = currentUser && score.user_id === currentUser.id;
        const rowClass = isCurrentUser ? 'current-user-row' : '';
        
        html += `
            <tr class="${rowClass}">
                <td class="rank-col">${index + 1}</td>
                <td>
                    ${score.username}
                    ${isCurrentUser ? '<span class="current-user-badge">(You)</span>' : ''}
                </td>
                <td><strong>${score.score}</strong></td>
                <td>${score.moves || 'N/A'}</td>
                <td>${ArcadeAPI.formatTime(score.time_seconds)}</td>
                <td>${ArcadeAPI.formatDate(score.played_at)}</td>
            </tr>
        `;
    });
    
    tbody.html(html);
    
    // Añadir estilos para la fila del usuario actual
    if ($('.current-user-row').length) {
        $('.current-user-row').css({
            'background-color': 'rgba(67, 97, 238, 0.1)',
            'font-weight': '600'
        });
        
        $('.current-user-badge').css({
            'background': '#4361ee',
            'color': 'white',
            'padding': '2px 8px',
            'border-radius': '12px',
            'font-size': '0.75rem',
            'margin-left': '5px'
        });
    }
}

function displayNoScoresMessage() {
    const tbody = $('#leaderboard-body');
    tbody.html(`
        <tr>
            <td colspan="6" class="text-center">
                <div class="no-scores-message">
                    <i class="fas fa-trophy" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h4 style="margin-bottom: 0.5rem;">No scores yet!</h4>
                    <p style="margin-bottom: 1rem; color: #666;">Be the first to play and claim the top spot!</p>
                    <a href="#games" class="btn btn-primary btn-small">Play Now</a>
                </div>
            </td>
        </tr>
    `);
}

function displayErrorMessage() {
    const tbody = $('#leaderboard-body');
    tbody.html(`
        <tr>
            <td colspan="6" class="text-center">
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle" style="color: #dc3545; font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p style="color: #dc3545;">Failed to load leaderboard. Please try again.</p>
                </div>
            </td>
        </tr>
    `);
}

async function loadUserStats() {
    try {
        // Verificar si el usuario está logueado
        if (!window.ArcadeAPI.isLoggedIn()) {
            console.log('User not logged in, skipping user stats load');
            return;
        }
        
        // Obtener estadísticas del usuario
        const userStatsResponse = await window.ArcadeAPI.getUserStats();
        
        if (userStatsResponse.success) {
            updateUserStatsDisplay(userStatsResponse.data);
        } else {
            console.warn('Could not load user stats:', userStatsResponse.message);
            updateUserStatsDisplay({
                total_games: 0,
                highest_score: 0,
                games_played: 0
            });
        }
        
        // Obtener número de usuarios registrados para mostrar también
        const playersResponse = await window.ArcadeAPI.getRegisteredPlayersCount();
        if (playersResponse.success) {
            $('#total-players').text(playersResponse.count);
        } else {
            $('#total-players').text('0');
        }
        
    } catch (error) {
        console.error('Error loading user stats:', error);
        updateUserStatsDisplay({
            total_games: 0,
            highest_score: 0,
            games_played: 0
        });
    }
}

function updateUserStatsDisplay(stats) {
    if (!window.ArcadeAPI.isLoggedIn()) {
        return;
    }
    
    // Actualizar UI con las estadísticas del usuario
    $('#total-games').text(stats.total_games || 0);
    $('#total-scores').text(stats.highest_score || 0);
    
    // Actualizar tooltips para mayor claridad
    $('.hero-stats .stat-item').each(function() {
        const statLabel = $(this).find('.stat-label');
        const currentText = statLabel.text();
        
        if (currentText === 'Registered Players') {
            // Este sigue siendo global
            statLabel.attr('title', 'Total users on the platform');
        } else if (currentText === 'Games Played') {
            statLabel.attr('title', 'Your total games played');
        } else if (currentText === 'Highest Score') {
            statLabel.attr('title', 'Your personal best score');
        }
    });
}
