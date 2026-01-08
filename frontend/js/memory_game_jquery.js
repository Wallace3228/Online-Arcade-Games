// Memory Game Logic with jQuery - INTEGRATED VERSION
$(document).ready(function() {
    console.log('Memory game loaded - UPDATED VERSION');
    
    // Game variables
    let cards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let moves = 0;
    let canFlip = true;
    
    // Timer variables
    let startTime;
    let elapsedTime = 0;
    let timerInterval;
    let gameStarted = false;
    
    // SVG icons
    const cardSymbols = [
        'svg/vectorpaint (1).svg',
        'svg/vectorpaint (2).svg',
        'svg/vectorpaint (3).svg',
        'svg/vectorpaint (4).svg',
        'svg/vectorpaint (5).svg',
        'svg/vectorpaint (6).svg',
        'svg/vectorpaint (7).svg',
        'svg/vectorpaint (8).svg',
        'svg/vectorpaint (9).svg',
        'svg/vectorpaint (10).svg'
    ];
    
    // Difficulty settings
    const difficultySettings = {
        easy: {
            pairs: 6,
            gridClass: 'novice',
            displayName: 'Easy',
            difficultyValue: 'easy'
        },
        medium: {
            pairs: 8,
            gridClass: 'standard',
            displayName: 'Medium',
            difficultyValue: 'medium'
        },
        hard: {
            pairs: 10,
            gridClass: 'expert',
            displayName: 'Hard',
            difficultyValue: 'hard'
        }
    };
    
    // Initialize game
    function initializeGame() {
        const difficulty = $('#difficulty-select').val();
        const settings = difficultySettings[difficulty];
        
        // Update memory-board class for grid design
        $('#memory-board').removeClass().addClass('memory-board ' + settings.gridClass);
        
        // Get number of symbols required
        const selectedSymbols = cardSymbols.slice(0, settings.pairs);
        cards = [...selectedSymbols, ...selectedSymbols];
        
        shuffleCards(cards);
        renderCards();
        resetGameStats();
        hideResultScreen();
    }
    
    // Shuffle cards
    function shuffleCards(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    // Render cards
    function renderCards() {
        $('#memory-board').empty();
        
        $.each(cards, function(index, symbol) {
            const card = $('<div>', {
                class: 'memory-card',
                'data-symbol': symbol,
                'data-index': index
            });
            
            const cardFront = $('<div>', {
                class: 'card-front'
            }).append(
                $('<img>', {
                    src: symbol,
                    alt: 'Card symbol',
                    draggable: false,
                    onerror: "this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSI1IiBmaWxsPSIjRkZGIi8+PC9zdmc+'"
                })
            );
            
            const cardBack = $('<div>', {
                class: 'card-back'
            });
            
            card.append(cardFront, cardBack);
            
            // Prevent drag
            card.on('dragstart', function(e) {
                e.preventDefault();
            });
            
            $('#memory-board').append(card);
        });
        
        // Card event delegation
        $('#memory-board').on('click', '.memory-card', flipCard);
    }
    
    // Flip card
    function flipCard() {
        const $card = $(this);
        
        if (!canFlip || $card.hasClass('flipped') || $card.hasClass('matched')) return;
        
        // Initialize timer
        if (!gameStarted) {
            startTimer();
            gameStarted = true;
        }
        
        $card.addClass('flipped');
        flippedCards.push($card);
        
        if (flippedCards.length === 2) {
            canFlip = false;
            moves++;
            $('#moves-counter').text(moves);
            checkForMatch();
        }
    }
    
    // Verify match
    function checkForMatch() {
        const $card1 = flippedCards[0];
        const $card2 = flippedCards[1];
        const isMatch = $card1.data('symbol') === $card2.data('symbol');
        
        if (isMatch) {
            $card1.addClass('matched flipped');
            $card2.addClass('matched flipped');
            matchedPairs++;
            
            const difficulty = $('#difficulty-select').val();
            const totalPairs = difficultySettings[difficulty].pairs;
            $('#pairs-counter').text(`${matchedPairs}/${totalPairs}`);
            
            flippedCards = [];
            canFlip = true;
            
            if (matchedPairs === totalPairs) {
                stopTimer();
                setTimeout(showResultScreen, 500);
            }
        } else {
            setTimeout(() => {
                $card1.removeClass('flipped');
                $card2.removeClass('flipped');
                flippedCards = [];
                canFlip = true;
            }, 1000);
        }
    }
    
    // Calculate Memory score
    function calculateMemoryScore(moves, timeSeconds, difficulty) {
        let baseScore = 1000;
    
        const movePenalty = moves * 10;
        const timePenalty = timeSeconds * 2;
    
        let difficultyMultiplier = 1;
        if (difficulty === 'medium') difficultyMultiplier = 1.5;
        if (difficulty === 'hard') difficultyMultiplier = 2;
    
        const score = Math.max(100, baseScore - movePenalty - timePenalty);
        return Math.round(score * difficultyMultiplier);
    }
    
    // Save score to API
    async function saveMemoryScore(timeSeconds, difficulty, moves) {
        if (!window.ArcadeAPI || !window.ArcadeAPI.isLoggedIn()) {
            console.log('User not logged in, score not saved');
            return null;
        }
    
        const score = calculateMemoryScore(moves, timeSeconds, difficulty);
        
        const gameData = {
            game: 'memory',
            difficulty: difficultySettings[difficulty].difficultyValue,
            score: score,
            moves: moves,
            time_seconds: timeSeconds
        };
        
        try {
            const result = await window.ArcadeAPI.saveScore(gameData);
            if (result.success) {
                console.log('Memory score saved:', result.data);
                return result.data;
            }
            return null;
        } catch (error) {
            console.error('Error saving memory score:', error);
            return null;
        }
    }
    
    // Result screen functions (Mismo formato que Minesweeper)
    async function showResultScreen() {
        const difficulty = $('#difficulty-select').val();
        const settings = difficultySettings[difficulty];
        
        // Calculate and save score
        let calculatedScore = calculateMemoryScore(moves, elapsedTime, difficulty);
        let savedScore = null;
        
        if (window.ArcadeAPI && window.ArcadeAPI.isLoggedIn()) {
            savedScore = await saveMemoryScore(elapsedTime, difficulty, moves);
        }
        
        // Update result screen - Mismo formato que Minesweeper
        $('#result-icon').text('🏆');
        $('#result-title').text('Congratulations!');
        $('#result-message').text('You completed the game');
        
        // Show score if calculated
        if (calculatedScore > 0) {
            $('#result-score').text(calculatedScore);
            $('#result-score-container').show();
            
            // Update message based on login status
            if (!window.ArcadeAPI || !window.ArcadeAPI.isLoggedIn()) {
                $('#result-message').html('You completed the game!<br><small>Log in to save your score.</small>');
            } else {
                $('#result-message').html('You completed the game!<br><small>Score saved to leaderboard.</small>');
            }
        }
        
        $('#result-time').text($('#time-counter').text());
        $('#result-difficulty').text(settings.displayName);
        $('#result-moves').text(moves);
        
        // Update game status
        $('#game-status').text('Game Completed!').addClass('win');
        
        // Show result screen
        $('#result-screen').removeClass('hidden');
    }
    
    function hideResultScreen() {
        $('#result-screen').addClass('hidden');
        $('#result-score-container').hide();
    }
    
    // Restart game
    function resetGameStats() {
        moves = 0;
        matchedPairs = 0;
        flippedCards = [];
        canFlip = true;
        gameStarted = false;
        $('#moves-counter').text('0');
        
        const difficulty = $('#difficulty-select').val();
        const totalPairs = difficultySettings[difficulty].pairs;
        $('#pairs-counter').text(`0/${totalPairs}`);
        
        stopTimer();
        elapsedTime = 0;
        $('#time-counter').text('00:00');
    }
    
    // Timer functions
    function startTimer() {
        startTime = Date.now() - elapsedTime * 1000;
        timerInterval = setInterval(() => {
            elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            updateTimerDisplay();
        }, 1000);
    }
    
    function stopTimer() {
        clearInterval(timerInterval);
    }
    
    function updateTimerDisplay() {
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;
        $('#time-counter').text(`${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
    }
    
    // Event Listeners
    $('#restart-btn').on('click', initializeGame);
    $('#difficulty-select').on('change', initializeGame);
    $('#result-restart').on('click', function() {
        initializeGame();
    });
    
    // Initialize Game
    initializeGame();
});
