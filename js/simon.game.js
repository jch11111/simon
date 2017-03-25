/*
* simon.game.js
* game play module
*/


/*
add tests
namespace css
clean up css
add win celebration if user makes it to 20
add number of plays in game to url hash
*/
simon.game = (function () {
    "use strict";

    //----------------------- BEGIN MODULE SCOPE VARIABLES -----------------------
    var
        COMPUTERS_TURN  = { who: 'computer'},
        PLAYERS_TURN    = { who: 'player' },
        configMap = {
            numberOfPlays       : 20,

            //buttonIdToNumberMap allows looking up the button number by button id
            //buttons are numbered 0 - 4. 
            //The button numbers correspond the the numbers in the 'sequence' which is the sequence of 20 tones the simon game will play in a game
            //The sequence is an array of tone numbers from 0 - 4
            buttonIdToNumberMap         : {
                'colorButton0': 0,
                'colorButton1': 1,
                'colorButton2': 2,
                'colorButton3': 3,
            }
        },
        jqueryMap = {
            gameImage       : null,     //gameImage is the svg image of the game
            scoreDisplay    : null      //scoreDisplay is the UI element within the svg gameImage for displaying the score
        },

        // stateMap - current state of the game
        stateMap = {
            gameSequenceOfTones                : [],
            
            //isGameOn means the on/off button is on.
            //isGameOn is set in toggleButtonStateAndColor function (via call to setButtonStateAndColor)
            isGameOn                    : false,

            //isGameStarted means the game is on (on/off button is on) and the start button has been pressed (set in playGame function)
            //isGameStarted is set to false if
            //  user hit the wrong tone in strict mode or the game was turned off (set to false in playGame function)
            
            isGameStarted               : false,
            isStrictMode                : false,
            playNumber                  : null,

            //score is incremented in playGame only
            score                       : 0,
            userSequence                : null,

            // whoseTurn Is either COMPUTERS_TURN or PLAYERS_TURN. This will be COMPUTERS_TURN when:
            //* Game started or restarted (playgame function)
            //* User has successfully played all tones in the current sequence (handleGameButtonMouseUp function)
            //* User played an incorrect tone in the sequence in non strict mode (playGame function)
            whoseTurn                   : null,
            userPlayValid               : true,
            currentPlayerTone           : null,
            isGameRestarted             : false
            //playSequencePromises        : []
        },
        startGameTimeoutId
    //----------------------- END MODULE SCOPE VARIABLES -----------------------
    function displayScore () {
        jqueryMap.scoreDisplay.text(stateMap.score);
    }

    //----------------------- BEGIN EVENT HANDLERS -----------------------
    function handleButtonMouseOver (e) {
        //this handles mouse over for both game buttons (the 4 color buttons) as well as control buttons (on/off, restart, strict)
        var button = e.button;
        $(button).css('cursor', 'pointer');
        return false;
    }

    function handleButtonMouseOut(e) {
        //this handles mouse over for both game buttons (the 4 color buttons) as well as control buttons (on/off, restart, strict)
        var button = e.button;
        $(button).css('cursor', 'default');
        return false;
    }

    function handleGameButtonMouseDown(e) {
        var button = e.button;
        if (!stateMap.isGameOn || stateMap.whoseTurn === COMPUTERS_TURN) {
            return false;
        }

        if (!stateMap.userPlayValid) {
            playFailSound();
            return;
        }

        if (stateMap.whoseTurn === PLAYERS_TURN) {
            stateMap.userSequence.push(configMap.buttonIdToNumberMap[button.id]);
            stateMap.currentPlayerTone++;
            if (!verifyUserPlay()) {
                stateMap.userPlayValid = false;
                playFailSound();
                return false;
            }
        }

        simon.buttons.setButtonColor(button, true);
        simon.sound.play(button.id)
        return false;
    }

    function handleGameButtonMouseUp(e) {
        var button = e.button,
            numberOfTonesForUserToPlay = stateMap.playNumber;
            
        if (!stateMap.isGameOn || stateMap.whoseTurn === COMPUTERS_TURN) {
            return false;
        }
        simon.buttons.setButtonColor(button, false);
        simon.sound.pause(button.id);

        if (userPlayedSequenceSuccessfully()) {
            stateMap.whoseTurn = COMPUTERS_TURN;
        }
        return false;

        function userPlayedSequenceSuccessfully() {
            return stateMap.userPlayValid && stateMap.currentPlayerTone === numberOfTonesForUserToPlay;
        }
    }

    function handleControlButtonClick (e) {
        var button = e.button;
        switch (button.id) {
            case 'startButton':
                if (!stateMap.isGameOn) {
                    return false;
                }
                handleStartButtonClick(button);
                break;
            default:
                toggleButtonStateAndColor(button);
                break;
        }
        return false;
    }

    function handleStartButtonClick(startButton) {
        flashButton(startButton);

        stateMap.score = 0;
        displayScore();

        //clearing then resetting a timeout to prevent multiple games from being fired off if the user clicks the start button repeatedly
        if (startGameTimeoutId) {
            clearTimeout(startGameTimeoutId);
        }
        startGameTimeoutId = setTimeout(function () {
            playGame();
        }, 500);
    }
    //----------------------- END EVENT HANDLERS -----------------------
    function flashButton (button) {
        var flashCount = 10,
            flashDuration = 200;

        simon.buttons.setButtonColor(button, true);

        setTimeout(flasher, flashDuration);

        function flasher() {
            simon.buttons.setButtonColor(button, flashCount % 2);
            flashCount--;

            if (flashCount && stateMap.isGameOn) {
                setTimeout(flasher, flashDuration);
            } else {
                simon.buttons.setButtonColor(button, false);
            }
        }
    }

    function generateGameSequence() {
        var i;
        
        stateMap.gameSequenceOfTones = [];

        for ( i = 1 ; i <= configMap.numberOfPlays; i++ ) {
            stateMap.gameSequenceOfTones.push(i % 4);
        }

        shuffleSequence();

        function shuffleSequence() {
            stateMap.gameSequenceOfTones.sort(function (a, b) {
                return 0.5 - Math.random();
            });
        }
    }

    function init() {
        $(window).load(function () {
            initializeJqueryMap();
            simon.sound.init();
            simon.buttons.init(jqueryMap.gameImage);
            setEventHandlers();
        })
    };

    function initializeJqueryMap() {
        var gameImage = jqueryMap.gameImage = $(document.getElementById('gameImage').contentDocument);

        jqueryMap.scoreDisplay = $(gameImage).find('#scoreDisplay');
    }
    
    function pause (millisecondsToPause) {
        return new Promise (function (resolve, reject) {
            var begin = new Date();
            pauser();
            function pauser () {
                if (new Date() - begin < millisecondsToPause) {
                    setTimeout(function () {
                        pauser();
                    }, 100);
                } else {
                    resolve();
                }
            }
        });
    }

    function playFailSound () {
        simon.sound.play('fail', 500);
    }

    function playGame() {
        //when game is first started, both isGameStarted and isGameRestarted are false after exection of this line (stateMap.isGameRestarted = stateMap.isGameStarted;)
        stateMap.isGameRestarted = stateMap.isGameStarted;

        //now setting isGameStarted to true and will remain always true unless user hits a bad tone in strict mode or turns off game
        // assuming user doesn't hit bad tone in strict mode and doesn't turn game off but DOES hit the start button, then isGameRestarted will be 
        // set to isGameStarted which is TRUE. This is the ONLY way isGameRestarted is set to true.
        // In this case, it is set to true only until the existing _wasPlayerTurnValid resolves
        stateMap.isGameStarted = true;

        stateMap.userPlayValid = true;

        //statMap.playNumber = 0 because we are starting a game. Also, if user hits start in the midst of a game while an exiting sequence is being played,
        // the fact that playNumber is reset to 0 will call the promise in playSequence in immediately resolve because the currentTone will suddenly be >
        // than the play number. See playTonesInSequence function nested within playSequence function
        stateMap.playNumber = 0;

        stateMap.userSequence = [];
        generateGameSequence();
        stateMap.whoseTurn = COMPUTERS_TURN;

        //stateMap.playSequencePromises.forEach(function (promise) {
        //    promise._reject('game restarted');
        //})

        pause(400)
        .then(function () {
            stateMap.currentPlayerTone = -1;
            playSequenceAndWaitForUser();
        });

        function playSequenceAndWaitForUser() {
            displayScore();
            var playSequencePromises = playSequence()
            .then(function () {
                stateMap.whoseTurn = PLAYERS_TURN;
                return wasPlayerTurnValid()
            })
            .then(function (_wasPlayerTurnValid) {
                console.log('stateMap.isGameRestarted', stateMap.isGameRestarted);
                if (stateMap.isGameRestarted) {
                    stateMap.isGameRestarted = false;
                    stateMap.score = 0;
                    console.log('GAME RESTARTED!!!!!!!!');
                    return;
                }
                if (!_wasPlayerTurnValid) {
                    //_wasPlayerTurnValid invalid either means user hit the wrong tone OR player turned the game off
                    if (stateMap.isStrictMode || !stateMap.isGameOn) {
                        stateMap.isGameStarted = false;
                        stateMap.score = 0;
                        return;
                    } else {
                        resetPlayScoreAndValidStateNonStrictMode();
                        stateMap.whoseTurn = COMPUTERS_TURN; //player failed so computers turn
                    }
                }
                stateMap.score++;
                console.log('score', stateMap.score);
                stateMap.playNumber++;
                stateMap.userSequence = [];
                stateMap.currentPlayerTone = -1;
                if (stateMap.playNumber <= configMap.numberOfPlays) {
                    playSequenceAndWaitForUser();
                }
            });
            //stateMap.playSequencePromises.push(playSequencePromises);
        }
        function resetPlayScoreAndValidStateNonStrictMode() {
            stateMap.playNumber--;
            stateMap.score--;
            stateMap.userPlayValid = true; //user chose the wrong button but still valid in non-strict mode
        }
    }

    // playSequence
    // Plays the current sequence of tones 
    function playSequence() {
        var currentTone = 0;

        return pause(1000)
               .then(function () {
                   return playTonesInSequence();
                });                

        function playTonesInSequence () {
            //currentToneNumber is a number from 0 to 3. This represents which of the 4 tones corresponding to the 4 color buttons to play for the current
            // tone in the sequence
            var currentToneNumber = stateMap.gameSequenceOfTones[currentTone],
                promise = 
                    simon.buttons.setButtonColor(currentToneNumber, true)
                    .then(function () {
                        return simon.sound.play(stateMap.gameSequenceOfTones[currentTone], 750);
                    })
                    .then(function () {
                        return simon.buttons.setButtonColor(currentToneNumber, false)
                    })
                    .then(function () {
                        //if currently playing tones in sequence and user hits start button, stateMap.playNumber will be set to 0
                        // meaning the next line will be false because currentTone will NOT be < 0 (stateMap.playNumber set to 0 when start button was hit)
                        // this is why the sequence stops when you hit the start button
                        if (++currentTone <= stateMap.playNumber && stateMap.isGameOn) {
                            //console.log('NEXT TONE NEXT TONE currentTone++ = ', currentTone + 1, 'stateMap.playNumber', stateMap.playNumber);
                            return new Promise(function (resolve, reject) {
                                setTimeout(function () {
                                    playTonesInSequence().
                                    then(function () {
                                        resolve();    
                                    })
                                }, 150);
                            });
                        } else {
                            return Promise.resolve();
                        }
                    });

            return promise;
        }
    }

    function setButtonColor (button, isButtonOn) {
        simon.buttons.setButtonColor(button, isButtonOn);
        return Promise.resolve();
    }

    function setButtonStateAndColor (button, isButtonOn) {
        var stateMapProperty = button.id === 'strictButton' ? 'isStrictMode' 
            : button.id === 'onOffButton' ? 'isGameOn' : null;

        if (stateMapProperty) {
            stateMap[stateMapProperty] = isButtonOn;
        }

        setButtonColor(button, isButtonOn);
    }

    function setEventHandlers() {

        $(simon.buttons).on('mousedown', function (e) {
            handleGameButtonMouseDown(e);
        });

        $(simon.buttons).on('touchstart', function (e) {
            if (e.buttonNumber <= 3 ) {
                //if button number <= 3, this is a color button
                handleGameButtonMouseDown(e);
            } else {
                //if button number > 3, this is a control button
                handleControlButtonClick(e);
            }
        });
        $(simon.buttons).on('touchend', function (e) {
            handleGameButtonMouseUp(e);
        });
        $(simon.buttons).on('mouseup', function (e) {
            handleGameButtonMouseUp(e);
        });
        $(simon.buttons).on('mouseenter', function (e) {
            handleButtonMouseOver(e);
        });
        $(simon.buttons).on('mouseleave', function (e) {
            handleButtonMouseOut(e);
        });

        $(simon.buttons).on('click', function (e) {
            handleControlButtonClick(e);
        });
    }

    function toggleButtonStateAndColor(button) {
        //TODO: too much button complexity here - separate button module with clean API
        var isOnOffButton = button.id === 'onOffButton',
            isButtonOn = isOnOffButton ? stateMap.isGameOn : stateMap.isStrictMode,
            isButtonGoingOff = isButtonOn,
            isGameOffAndPlayerPressedRestartOrStrict = !stateMap.isGameOn && !isOnOffButton;

        if (isGameOffAndPlayerPressedRestartOrStrict) {
            return false;
        }

        setButtonStateAndColor(button, !isButtonOn);

        if (isOnOffButton && isButtonGoingOff) {
            setButtonStateAndColor(simon.buttons.getButton('strictButton'), false);
            stateMap.score = '';
            //stateMap.isGameStarted = false; not required since 
            displayScore();
        }
    }

    function verifyUserPlay () {
        var currentPlayerTone = stateMap.currentPlayerTone;
        return stateMap.userSequence[currentPlayerTone] === stateMap.gameSequenceOfTones[currentPlayerTone];
    }

    function wasPlayerTurnValid () {
        // wasPlayerTurnValid 
        // returns a promise that resolves when the user has finished his turn or after user turn has timed out
        var _wasPlayerTurnValid;
        return new Promise(function (resolve, reject) {
            
            checkIfComputersTurnAndGameOn();

            function checkIfComputersTurnAndGameOn () {
                //at this point in code, whoseTurn = COMPUTERS_TURN if and only if user played all tones correctly in the current sequence 
                // in this case, whoseTurn would have been set to computer in handleGameButtonMouseUp
                if (stateMap.whoseTurn === COMPUTERS_TURN) {
                    resolve(_wasPlayerTurnValid = true);
                } else if (!stateMap.userPlayValid || !stateMap.isGameOn) {
                    //if player turned of the game, resolve _wasPlayerTurnValid = false, this will effectively stop the game play in function playGame
                    resolve(_wasPlayerTurnValid = false);
                } else {
                    setTimeout(function () {
                        checkIfComputersTurnAndGameOn();
                    }, 200);
                }
            }
        });
    }

    return {
        init: init
    };
}());

simon.game.init();