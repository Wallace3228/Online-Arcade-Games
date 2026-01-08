// 2048 Game Logic with jQuery - INTEGRATED WITH API
$(document).ready(function() {
  console.log('2048 Game loaded - API Version');
  
  // Game variables
  let grid = [];
  let score = 0;
  let moves = 0;
  let gameWon = false;
  let gameOver = false;
  let gameStarted = false;
  
  // Grid size (standard 2048 is 4x4)
  const GRID_SIZE = 4;
  
  // Timer variables
  let startTime;
  let elapsedTime = 0;
  let timerInterval;
  let timerRunning = false;
  
  // Dark mode toggle
  $('#theme-toggle').on('click', function() {
    $('body').toggleClass('dark');
    $(this).text($('body').hasClass('dark') ? '☀️' : '🌙');
  });
  
  // Initialize game
  function initializeGame() {
    // Reset game state
    grid = createEmptyGrid();
    score = 0;
    moves = 0;
    gameWon = false;
    gameOver = false;
    gameStarted = false;
    
    // Update UI
    $('#score-counter').text('0');
    $('#moves-counter').text('0');
    $('#game-status').text('').removeClass('win lose');
    
    // Create board
    renderBoard();
    
    // Add two initial tiles
    addRandomTile();
    addRandomTile();
    
    // Update UI
    updateUI();
    
    // Stop timer and reset
    stopTimer();
    elapsedTime = 0;
    $('#time-counter').text('00:00');
    timerRunning = false;
    
    hideResultScreen();
  }
  
  // Create empty 4x4 grid
  function createEmptyGrid() {
    const grid = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      grid[row] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        grid[row][col] = 0;
      }
    }
    return grid;
  }
  
  // Render the game board
  function renderBoard() {
    $('#game-board').empty();
    
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = $('<div>', {
          class: 'board-cell',
          'data-row': row,
          'data-col': col
        });
        
        $('#game-board').append(cell);
      }
    }
    
    updateTiles();
  }
  
  // Update all tiles on the board
  function updateTiles() {
    // Remove existing tiles
    $('.tile').remove();
    
    // Add current tiles
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const value = grid[row][col];
        if (value > 0) {
          const tile = $('<div>', {
            class: `tile tile-${value}`,
            text: value,
            'data-row': row,
            'data-col': col
          });
          
          // Position the tile
          const cell = $(`.board-cell[data-row="${row}"][data-col="${col}"]`);
          cell.append(tile);
        }
      }
    }
  }
  
  // Add a random tile (2 or 4) to an empty cell
  function addRandomTile() {
    const emptyCells = [];
    
    // Find all empty cells
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }
    
    if (emptyCells.length > 0) {
      // Pick a random empty cell
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      
      // 90% chance for 2, 10% chance for 4
      const value = Math.random() < 0.9 ? 2 : 4;
      
      // Add the tile
      grid[randomCell.row][randomCell.col] = value;
      
      // Add new tile animation
      const tile = $(`.tile[data-row="${randomCell.row}"][data-col="${randomCell.col}"]`);
      tile.addClass('tile-new');
      setTimeout(() => tile.removeClass('tile-new'), 200);
    }
  }
  
  // Update UI elements
  function updateUI() {
    $('#score-counter').text(score);
    $('#moves-counter').text(moves);
  }
  
  // Start timer on first move
  function startGameTimer() {
    if (!timerRunning) {
      startTime = Date.now() - elapsedTime * 1000;
      timerInterval = setInterval(() => {
        elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        updateTimerDisplay();
      }, 1000);
      timerRunning = true;
    }
  }
  
  // Update timer display
  function updateTimerDisplay() {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    $('#time-counter').text(`${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
  }
  
  // Stop timer
  function stopTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
  }
  
  // Move tiles in a direction
  function move(direction) {
    if (gameOver) return false;
    
    // Start timer on first move
    if (!gameStarted) {
      gameStarted = true;
      startGameTimer();
    }
    
    let moved = false;
    
    switch(direction) {
      case 'up':
        moved = moveUp();
        break;
      case 'down':
        moved = moveDown();
        break;
      case 'left':
        moved = moveLeft();
        break;
      case 'right':
        moved = moveRight();
        break;
    }
    
    // If any tile moved
    if (moved) {
      moves++;
      addRandomTile();
      updateUI();
      updateTiles();
      checkGameStatus();
      return true;
    }
    
    return false;
  }
  
  // Move tiles up
  function moveUp() {
    let moved = false;
    
    for (let col = 0; col < GRID_SIZE; col++) {
      // Process column from top to bottom
      for (let row = 1; row < GRID_SIZE; row++) {
        if (grid[row][col] !== 0) {
          let currentRow = row;
          
          // Move tile up as far as possible
          while (currentRow > 0 && grid[currentRow - 1][col] === 0) {
            grid[currentRow - 1][col] = grid[currentRow][col];
            grid[currentRow][col] = 0;
            currentRow--;
            moved = true;
          }
          
          // Merge if possible
          if (currentRow > 0 && grid[currentRow - 1][col] === grid[currentRow][col]) {
            grid[currentRow - 1][col] *= 2;
            score += grid[currentRow - 1][col];
            grid[currentRow][col] = 0;
            
            // Add merge animation
            const tile = $(`.tile[data-row="${currentRow - 1}"][data-col="${col}"]`);
            tile.addClass('tile-merged');
            setTimeout(() => tile.removeClass('tile-merged'), 200);
            
            moved = true;
          }
        }
      }
    }
    
    return moved;
  }
  
  // Move tiles down
  function moveDown() {
    let moved = false;
    
    for (let col = 0; col < GRID_SIZE; col++) {
      // Process column from bottom to top
      for (let row = GRID_SIZE - 2; row >= 0; row--) {
        if (grid[row][col] !== 0) {
          let currentRow = row;
          
          // Move tile down as far as possible
          while (currentRow < GRID_SIZE - 1 && grid[currentRow + 1][col] === 0) {
            grid[currentRow + 1][col] = grid[currentRow][col];
            grid[currentRow][col] = 0;
            currentRow++;
            moved = true;
          }
          
          // Merge if possible
          if (currentRow < GRID_SIZE - 1 && grid[currentRow + 1][col] === grid[currentRow][col]) {
            grid[currentRow + 1][col] *= 2;
            score += grid[currentRow + 1][col];
            grid[currentRow][col] = 0;
            
            // Add merge animation
            const tile = $(`.tile[data-row="${currentRow + 1}"][data-col="${col}"]`);
            tile.addClass('tile-merged');
            setTimeout(() => tile.removeClass('tile-merged'), 200);
            
            moved = true;
          }
        }
      }
    }
    
    return moved;
  }
  
  // Move tiles left
  function moveLeft() {
    let moved = false;
    
    for (let row = 0; row < GRID_SIZE; row++) {
      // Process row from left to right
      for (let col = 1; col < GRID_SIZE; col++) {
        if (grid[row][col] !== 0) {
          let currentCol = col;
          
          // Move tile left as far as possible
          while (currentCol > 0 && grid[row][currentCol - 1] === 0) {
            grid[row][currentCol - 1] = grid[row][currentCol];
            grid[row][currentCol] = 0;
            currentCol--;
            moved = true;
          }
          
          // Merge if possible
          if (currentCol > 0 && grid[row][currentCol - 1] === grid[row][currentCol]) {
            grid[row][currentCol - 1] *= 2;
            score += grid[row][currentCol - 1];
            grid[row][currentCol] = 0;
            
            // Add merge animation
            const tile = $(`.tile[data-row="${row}"][data-col="${currentCol - 1}"]`);
            tile.addClass('tile-merged');
            setTimeout(() => tile.removeClass('tile-merged'), 200);
            
            moved = true;
          }
        }
      }
    }
    
    return moved;
  }
  
  // Move tiles right
  function moveRight() {
    let moved = false;
    
    for (let row = 0; row < GRID_SIZE; row++) {
      // Process row from right to left
      for (let col = GRID_SIZE - 2; col >= 0; col--) {
        if (grid[row][col] !== 0) {
          let currentCol = col;
          
          // Move tile right as far as possible
          while (currentCol < GRID_SIZE - 1 && grid[row][currentCol + 1] === 0) {
            grid[row][currentCol + 1] = grid[row][currentCol];
            grid[row][currentCol] = 0;
            currentCol++;
            moved = true;
          }
          
          // Merge if possible
          if (currentCol < GRID_SIZE - 1 && grid[row][currentCol + 1] === grid[row][currentCol]) {
            grid[row][currentCol + 1] *= 2;
            score += grid[row][currentCol + 1];
            grid[row][currentCol] = 0;
            
            // Add merge animation
            const tile = $(`.tile[data-row="${row}"][data-col="${currentCol + 1}"]`);
            tile.addClass('tile-merged');
            setTimeout(() => tile.removeClass('tile-merged'), 200);
            
            moved = true;
          }
        }
      }
    }
    
    return moved;
  }
  
  // Check game status (win/lose)
  function checkGameStatus() {
    // Check for win (2048 tile)
    let highestTile = 0;
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col] > highestTile) {
          highestTile = grid[row][col];
        }
        if (grid[row][col] === 2048 && !gameWon) {
          gameWon = true;
          setTimeout(() => showResultScreen(true), 500);
          return;
        }
      }
    }
    
    // Check for game over
    if (isGameOver()) {
      gameOver = true;
      stopTimer();
      setTimeout(() => showResultScreen(false), 500);
    }
  }
  
  // Check if game is over (no more moves possible)
  function isGameOver() {
    // Check for empty cells
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col] === 0) {
          return false;
        }
      }
    }
    
    // Check for possible merges
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const value = grid[row][col];
        
        // Check right neighbor
        if (col < GRID_SIZE - 1 && grid[row][col + 1] === value) {
          return false;
        }
        
        // Check bottom neighbor
        if (row < GRID_SIZE - 1 && grid[row + 1][col] === value) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  // Get highest tile value
  function getHighestTile() {
    let highest = 0;
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col] > highest) {
          highest = grid[row][col];
        }
      }
    }
    return highest;
  }
  
  // =====================
  // API Integration Functions
  // =====================
  
  // Calculate 2048 score for leaderboard
  function calculate2048Score(finalScore, highestTile, timeSeconds, moves) {
    let baseScore = finalScore; // Use the final game score as base
    
    // Bonus for reaching higher tiles
    let tileBonus = 0;
    if (highestTile >= 2048) tileBonus = 1000;
    else if (highestTile >= 1024) tileBonus = 500;
    else if (highestTile >= 512) tileBonus = 250;
    else if (highestTile >= 256) tileBonus = 100;
    
    // Efficiency bonus (score per move)
    const efficiency = moves > 0 ? finalScore / moves : 0;
    const efficiencyBonus = Math.min(500, efficiency * 10);
    
    // Time penalty (higher scores should be faster)
    const timePenalty = timeSeconds * 2;
    
    const totalScore = Math.max(100, baseScore + tileBonus + efficiencyBonus - timePenalty);
    return Math.round(totalScore);
  }
  
  // Save score to API
  async function save2048Score(finalScore, highestTile, timeSeconds, moves) {
    if (!window.ArcadeAPI || !window.ArcadeAPI.isLoggedIn()) {
      console.log('User not logged in, score not saved');
      return null;
    }
    
    const score = calculate2048Score(finalScore, highestTile, timeSeconds, moves);
    
    const gameData = {
      game: '2048',
      difficulty: 'standard', // 2048 has only standard difficulty
      score: score,
      moves: moves,
      time_seconds: timeSeconds
    };
    
    try {
      const result = await window.ArcadeAPI.saveScore(gameData);
      if (result.success) {
        console.log('2048 score saved:', result.data);
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error saving 2048 score:', error);
      return null;
    }
  }
  
  // Result screen functions
  async function showResultScreen(isWin) {
    const highestTile = getHighestTile();
    
    // Calculate final score for display
    const finalScore = score;
    const calculatedScore = calculate2048Score(finalScore, highestTile, elapsedTime, moves);
    
    // Save score if user is logged in
    let savedScore = null;
    if (window.ArcadeAPI && window.ArcadeAPI.isLoggedIn()) {
      savedScore = await save2048Score(finalScore, highestTile, elapsedTime, moves);
    }
    
    // Update result screen
    if (isWin) {
      $('#result-icon').text('🏆');
      $('#result-title').text('Congratulations!');
      $('#result-message').text('You reached the 2048 tile!');
      $('#game-status').text('You won! Keep playing to get a higher score.').addClass('win');
    } else {
      $('#result-icon').text('💥');
      $('#result-title').text('Game Over!');
      $('#result-message').text('No more moves possible');
      $('#game-status').text('Game Over').addClass('lose');
    }
    
    // Update result stats - show calculated score
    $('#result-score').text(calculatedScore);
    $('#result-time').text($('#time-counter').text());
    $('#result-moves').text(moves);
    $('#result-highest').text(highestTile);
    
    // Show login prompt if user is not logged in
    if (!window.ArcadeAPI || !window.ArcadeAPI.isLoggedIn()) {
      if (isWin) {
        $('#result-message').html('You reached the 2048 tile!<br><small>Log in to save your score on the leaderboard!</small>');
      } else {
        $('#result-message').html('Game Over!<br><small>Log in to save your scores when you win.</small>');
      }
    } else if (savedScore) {
      $('#result-message').html((isWin ? 'You reached the 2048 tile!' : 'Game Over!') + '<br><small>Score saved to leaderboard!</small>');
    }
    
    // Show result screen
    $('#result-screen').removeClass('hidden');
  }
  
  function hideResultScreen() {
    $('#result-screen').addClass('hidden');
  }
  
  // Keyboard controls
  $(document).on('keydown', function(e) {
    if (gameOver && !gameWon) return;
    
    switch(e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        move('up');
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        move('down');
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        move('left');
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        move('right');
        break;
    }
  });
  
  // Swipe controls for mobile
  let touchStartX = 0;
  let touchStartY = 0;
  
  $(document).on('touchstart', function(e) {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  });
  
  $(document).on('touchend', function(e) {
    if (e.changedTouches.length === 1 && gameStarted) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      const minSwipeDistance = 30;
      
      // Determine swipe direction
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (Math.abs(dx) > minSwipeDistance) {
          if (dx > 0) {
            move('right');
          } else {
            move('left');
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(dy) > minSwipeDistance) {
          if (dy > 0) {
            move('down');
          } else {
            move('up');
          }
        }
      }
    }
  });
  
  // Event Listeners - MODIFICADO: Cambiados los IDs de los botones
  $('#restart-btn').on('click', initializeGame);
  $('#result-restart').on('click', function() {
    initializeGame();
  });
  $('#result-close').on('click', hideResultScreen);
  
  // Initialize Game
  initializeGame();
});
