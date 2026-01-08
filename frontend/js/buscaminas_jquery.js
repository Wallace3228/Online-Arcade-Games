// Minesweeper Logic with jQuery - INTEGRATED VERSION
$(document).ready(function() {
  console.log('Minesweeper game loaded');
  
  // Game variables
  let board = [];
  let mines = [];
  let flags = [];
  let gameOver = false;
  let gameWon = false;
  let firstClick = true;
  let totalCellsRevealed = 0;
  
  // Timer variables
  let startTime;
  let elapsedTime = 0;
  let timerInterval;
  let gameStarted = false;
  
  // Delay for game over screen
  let gameOverTimeout;
  
  // Difficulty settings
  const difficultySettings = {
    easy: {
      rows: 8,
      cols: 10,
      mines: 10,
      boardClass: 'board-easy',
      displayName: 'Easy'
    },
    medium: {
      rows: 14,
      cols: 18,
      mines: 40,
      boardClass: 'board-medium',
      displayName: 'Medium'
    },
    hard: {
      rows: 20,
      cols: 24,
      mines: 99,
      boardClass: 'board-hard',
      displayName: 'Hard'
    }
  };
  
  // Initialize game
  function initializeGame() {
    const difficulty = $('#difficulty-select').val();
    const settings = difficultySettings[difficulty];
    
    // Reset game state
    board = [];
    mines = [];
    flags = [];
    gameOver = false;
    gameWon = false;
    firstClick = true;
    totalCellsRevealed = 0;
    gameStarted = false;
    
    // Clear any pending timeout
    if (gameOverTimeout) {
      clearTimeout(gameOverTimeout);
      gameOverTimeout = null;
    }
    
    // Update UI
    $('#mines-counter').text(settings.mines);
    $('#flags-counter').text('0');
    $('#game-status').text('').removeClass('win lose');
    
    // Update board class and size
    $('#minesweeper-board').removeClass().addClass('minesweeper-board ' + settings.boardClass);
    
    // Create empty board
    createBoard(settings.rows, settings.cols);
    
    // Stop timer and reset
    stopTimer();
    elapsedTime = 0;
    $('#time-counter').text('00:00');
    
    hideResultScreen();
  }
  
  // Create empty board
  function createBoard(rows, cols) {
    $('#minesweeper-board').empty();
    
    for (let row = 0; row < rows; row++) {
      board[row] = [];
      for (let col = 0; col < cols; col++) {
        const cell = $('<div>', {
          class: 'cell',
          'data-row': row,
          'data-col': col
        });
        
        // Add click handlers
        cell.on('click', function(e) {
          if (e.button === 0) { // Left click
            handleCellClick($(this));
          }
        });
        
        cell.on('contextmenu', function(e) {
          e.preventDefault();
          handleCellRightClick($(this));
          return false;
        });
        
        // Prevent drag
        cell.on('dragstart', function(e) {
          e.preventDefault();
        });
        
        $('#minesweeper-board').append(cell);
        board[row][col] = {
          element: cell,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          isQuestion: false,
          neighborMines: 0
        };
      }
    }
  }
  
  // Place mines (avoiding first click position)
  function placeMines(firstRow, firstCol, totalMines, rows, cols) {
    mines = [];
    let minesPlaced = 0;
    
    while (minesPlaced < totalMines) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      
      // Don't place mine on first click cell or its neighbors
      const isNearFirstClick = Math.abs(row - firstRow) <= 1 && Math.abs(col - firstCol) <= 1;
      
      if (!board[row][col].isMine && !(row === firstRow && col === firstCol) && !isNearFirstClick) {
        board[row][col].isMine = true;
        mines.push({row, col});
        minesPlaced++;
      }
    }
    
    // Calculate neighbor mines for all cells
    calculateNeighborMines(rows, cols);
  }
  
  // Calculate neighbor mines for each cell
  function calculateNeighborMines(rows, cols) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!board[row][col].isMine) {
          let count = 0;
          
          // Check all 8 neighbors
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = row + dr;
              const nc = col + dc;
              
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
                count++;
              }
            }
          }
          
          board[row][col].neighborMines = count;
        }
      }
    }
  }
  
  // Handle cell click
  function handleCellClick($cell) {
    if (gameOver || gameWon) return;
    
    const row = parseInt($cell.data('row'));
    const col = parseInt($cell.data('col'));
    const cell = board[row][col];
    
    if (cell.isRevealed || cell.isFlagged) return;
    
    // Start timer on first click
    if (firstClick) {
      const difficulty = $('#difficulty-select').val();
      const settings = difficultySettings[difficulty];
      
      // Place mines after first click
      placeMines(row, col, settings.mines, settings.rows, settings.cols);
      
      startTimer();
      gameStarted = true;
      firstClick = false;
    }
    
    // If it's a mine
    if (cell.isMine) {
      gameOver = true;
      cell.element.addClass('mine revealed');
      
      // Stop the timer immediately
      stopTimer();
      
      // Reveal all mines
      revealAllMines();
      
      // Show result after 0.5s delay
      gameOverTimeout = setTimeout(() => {
        showResult(false);
      }, 500);
      
      return;
    }
    
    // Reveal cell
    revealCell(row, col);
    
    // Check win condition
    checkWinCondition();
  }
  
  // Handle cell right click (flag/query)
  function handleCellRightClick($cell) {
    if (gameOver || gameWon) return;
    
    const row = parseInt($cell.data('row'));
    const col = parseInt($cell.data('col'));
    const cell = board[row][col];
    
    if (cell.isRevealed) return;
    
    const difficulty = $('#difficulty-select').val();
    const totalMines = difficultySettings[difficulty].mines;
    
    // Cycle through: empty -> flag -> question -> empty
    if (!cell.isFlagged && !cell.isQuestion) {
      // Can't place more flags than mines
      if (flags.length >= totalMines) return;
      
      cell.isFlagged = true;
      cell.element.addClass('flagged');
      flags.push({row, col});
    } else if (cell.isFlagged) {
      cell.isFlagged = false;
      cell.isQuestion = true;
      cell.element.removeClass('flagged').addClass('question');
      flags = flags.filter(f => !(f.row === row && f.col === col));
    } else if (cell.isQuestion) {
      cell.isQuestion = false;
      cell.element.removeClass('question');
    }
    
    $('#flags-counter').text(flags.length);
  }
  
  // Reveal cell (recursive for empty cells)
  function revealCell(row, col) {
    if (row < 0 || row >= board.length || col < 0 || col >= board[0].length) return;
    
    const cell = board[row][col];
    if (cell.isRevealed || cell.isFlagged || cell.isQuestion) return;
    
    cell.isRevealed = true;
    cell.element.addClass('revealed');
    totalCellsRevealed++;
    
    // Remove any flag or question
    cell.isFlagged = false;
    cell.isQuestion = false;
    cell.element.removeClass('flagged question');
    
    // Update flags array
    flags = flags.filter(f => !(f.row === row && f.col === col));
    $('#flags-counter').text(flags.length);
    
    // If cell has mines around it, show number
    if (cell.neighborMines > 0) {
      cell.element.text(cell.neighborMines);
      cell.element.addClass('number-' + cell.neighborMines);
    } else {
      // If empty cell, reveal neighbors recursively
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          revealCell(row + dr, col + dc);
        }
      }
    }
  }
  
  // Reveal all mines when game is lost
  function revealAllMines() {
    for (const mine of mines) {
      const cell = board[mine.row][mine.col];
      if (!cell.isFlagged) {
        cell.isRevealed = true;
        cell.element.addClass('mine revealed');
      }
    }
  }
  
  // Check win condition
  function checkWinCondition() {
    const difficulty = $('#difficulty-select').val();
    const settings = difficultySettings[difficulty];
    const totalCells = settings.rows * settings.cols;
    const nonMineCells = totalCells - settings.mines;
    
    if (totalCellsRevealed === nonMineCells) {
      gameWon = true;
      stopTimer();
      
      // Flag all remaining mines
      for (const mine of mines) {
        const cell = board[mine.row][mine.col];
        if (!cell.isFlagged) {
          cell.isFlagged = true;
          cell.element.addClass('flagged');
        }
      }
      
      $('#flags-counter').text(settings.mines);
      setTimeout(() => {
        showResult(true);
      }, 500);
    }
  }
  
  // Calculate Minesweeper score
  function calculateMinesweeperScore(timeSeconds, difficulty, minesFound, totalMines) {
    let baseScore = 1000;
    let timePenalty = timeSeconds * 10;
    
    // Multiplier by difficulty
    let difficultyMultiplier = 1;
    if (difficulty === 'medium') difficultyMultiplier = 1.5;
    if (difficulty === 'hard') difficultyMultiplier = 2;
    
    // Bonus for finding all mines correctly
    let minesBonus = 0;
    if (minesFound === totalMines) {
      minesBonus = 200; // Bonus for finding all mines
    }
    
    const score = Math.max(100, (baseScore - timePenalty) * difficultyMultiplier + minesBonus);
    return Math.round(score);
  }
  
  // Save score to API
  async function saveMinesweeperScore(isWin, timeSeconds, difficulty, minesFound, totalMines) {
    if (!window.ArcadeAPI || !window.ArcadeAPI.isLoggedIn()) {
      console.log('User not logged in, score not saved');
      return null;
    }
    
    // Only save if won
    if (!isWin) {
      console.log('Game lost, score not saved');
      return null;
    }
    
    const score = calculateMinesweeperScore(timeSeconds, difficulty, minesFound, totalMines);
    
    const gameData = {
      game: 'minesweeper',
      difficulty: difficulty,
      score: score,
      moves: minesFound, // We use minesFound as "moves"
      time_seconds: timeSeconds
    };
    
    try {
      const result = await window.ArcadeAPI.saveScore(gameData);
      if (result.success) {
        console.log('Minesweeper score saved:', result.data);
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error saving minesweeper score:', error);
      return null;
    }
  }
  
  // Result screen functions
  async function showResult(isWin) {
    const difficulty = $('#difficulty-select').val();
    const settings = difficultySettings[difficulty];
    
    // Save score if user is logged in and won
    let savedScore = null;
    let calculatedScore = 0;
    
    if (isWin) {
      calculatedScore = calculateMinesweeperScore(
        elapsedTime, 
        difficulty, 
        flags.length, 
        settings.mines
      );
      
      if (window.ArcadeAPI && window.ArcadeAPI.isLoggedIn()) {
        savedScore = await saveMinesweeperScore(
          isWin, 
          elapsedTime, 
          difficulty, 
          flags.length, 
          settings.mines
        );
      }
    }
    
    // Update result screen
    if (isWin) {
      $('#result-icon').text('🏆');
      $('#result-title').text('Congratulations!');
      $('#result-message').text('You won the game');
      $('#game-status').text('You won!').addClass('win');
      
      // Show score if calculated
      if (calculatedScore > 0) {
        $('#result-score').text(calculatedScore);
        $('#result-score-container').show();
        
        // Show message if user is not logged in
        if (!window.ArcadeAPI || !window.ArcadeAPI.isLoggedIn()) {
          $('#result-message').html('You won the game!<br><small>Log in to save your score.</small>');
        }
      }
    } else {
      $('#result-icon').text('💥');
      $('#result-title').text('Game Over!');
      $('#result-message').text('You hit a mine');
      $('#game-status').text('You lost').addClass('lose');
      $('#result-score-container').hide();
    }
    
    $('#result-time').text($('#time-counter').text());
    $('#result-difficulty').text(settings.displayName);
    $('#result-mines').text(isWin ? `${settings.mines}/${settings.mines}` : `${flags.length}/${settings.mines}`);
    
    // Show result screen
    $('#result-screen').removeClass('hidden');
  }
  
  function hideResultScreen() {
    $('#result-screen').addClass('hidden');
    $('#result-score-container').hide();
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
  $('#result-close').on('click', hideResultScreen);
  
  // Initialize Game
  initializeGame();
});
