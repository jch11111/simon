/*
* simon.game.js
* game play module
*/


/*
turning off the game should kill the sequence if being played
restart should kill sequence being played
add Map to anything that is a map
add tests
namespace the javascript and css - simon.game, simon.sound
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
        //      whoseTurn       Is either COMPUTERS_TURN or PLAYERS_TURN. This will be COMPUTERS_TURN when:
        //                          * Game started or restarted (playgame function)
        //                          * User has successfully played all notes in the current sequence (handleGameButtonMouseUp function)
        //                          * User played an incorrect note in the sequence in non strict mode (playGame function)
        //                      
        stateMap = {
            gameSequence                : [],
            isGameOn                    : false,
            isGameStarted               : false,
            isStrictMode                : false,
            playNumber                  : null,
            score                       : 0,
            userSequence                : null,
            whoseTurn                   : null,
            userPlayValid               : true,
            currentPlayerTone           : null,
            isGameRestarted             : false
        };
    //----------------------- END MODULE SCOPE VARIABLES -----------------------
    function displayScore () {
        jqueryMap.scoreDisplay.text(stateMap.score);
        console.log(stateMap.score);
    }

    //----------------------- BEGIN EVENT HANDLERS -----------------------
    function handleButtonMouseOver (e) {
        var button = e.button;
        $(button).css('cursor', 'pointer');
        return false;
    }

    function handleButtonMouseOut(e) {
        var button = e.button;
        $(button).css('cursor', 'default');
        return false;
    }

    function handleGameButtonMouseDown(e) {
        var button = e.button;
        //console.log('gameon', stateMap.isGameOn, 'whoseturn', stateMap.whoseTurn);
        if (!stateMap.isGameOn || stateMap.whoseTurn === COMPUTERS_TURN) {
            return false;
        }

        if (!stateMap.userPlayValid) {
            console.log('playing fail for user', stateMap.whoseTurn);
            playFailSound();
            return;
        }

        if (stateMap.whoseTurn === PLAYERS_TURN) {
            stateMap.userSequence.push(configMap.buttonIdToNumberMap[button.id]);
            stateMap.currentPlayerTone++;
            if (!verifyUserPlay()) {
                console.log('invalid play');
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
            numberOfNotesForUserToPlay = stateMap.playNumber;
            
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
            return stateMap.userPlayValid && stateMap.currentPlayerTone === numberOfNotesForUserToPlay;
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
                toggleButtonAndState(button);
                break;
        }
        return false;
    }

    function handleStartButtonClick(startButton) {
        flashButton(startButton);

        stateMap.score = 0;
        displayScore();
        playGame();
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
        
        stateMap.gameSequence = [];

        for ( i = 1 ; i <= configMap.numberOfPlays; i++ ) {
            stateMap.gameSequence.push(i % 4);
        }

        shuffleSequence();
        console.log(stateMap.gameSequence);

        function shuffleSequence() {
            stateMap.gameSequence.sort(function (a, b) {
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

    // playSequence
    // Plays the current sequence of tones 
    function playSequence() {
        var currentTone = 0;

        return pause(1000)
               .then(function () {
                   return playTonesInSequence();
                });                

        function playTonesInSequence () {
            //currentToneNoteNumber is a number from 0 to 3. This represents which of the 4 notes corresponding to the 4 color buttons to play for the current
            // tone in the sequence
            var currentToneNoteNumber = stateMap.gameSequence[currentTone],
                promise = 
                    simon.buttons.setButtonColor(currentToneNoteNumber, true)
                    .then(function () {
                        return simon.sound.play(stateMap.gameSequence[currentTone], 750);
                    })
                    .then(function () {
                        return simon.buttons.setButtonColor(currentToneNoteNumber, false)
                    })
                    .then(function () {
                        if (++currentTone <= stateMap.playNumber && stateMap.isGameOn) {
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

    function setStateAndButtonColor (button, isButtonOn) {
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

    function playGame () {
        stateMap.isGameRestarted = stateMap.isGameStarted;

        stateMap.userPlayValid = true;
        stateMap.playNumber = 0;
        stateMap.userSequence = [];
        generateGameSequence();
        stateMap.whoseTurn = COMPUTERS_TURN;
        pause(400)
        .then(function () {
            stateMap.currentPlayerTone = -1;
            stateMap.isGameStarted = true;

            playSequenceAndWaitForUser();
        });

        function playSequenceAndWaitForUser () {
            displayScore();
            playSequence()
            .then(function () {
                stateMap.whoseTurn = PLAYERS_TURN;
                return wasPlayerTurnValid()
            })
            .then(function (_wasPlayerTurnValid) {
                if (stateMap.isGameRestarted) {
                    stateMap.isGameRestarted = false;
                    stateMap.score = 0;
                    return;
                }
                if (!_wasPlayerTurnValid) {
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
                stateMap.playNumber++;
                stateMap.userSequence = [];
                stateMap.currentPlayerTone = -1;
                if (stateMap.playNumber <= configMap.numberOfPlays) {
                    playSequenceAndWaitForUser();
                }
            });
        }
        function resetPlayScoreAndValidStateNonStrictMode() {
            stateMap.playNumber--;
            stateMap.score--;
            stateMap.userPlayValid = true; //user chose the wrong button but still valid in non-strict mode
        }
    }

    function toggleButtonAndState(button) {
        //TODO: too much button complexity here - separate button module with clean API
        var isOnOffButton = button.id === 'onOffButton',
            isButtonOn = isOnOffButton ? stateMap.isGameOn : stateMap.isStrictMode,
            isButtonGoingOff = isButtonOn,
            isGameOffAndPlayerPressedRestartOrStrict = !stateMap.isGameOn && !isOnOffButton;

        if (isGameOffAndPlayerPressedRestartOrStrict) {
            return false;
        }

        setStateAndButtonColor(button, !isButtonOn);

        if (isOnOffButton && isButtonGoingOff) {
            setStateAndButtonColor(simon.buttons.getButton('strictButton'), false);
            stateMap.score = '';
            stateMap.isGameStarted = false;
            displayScore();
        }
    }

    function verifyUserPlay () {
        var currentPlayerTone = stateMap.currentPlayerTone;
        return stateMap.userSequence[currentPlayerTone] === stateMap.gameSequence[currentPlayerTone];
    }


    function wasPlayerTurnValid () {
        // wasPlayerTurnValid 
        // returns a promise that resolves when the user has finished his turn or after user turn has timed out
        var _wasPlayerTurnValid;
        return new Promise(function (resolve, reject) {
            
            checkIfComputersTurnAndGameOn();

            function checkIfComputersTurnAndGameOn () {
                //at this point in code, whoseTurn = COMPUTERS_TURN if and only if user played all notes correctly in the current sequence 
                // in this case, whoseTurn would have been set to computer in handleGameButtonMouseUp
                if (stateMap.whoseTurn === COMPUTERS_TURN) {
                    resolve(_wasPlayerTurnValid = true);
                } else if (!stateMap.userPlayValid || !stateMap.isGameOn) {
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