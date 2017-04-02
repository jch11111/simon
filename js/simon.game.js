/*
* simon.game.js
* game play module
*/


/*
play all buttons at beginning for init sound mobile
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
            },
            // toneDuration is how long each tone is played in milliseconds
            toneDurationMillisecond : 700
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
            //player hit the wrong tone in strict mode or the game was turned off (set to false in playGame function)
            isGameStarted               : false,

            //strict mode is enabled when the user presses the srtict button. If strict mode is on, then the game will end if the player makes an error (plays the an incorrect tone). The
            // player will have to restart the game to continue playing.
            // If strict mode is off, and the user plays an incorrect tone, the computer will REPLAY the current sequence of tones, and the player will get another chance.
            isStrictMode                : false,

            //The current play number. When the game begins, playNumber is 0. The computer plays a single tone. If the user gets the tone right, and the playNumber is incremented.
            playNumber                  : null,

            //score is incremented in playGame only
            score                       : 0,

            // whoseTurn Is either COMPUTERS_TURN or PLAYERS_TURN. This will be COMPUTERS_TURN when:
            //* Game started or restarted (playgame function)
            //* User has successfully played all tones in the current sequence (handleGameButtonMouseUp function)
            //* User played an incorrect tone in the sequence in non strict mode (playGame function)
            whoseTurn                   : null,

            //userPlayValid is user played the correct sequece of tones
            userPlayValid               : true,

            //currentPlayerToneNumber keeps track of which tone in the sequence the user is playing as she attempts to play all the tones in the current tone sequence
            currentPlayerToneNumber     : null,

            //each time playGameLoop is called, gameLoopCount is incremented. This value is used to ensure that all active game loops are finished before starting a new game
            //prevents mutliple game loops from running at once.
            gameLoopCount               : 0,

            //dontAllowStartBeforeTime is used to prevent race conditions that can occur if user repeatedly clicks start button
            dontAllowStartBeforeTime    : new Date()
        }
    //----------------------- END MODULE SCOPE VARIABLES -----------------------


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
        if (!stateMap.isGameOn || stateMap.whoseTurn === COMPUTERS_TURN || !stateMap.userPlayValid) {
            return false;
        }

        //record and verify current player tone
        if (stateMap.whoseTurn === PLAYERS_TURN) {
            stateMap.userSequenceOfTones.push(configMap.buttonIdToNumberMap[button.id]);
            stateMap.currentPlayerToneNumber++;
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
        } else {
        }
        return false;

        function userPlayedSequenceSuccessfully() {
            return stateMap.userPlayValid && stateMap.currentPlayerToneNumber === numberOfTonesForUserToPlay;
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
        //Don't allow restarting within 3 seconds to prevent race condition 
        //which could result in stateMap.gameLoopCount being incremented almost 
        //simulataneously by multiple 'threads' resulting in:
        // (1) areExistingGameLoopsFinished never resolves because
        // (2) stateMap.gameLoopCount is higher than the actual number of game loops - for example:
        //      Good scenario 
        //          - Player starts game 
        //          - gameLoopCount = 1. 
        //          - Player clicks start again. 
        //          - gameLoopCount increments to 2
        //          - since gameLoopCount > 1, all promises in existing loop are resolved and gameLoopCount is decremented back to 1 at end of existing loop
        //      Bad scenario 
        //          - Player starts game 
        //          - gameLoopCount = 1. 
        //          - Player clicks start mutlitple times quickly. 
        //          - gameLoopCount increments to 3 or more
        //          - areExistingGameLoopsFinished never resolves because there not actually 3 or more loops. All of the threads incremented  gameLoopCount
        //          - and called areExistingGameLoopsFinished at about the same time
        if (new Date() < stateMap.dontAllowStartBeforeTime) {
            return;
        } else {
            stateMap.dontAllowStartBeforeTime = new Date(+(new Date()) + 2500);
        }
        flashButton(startButton);

        stateMap.score = 0;
        displayScore();


        
        playGame();
    }
    //----------------------- END EVENT HANDLERS -----------------------

    // Begin private function / areExistingGameLoopsFinished /
    // Purpose      : When the game is restarted, execution waits until existing game loop finishes (all promises resolve). This function determines that the current game loop
    //                  if finished by checking the value of stateMap.gameLoopCount, which is:
    //                      *** initially 0
    //                      *** incremented at beginning of playGameLoop 
    //                      *** decremented at the end of playGameLoop when all of playGameLoop promises have resolved
    // Arguments    : none
    // Returns      : A promise that resolves when stateMap.gameLoopCount <= 1
    // Triggers     : none
    // Throws       : none
    function areExistingGameLoopsFinished () {
        return new Promise (function (resolve, reject) {
            var startTime = new Date();

            checkIfExistingGameLoopsFinished();

            function checkIfExistingGameLoopsFinished() {
                //console.log('stateMap.gameLoopCount', stateMap.gameLoopCount);
                if (stateMap.gameLoopCount <= 1) {
                    resolve();
                } else {
                    console.log('not yet gameLoopCount = ', stateMap.gameLoopCount);
                    setTimeout(function () {
                        checkIfExistingGameLoopsFinished();
                    }, 200);
                }
            }
        });
    }


    function displayScore() {
        jqueryMap.scoreDisplay.text(stateMap.score);
    }

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
        //now setting isGameStarted to true and will remain always true unless user hits a bad tone in strict mode or turns off game
        stateMap.isGameStarted = true;

        //userPlayValid is true if player correctly played notes in the sequence
        stateMap.userPlayValid = true;

        stateMap.userSequenceOfTones = [];
        generateGameSequence();
        stateMap.whoseTurn = COMPUTERS_TURN;

        stateMap.gameLoopCount++;

        areExistingGameLoopsFinished()
        .then(function () {
            return pause(400);
        })
        .then(function () {
            stateMap.currentPlayerToneNumber = -1;
            stateMap.playNumber = 0;
            stateMap.score = 0;

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
        //              **sets currentPlayerToneNumber to -1. currentPlayerToneNumber keeps track of which tone in the sequence the user is playing as she attempts to play all the tones in the current tone sequence
        //      The loop will continue until one of the following is true
        //          * game is restarted by player hitting the start button - NOT WORKING NOT WORKING NOT WORKING NOT WORKING 
        //          * player turns off the game by pressing on off button
        //          * player hit an incorrect tone in the sequence and game is in strict mode (strict button is on)
        // Arguments    : none
        // Returns      : Relies on promises but does not return a promise
        // Triggers     : none
        // Throws       : none
        // Promises     : 
        //      playGameLoop relies on the following promises
        //          * playToneSequence - relies on following promises:
        //              * pause                                                                     +++ reolves after 1 second pause
        //              * playToneSequenceLoop - relies on following promises
        //                  * simon.buttons.setButtonColor                                          +++ resolves immediately - synchronous function resolved with Promise.resolve
        //                  * simon.sound.play                                                      +++ resolves after 700 milliseconds which is the duration of the tone 
        //              and then playToneSequenceLoop                                              +++ *CONDITION* - resolves when  current tone is > the current play number OR game was 
        //                                                                                              turned off OR game was restarted
        //          * wasPlayerTurnValid                                                            +++ *CONDITION* resolves with value true when stateMap.whoseTurn === COMPUTERS_TURN (which would 
        //                                                                                              happen if user played all notes correctly (handleGameButtonMouseUp) OR if game restarted
        //                                                                                          +++ *CONDITION* resolves with value false if user played wrong tone or game turned off
        //      when playToneSequence resolves, playGameLoop                                        +++ *CONDITION* resolves when playNumber = 20 (the configured number of turns in the game) OR
        //                                                                                              if game was restarted
        function playGameLoop() {

            displayScore();  //synchronous

            playToneSequence()
            .then(function () {
                stateMap.whoseTurn = PLAYERS_TURN;
                return wasPlayerTurnValid()
            })
            .then(function (_wasPlayerTurnValid) {
                //console.log('_wasPlayerTurnValid', _wasPlayerTurnValid);
                if (!_wasPlayerTurnValid) {
                    //_wasPlayerTurnValid invalid either means user hit the wrong tone OR player turned the game off
                    if (stateMap.isStrictMode || !stateMap.isGameOn) {
                        //restart the game if user played incorrect tone in strict mode, or the game was turned off
                        stateMap.isGameStarted = false;
                        stateMap.score = 0;
                        stateMap.gameLoopCount = 0;
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
                stateMap.playNumber++;
                stateMap.userSequenceOfTones = [];
                stateMap.currentPlayerToneNumber = -1;
                //console.log('borrom of loop - stateMap.gameLoopCount = ', stateMap.gameLoopCount);
                if (stateMap.playNumber < configMap.numberOfPlays && 1 === stateMap.gameLoopCount) {
                    playGameLoop();
                } else {
                    stateMap.gameLoopCount--;
                    console.log('end of game loop - gameLoopCount = ', stateMap.gameLoopCount);
                }
            });
        }
    }

    // playToneSequence
    // Plays the current sequence of tones 
    function playToneSequence() {
        //currentTone is a number from 0 to 3. This represents which of the 4 tones corresponding to the 4 color buttons to play for the current
        var currentTone = 0;

        return pause(1000)
               .then(function () {
                   return playToneSequenceLoop();
                });                

        function playToneSequenceLoop() {
            //this removes the bleep sound
            //if (stateMap.gameLoopCount > 1) {
            //    return Promise.resolve();
            //}
            // tone in the sequence
            var currentToneNumber = stateMap.gameSequenceOfTones[currentTone],
                promise = 
                    simon.buttons.setButtonColor(currentToneNumber, true)
                    .then(function () {
                        return simon.sound.play(stateMap.gameSequenceOfTones[currentTone], configMap.toneDurationMillisecond);
                    })
                    .then(function () {
                        return simon.buttons.setButtonColor(currentToneNumber, false)
                    })
                    .then(function () {
                        //if currently playing tones in sequence and user hits start button, stateMap.gameLoopCount will increment to 2
                        // meaning the next line will be false.
                        // this is why the sequence stops when you hit the start button
                        console.log('++currentTone', currentTone + 1, ', stateMap.playNumber = ', stateMap.playNumber, ', stateMap.gameLoopCount = ', stateMap.gameLoopCount);
                        if (++currentTone <= stateMap.playNumber && stateMap.isGameOn && 1 === stateMap.gameLoopCount) {
                            //console.log('NEXT TONE NEXT TONE currentTone++ = ', currentTone, 'stateMap.playNumber', stateMap.playNumber);
                            return new Promise(function (resolve, reject) {
                                setTimeout(function () {
                                    playToneSequenceLoop(currentTone).
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
            stateMap.gameLoopCount = 0;
            displayScore();
        }
    }

    function verifyUserPlay () {
        var currentPlayerToneNumber = stateMap.currentPlayerToneNumber;
        return stateMap.userSequenceOfTones[currentPlayerToneNumber] === stateMap.gameSequenceOfTones[currentPlayerToneNumber];
    }

    function wasPlayerTurnValid () {
        // wasPlayerTurnValid 
        // returns a promise that resolves when the user has finished his turn. TODO - user turn should timeout
        var _wasPlayerTurnValid;
        return new Promise(function (resolve, reject) {
            
            checkIfComputersTurnAndGameOn();

            function checkIfComputersTurnAndGameOn () {
                //at this point in code, whoseTurn = COMPUTERS_TURN if and only if user played all tones correctly in the current sequence 
                // in this case, whoseTurn would have been set to computer in handleGameButtonMouseUp
                //console.log('stateMap.whoseTurn = ', stateMap.whoseTurn, ', stateMap.gameLoopCount = ', stateMap.gameLoopCount)
                if (stateMap.whoseTurn === COMPUTERS_TURN || stateMap.gameLoopCount > 1) {
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