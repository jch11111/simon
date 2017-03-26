/*
* simon.game.js
* game play module
*/


/*
when restarting game, need a way to force all promises within playGameLoop to resolve/reject as well as making sure 
// playGameLoop doesn't call itself again (if (stateMap.playNumber <= configMap.numberOfPlays) {)
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

            //gameSequenceOfTones is an array of 20 integers from 0 - 4 corrsponding to all the tones that will be played in the game
            //The length of the array (20) is controlled by configMap.numberOfPlays
            //userSequenceOfTones is compared to gameSequenceOfTones to determine if the user played all the notes correctly

            gameSequenceOfTones                : [],
            //userSequenceOfTones is an array of integers from 0 - 4 corrsponding to the the tones the user played in her attempt to correctly play the current sequence
            //userSequenceOfTones is compared to gameSequenceOfTones to determine if the user played all the notes correctly
            userSequenceOfTones: [],
            
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

            // whoseTurn Is either COMPUTERS_TURN or PLAYERS_TURN. This will be COMPUTERS_TURN when:
            //* Game started or restarted (playgame function)
            //* User has successfully played all tones in the current sequence (handleGameButtonMouseUp function)
            //* User played an incorrect tone in the sequence in non strict mode (playGame function)
            whoseTurn                   : null,
            userPlayValid               : true,
            currentPlayerTone           : null,
            isGameRestarted             : false
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
            stateMap.userSequenceOfTones.push(configMap.buttonIdToNumberMap[button.id]);
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
        // the fact that playNumber is reset to 0 will call the promise in playToneSequence in immediately resolve because the currentTone will suddenly be >
        // than the play number. See playToneSequenceLoops function nested within playToneSequence function
        stateMap.playNumber = 0;

        stateMap.userSequenceOfTones = [];
        generateGameSequence();
        stateMap.whoseTurn = COMPUTERS_TURN;

        pause(400)
        .then(function () {
            stateMap.currentPlayerTone = -1;
            playGameLoop();
        });

        // Begin private function / playGameLoop /
        // Purpose : 
        //      Controls the game play as follows:
        //      The is a recursive (looping) function. Each loop (recursive call) does the following:
        //          * displays the current score
        //          * plays all the tones in the current tone sequence (game starts with a single tone. If user gets that right, game adds a second tone, and so on)
        //          * waits for the player to finishe her attempt to play the current tone sequence
        //          * if player played the current tone sequence correctly, then repeat this loop
        //          * if user did not play the current tone sequence correctly, take the appropriate action based on game state
        //          * at the end of the loop:
        //              **increment the score
        //              **increment play number
        //              **reset userSequenceOfTones - the array of tones the user played for the current turn. This is reset to an empty array for each turn and repopulated as the user
        //                  plays the tones for the turn
        //              **sets currentPlayerTone to -1. currentPlayerTone keeps track of which tone in the sequence the user is playing as she attempts to play all the tones in the current tone sequence
        //      The loop will continue until one of the following is true
        //          * game is restarted by player hitting the start button - NOT WORKING NOT WORKING NOT WORKING NOT WORKING 
        //          * player turns off the game by pressing on off button
        //          * player hit an incorrect tone in the sequence and game is in strict mode (strict button is on)
        // Arguments    : none
        // Returns      : 
        // Triggers     : none
        // Throws       : none
        // Promises     : 
        //      Function relise on the following promises
        //          * playToneSequence - function relying on the following promises:
        //              * pause                                                                     +++ reolves after 1 second pause
        //              * playToneSequenceLoops - function relying on the following promises
        //              
        function playGameLoop() {
            displayScore();  //synchronous

            playToneSequence()
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
                        //restart the game if user played incorrect tone in strict mode, or the game was turned off
                        stateMap.isGameStarted = false;
                        stateMap.score = 0;
                        return;
                    } else {
                        //player played the wrong turn in non-strict mode, reset the play number and score, reset userPlayValid to true, and
                        //set to computer's turn so the computer will replay the tone sequence so the user can try again
                        stateMap.playNumber--;
                        stateMap.score--;
                        stateMap.userPlayValid = true;
                        stateMap.whoseTurn = COMPUTERS_TURN;
                    }
                }
                stateMap.score++;
                console.log('score', stateMap.score);
                stateMap.playNumber++;
                stateMap.userSequenceOfTones = [];
                stateMap.currentPlayerTone = -1;
                if (stateMap.playNumber <= configMap.numberOfPlays) {
                    console.log('recursively calling playGameLoop')
                    playGameLoop();
                }
            });
        }
    }

    // playToneSequence
    // Plays the current sequence of tones 
    function playToneSequence() {
        var currentTone = 0;

        return pause(1000)
               .then(function () {
                   return playToneSequenceLoops();
                });                

        function playToneSequenceLoops () {
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
                                    playToneSequenceLoops().
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

    function setButtonStateAndColor (button, isButtonOn) {
        var stateMapProperty = button.id === 'strictButton' ? 'isStrictMode' 
            : button.id === 'onOffButton' ? 'isGameOn' : null;

        if (stateMapProperty) {
            stateMap[stateMapProperty] = isButtonOn;
        }

        simon.buttons.setButtonColor(button, isButtonOn);
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
        return stateMap.userSequenceOfTones[currentPlayerTone] === stateMap.gameSequenceOfTones[currentPlayerTone];
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