var tictactoe = (function () {

    var
        COMPUTER = true,
        GAME_OVER = 1,
        WAITING_USER_XO_SELECTION = 2,
        PLAYER = false,
        O = 'O',
        X = 'X',
        $canvas,
        computerColor,
        computerSymbol,
        firstSquarePlayedByPlayer,
        gameStatus,
        isNormalMode = location.hash !== '#easy',
        playNumber = 0,
        playerColor,
        playerSymbol,
        whoGoesFirst = PLAYER,
        whoseTurn = whoGoesFirst;

    function checkIfGameOver() {
        var gameOver = false,
            gameOverMessage,
            winningRow;

        if (0 === gameGrid.getAvailableSquares('all').length) {
            //all squares have already been taken by an X or an O - tie game
            gameOver = true;
            gameOverMessage = 'it\'s a draw!';
        }

        winningRow = gameGrid.getWinningRow();

        if (winningRow) {
            gameOver = true;
            gameOverMessage = winningRow[0].xOrO === playerSymbol ? 'you won!' : 'better luck next time!';
            gameGrid.drawWinLine($canvas, winningRow);
        }

        if (gameOver) {
            gameStatus = GAME_OVER;
            $('#message')
                .text(gameOverMessage)
                .css('color', 'black')
                .shiftLetters({
                    duration: 400,
                    easing: 'easeOutBounce'
                });

            setTimeout(function () {
                if (gameStatus === GAME_OVER) {  //don't display if user already restarted game
                    $('#message')
                        .text('Click on game to play again')
                        .css('color', '#000');
                }
            }, 3000);
        }
        return gameOver
    }

    function doComputersTurn() {
        var availableCorner,
            iminentPlayerWin,
            iminentComputerWin,
            checkMateSquareComputer,
            checkMateSquarePlayer,
            squareToPlay = -1;

        playNumber++;

        function getNearestCornerToEdge(edgeSquareNumber) {
            return edgeSquareNumber < 5 ? 0 : 8;
        }

        if (iminentComputerWin = findIminentWin(computerSymbol)) {
            //win if you can on this play!
            squareToPlay = iminentComputerWin.squareToBlockWin;
        }

        if ((iminentPlayerWin = findIminentWin(playerSymbol)) && -1 === squareToPlay) {
            //block opponent from winning this play
            squareToPlay = iminentPlayerWin.squareToBlockWin;
        }

        if ((checkMateSquareComputer = findCheckmate(computerSymbol)) && -1 === squareToPlay && isNormalMode) {
            //create 'checkmate' this play to win next play
            squareToPlay = checkMateSquareComputer.checkMateSquareNumber
        }

        if ((checkMateSquarePlayer = findCheckmate(playerSymbol)) && -1 === squareToPlay && isNormalMode) {
            //block opponent from creating a checkmate
            squareToPlay = checkMateSquarePlayer.checkMateSquareNumber
        }

        if (whoGoesFirst === COMPUTER && 1 === playNumber && -1 === squareToPlay && isNormalMode) {
            squareToPlay = 0; //always start in top left corner if computer first
        }

        if (whoGoesFirst === COMPUTER && 3 === playNumber && -1 === squareToPlay && isNormalMode) {
            firstSquarePlayedByPlayer = utility.deepCopy(gameGrid.getXorOSquares(playerSymbol)[0]);

            if (firstSquarePlayedByPlayer.isCorner) {
                squareToPlay = gameGrid.getAvailableSquares('corner')[0].squareNumber;
            }

            if (firstSquarePlayedByPlayer.isEdge) {
                squareToPlay = gameGrid.positions.CENTER;
            }

            if (firstSquarePlayedByPlayer.isCenter) {
                squareToPlay = gameGrid.positions.LOWER_RIGHT;
            }
        }

        if (whoGoesFirst === PLAYER && 2 === playNumber && -1 === squareToPlay && isNormalMode) {
            firstSquarePlayedByPlayer = utility.deepCopy(gameGrid.getXorOSquares(playerSymbol)[0]);

            if (firstSquarePlayedByPlayer.isCorner) {
                squareToPlay = gameGrid.positions.CENTER;
            }

            if (firstSquarePlayedByPlayer.isCenter) {
                squareToPlay = gameGrid.getAvailableSquares('corner')[0].squareNumber;
            }

            if (firstSquarePlayedByPlayer.isEdge) {
                squareToPlay = getNearestCornerToEdge(firstSquarePlayedByPlayer.squareNumber)
            }
        }
        
        if (whoGoesFirst === PLAYER && 4 === playNumber && -1 === squareToPlay && isNormalMode) {
            if (firstSquarePlayedByPlayer.isCorner) {
                squareToPlay = gameGrid.getAvailableSquares('edge')[0].squareNumber;
            } else if (!gameGrid.getSquareValue(gameGrid.positions.CENTER)) {
                squareToPlay = gameGrid.positions.CENTER;
            } else {
                availableCorner = gameGrid.getAvailableSquares('corner')[0];
                squareToPlay = availableCorner && availableCorner.squareNumber;
            }
        }

        //if square to play has not been determined, randomly pick an available square to play
        if (-1 === squareToPlay) {
            squareToPlay = Math.floor(Math.random() * 9);  //random number >= 0 and <= 8

            //starting at random number, search for an available square
            while (gameGrid.getSquareValue(squareToPlay)) {
                squareToPlay = ++squareToPlay % 9;
            };
        }

        gameGrid.setSquareValue($canvas, squareToPlay, computerSymbol);

        if (!checkIfGameOver()) {
            setWhoseTurn(!whoseTurn);
        }
    }

    function doPlayersTurn(squareNumber) {
        playNumber++;

        gameGrid.setSquareValue($canvas, squareNumber, playerSymbol);

        if (!checkIfGameOver()) {
            setWhoseTurn(!whoseTurn);

            setTimeout(function () {
                doComputersTurn();
            }, 1000)
        }
    }

    function findCheckmate(xOrO) {
        //a 'checkmate' is when a player has 2 different rows with 2 marked squares and one blank. 
        //this is a checkmate because the opponent can only block 1 row, allowing the player to win on the other row
        //This function searches grid for a square that, if taken, will create a checkmate for either X or O player
        var checkMateSquareNumber,
            availableSquares,
            iminentWinRows;

        availableSquares = gameGrid.getAvailableSquares('all'),  //available squares do not have an X or O

        availableSquares.forEach(function (availableSquare) {
            availableSquare.xOrO = xOrO;    //temporarily set xOrO so we can test if this creates a checkmate

            if (gameGrid.getIminentWinRows(xOrO).length === 2) {
                if (!isNaN(checkMateSquareNumber) && playerSymbol === xOrO) {
                    checkMateSquareNumber = null;
                } else {
                    checkMateSquareNumber = availableSquare.squareNumber;
                }
            }

            delete availableSquare.xOrO;    //reset
        });

        return checkMateSquareNumber && { checkMateSquareNumber: checkMateSquareNumber };
    }

    function findIminentWin(xOrO) {
        //identify square to occupy to prevent opponent win on next move
        var iminentWinRows = gameGrid.getIminentWinRows(xOrO),
            squareToBlockWin;

        if (iminentWinRows.length) {
            squareToBlockWin = iminentWinRows[0].filter(function (square) {
                return !square.xOrO;  //unoccuied square is the square to block to prevent player win
            })[0].squareNumber
            return { squareToBlockWin: squareToBlockWin }
        }
    }

    function handleCanvasClick(x, y) {
        var squareNumber;

        if (gameStatus === WAITING_USER_XO_SELECTION) {
            return;
        }

        if (gameStatus === GAME_OVER) {
            restartGame();
            return;
        }

        if (COMPUTER === whoseTurn) {
            return;
        }

        squareNumber = gameGrid.getSquareNumberFromXYCoord(x, y);

        if (isNaN(squareNumber)) {
            return;
        }

        if (gameGrid.getSquareValue(squareNumber)) {
            return;  //square is already taken
        }

        doPlayersTurn(squareNumber);

    }

    function init() {
        $(function () {
            $canvas = $('canvas');
            setEventHandlers();
            gameStatus = WAITING_USER_XO_SELECTION;
            gameGrid.drawGame($canvas);

            if (whoGoesFirst === COMPUTER) {
                $('#message').text('my turn');
                setTimeout(function () {
                    doComputersTurn();
                }, 1000);
            }
        })
    };

    function restartGame() {
        playNumber = 0;

        gameGrid.refreshGame($canvas);
        gameStatus = !GAME_OVER;
        whoGoesFirst = !whoGoesFirst;
        setWhoseTurn(whoGoesFirst);
        if (whoGoesFirst === COMPUTER) {
            setTimeout(function () {
                doComputersTurn();
            }, 1000);
        }
    }

    function setEventHandlers() {
        $canvas.click(function (e) {
            handleCanvasClick(e.offsetX, e.offsetY)
        });
        $('#X').click(function () {
            setSymbolsAndColors(X);
            startGame();
        });
        $('#O').click(function () {
            setSymbolsAndColors(O);
            startGame();
        });
    }

    function setSymbolsAndColors(xOrO) {
        playerSymbol = xOrO;
        playerColor = playerSymbol === X ? 'red' : 'green';

        computerSymbol = playerSymbol === X ? O : X;
        computerColor = computerSymbol === X ? 'red' : 'green';
    }

    function setWhoseTurn(who) {
        whoseTurn = who;
        $('#message')
            .text(whoseTurn === PLAYER ? 'your turn...' : 'my turn...')
            .css('color', whoseTurn === PLAYER ? playerColor : computerColor);
    }

    function startGame() {
        gameStatus = !GAME_OVER;
        setWhoseTurn(whoseTurn);
    }

    return {
        init: init
    };
}());

tictactoe.init();