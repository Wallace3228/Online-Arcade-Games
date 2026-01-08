// ============================================
// LOGIN PAGE SPECIFIC JAVASCRIPT
// ============================================

$(document).ready(function() {
    console.log('Login page loaded');
    
    // Verificar si el usuario ya está logueado
    checkAuthStatus();
    
    // Configurar event listeners
    setupLoginEventListeners();
    
    // Verificar parámetros de URL para registro
    checkURLParameters();
});

function setupLoginEventListeners() {
    // Cambio de tabs
    $('.tab-btn').on('click', function() {
        switchTab($(this).data('tab'));
    });
    
    // Envío de formulario de login
    $('#login-form').on('submit', handleLoginSubmit);
    
    // Envío de formulario de registro
    $('#register-form').on('submit', handleRegisterSubmit);
}

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token) {
        // Usuario ya está logueado, redirigir a home
        window.location.href = 'index.html';
    }
}

function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('register') === 'true') {
        switchTab('register');
    }
}

function switchTab(tabName) {
    // Actualizar tab activo
    $('.tab-btn').removeClass('active');
    $(`.tab-btn[data-tab="${tabName}"]`).addClass('active');
    
    // Mostrar formulario correspondiente
    $('.login-form').removeClass('active');
    $(`#${tabName}-form`).addClass('active');
    
    // Limpiar mensajes
    $('.error-message, .success-message').hide();
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    
    const username = $('#login-username').val().trim();
    const password = $('#login-password').val();
    
    // Limpiar mensajes anteriores
    $('#login-error').hide();
    $('#login-success').hide();
    
    // Validación
    if (!username || !password) {
        showError('login', 'Please fill in all fields');
        return;
    }
    
    // Deshabilitar botón y mostrar loading
    const btn = $('#login-submit');
    const originalText = btn.html();
    btn.html('<i class="fas fa-spinner fa-spin"></i> Logging in...');
    btn.prop('disabled', true);
    
    try {
        // Hacer petición a la API
        const response = await $.ajax({
            url: `${API_URL}/auth/login`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username, password })
        });
        
        // Guardar token y datos de usuario
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Mostrar mensaje de éxito
        $('#login-success').text('Login successful! Redirecting...').show();
        
        // Redirigir a home después de 1.5 segundos
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Login error:', error);
        const errorMsg = error.responseJSON?.error || 'Login failed. Please try again.';
        showError('login', errorMsg);
    } finally {
        // Restaurar botón
        btn.html(originalText);
        btn.prop('disabled', false);
    }
}

async function handleRegisterSubmit(e) {
    e.preventDefault();
    
    const username = $('#register-username').val().trim();
    const email = $('#register-email').val().trim();
    const password = $('#register-password').val();
    const confirm = $('#register-confirm').val();
    
    // Limpiar mensajes anteriores
    $('#register-error').hide();
    $('#register-success').hide();
    
    // Validación
    if (!username || !email || !password || !confirm) {
        showError('register', 'Please fill in all fields');
        return;
    }
    
    if (password !== confirm) {
        showError('register', 'Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        showError('register', 'Password must be at least 6 characters');
        return;
    }
    
    if (!validateUsername(username)) {
        showError('register', 'Username must be 3-20 characters (letters and numbers only)');
        return;
    }
    
    if (!validateEmail(email)) {
        showError('register', 'Please enter a valid email address');
        return;
    }
    
    // Deshabilitar botón y mostrar loading
    const btn = $('#register-submit');
    const originalText = btn.html();
    btn.html('<i class="fas fa-spinner fa-spin"></i> Creating account...');
    btn.prop('disabled', true);
    
    try {
        // Hacer petición a la API
        const response = await $.ajax({
            url: `${API_URL}/auth/register`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username, email, password })
        });
        
        // Mostrar mensaje de éxito
        $('#register-success').text('Account created successfully! Please login.').show();
        
        // Limpiar formulario
        $('#register-form')[0].reset();
        
        // Cambiar a tab de login después de 2 segundos
        setTimeout(() => {
            switchTab('login');
            $('#login-username').val(username);
            $('#register-success').hide();
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        const errorMsg = error.responseJSON?.error || 'Registration failed. Please try again.';
        showError('register', errorMsg);
    } finally {
        // Restaurar botón
        btn.html(originalText);
        btn.prop('disabled', false);
    }
}

// Funciones helper
function showError(formType, message) {
    $(`#${formType}-error`).text(message).show();
}

function validateUsername(username) {
    const regex = /^[a-zA-Z0-9]{3,20}$/;
    return regex.test(username);
}

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}
