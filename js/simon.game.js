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
            numberOfPlays       : null,   //set in init method

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
            toneDurationMilliseconds: 700
        },
        jqueryMap = {
            gameImage       : null,     //gameImage is the svg image of the game
            scoreDisplay    : null      //scoreDisplay is the UI element within the svg gameImage for displaying the score
        },

        // stateMap - current state of the game
        stateMap = {

            //gameSequenceOfTones is an array of 20 integers from 0 - 4 corrsponding to all the tones that will be played in the game
            //The length of the array (20) is controlled by configMap.numberOfPlays. numberOfPlays variable is set in init function
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
            dontAllowStartBeforeTime    : new Date(),

            hasInitializedSounds        : false
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
        if (!stateMap.isGameOn || stateMap.whoseTurn === COMPUTERS_TURN) {
            return false;
        }

        if (!stateMap.userPlayValid) {
            //this code is executed if and only if game is in strict mode and user played an incorrect tone, and then, after playing an incorrect tone, player hit another button.
            //this will result in all color tone buttons making the fail sound after user has played one incorrect note in strict mode
            playFailSound();
            return false;
        }

        if (stateMap.whoseTurn === PLAYERS_TURN) {
            //if currently users turn, add the pressed button to userSequenceOfTones and verify whether the tone was correct
            stateMap.userSequenceOfTones.push(configMap.buttonIdToNumberMap[button.id]);
            stateMap.currentPlayerToneNumber++;
            if (!verifyUserPlayedCorrectTone()) {
                //if tone was NOT correct, set userPlayValid state to false, play the fail sound and exit
                stateMap.userPlayValid = false;
                playFailSound();
                return false;
            }
        }

        //if you've made it this far, the player is playing the correct note
        //turn on the light for the button and begin playing the sound
        //the light will stay on and the sound will play until the mouse up event
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
        //make button dark and stop tone sound since the player has released the button
        simon.buttons.setButtonColor(button, false);
        simon.sound.pause(button.id);

        if (userPlayedSequenceSuccessfully()) {
            stateMap.whoseTurn = COMPUTERS_TURN;
        }
        return false;

        function userPlayedSequenceSuccessfully() {
            return stateMap.userPlayValid && stateMap.currentPlayerToneNumber === numberOfTonesForUserToPlay;
        }
    }

    //handleControlButtonClick handles click of on/off, start, and strict buttons
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
                //for on/off or strict mode, toggle the button color and button state via toggleButtonStateAndColor
                toggleButtonStateAndColor(button);
                break;
        }
        return false;
    }

    function handleStartButtonClick(startButton) {
        //Don't allow restarting within 2.5 seconds to prevent race condition 
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
        //flashButton flashes the start button on and off to indicate game is starting or restarting
        flashButton(startButton);

        //set score to 0 and display, then start the game
        stateMap.score = 0;
        displayScore();
        playGame();
    }
    //----------------------- END EVENT HANDLERS -----------------------

    //----------------------- BEGIN PRIVATE FUNCTIONS -----------------------

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

    //flash button on and off for a short interval
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

    //generateGameSequence generates a game sequence which is an array of random integers between 0 and 3
    //these will be the tones that the game will play
    //when the game first starts, the computer will play the tone represented by the number in position 0 in the array
    //if the user gets this correct, then the computer will play 2 tones represented by the numbers in position 0 and 1 in the array, and so on.
    function generateGameSequence() {
        var i;
        
        stateMap.gameSequenceOfTones = [];

        for ( i = 1 ; i <= configMap.numberOfPlays; i++ ) {
            stateMap.gameSequenceOfTones.push(Math.floor(Math.random() * 4));
        }

        shuffleSequence();
        console.log(stateMap.gameSequenceOfTones);

        function shuffleSequence() {
            stateMap.gameSequenceOfTones.sort(function (a, b) {
                return 0.5 - Math.random();
            });
        }
    }

    function initializeJqueryMap() {
        var gameImage = jqueryMap.gameImage = $(document.getElementById('gameImage').contentDocument);

        jqueryMap.scoreDisplay = $(gameImage).find('#scoreDisplay');
    }
    
    //returns a promise that resolves after millisecondsToPause
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

    //playAllTonesFast simply plays all of the tones quickly. This is used to initialize the sounds. On mobile, tones will sometimes not play until second time.
    function playAllTonesFast (numberOfTones) {
        if (stateMap.hasInitializedSounds) {
            return;
        }
        stateMap.hasInitializedSounds = true;
        var toneNumber = -1;
        return playWinLoop();

        function playWinLoop() {
            return playToneAndLightButton(++toneNumber % 4, 100)
                .then(function () {
                    if (toneNumber <= numberOfTones) {
                        return new Promise(function (resolve, reject) {
                            playWinLoop()
                            .then(function () {
                                resolve();
                            });
                        });
                    } else {
                        playFailSound(20);
                        return Promise.resolve();
                    }
                });
        }
    }

    function playFailSound (durationMilliseconds) {
        simon.sound.play('fail', durationMilliseconds || 500);
    }

    function playGame() {
        //now setting isGameStarted to true and will remain always true unless user hits a bad tone in strict mode or turns off game
        stateMap.isGameStarted = true;

        //userPlayValid is true if player correctly played notes in the sequence
        stateMap.userPlayValid = true;

        //userSequenceOfTones will contain the tones the user plays as she tries to correcly play the sequence
        stateMap.userSequenceOfTones = [];
        //generate the 20 random tones that will be the sequence for this game
        generateGameSequence();
        stateMap.whoseTurn = COMPUTERS_TURN;

        //gameLoopCount prevents mutliple game loops from happening at the same time if the player hits start button repeatedly
        stateMap.gameLoopCount++;

        areExistingGameLoopsFinished()
        .then(function () {
            return pause(400);
        })
        .then(function () {
            playAllTonesFast(3);
        })
        .then(function () {
            //currentPlayerToneNumber is a counter that keeps track of the tones player plays during each turn
            stateMap.currentPlayerToneNumber = -1;
            //playNumber is a counter that tracks the current play. There are 20 tones in the sequence, and, unless the user fails, there will be 20 plays in the game
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
        //          * game is restarted by player hitting the start button
        //          * player turns off the game by pressing on off button
        //          * player hit an incorrect tone in the sequence and game is in strict mode (strict button is on)
        // Arguments    : none
        // Returns      : Relies on promises but does not return a promise
        // Triggers     : none
        // Throws       : none
        // Promises     : 
        //      playGameLoop relies on the following promises
        //          * playToneSequence returns a promise and  relies on following promises:
        //              * pause                                                                     +++ reolves after 1 second pause
        //              * playToneSequenceLoop returns a promise and relies on following promises
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
                if (stateMap.playNumber < configMap.numberOfPlays && 1 === stateMap.gameLoopCount) {
                    //there are more plays in this game (or user has restarted the game which would result in stateMap.gameLoopCount > 1
                    playGameLoop();
                } else if (stateMap.playNumber === configMap.numberOfPlays) {
                    //end of game - play a celebration
                    playWinCelebration();
                } else {
                    stateMap.gameLoopCount--;
                }
            });
        }
    }

    //play a single tone, and light the button while playing
    //toneNumber is a number from 0 to 3. This represents which of the 4 tones corresponding to the 4 color buttons to play
    function playToneAndLightButton(toneNumber, toneDurationMilliseconds) {
        return simon.buttons.setButtonColor(toneNumber, true)
            .then(function () {
                return simon.sound.play(toneNumber, toneDurationMilliseconds);
            })
            .then(function () {
                return simon.buttons.setButtonColor(toneNumber, false)
            })
    }

    // playToneSequence
    // Plays the current sequence of tones 
    function playToneSequence() {
        //currentPositionSequence is number from 0 to 20 indicatiing which tone in the sequence of 20 tones is being played
        var currentPositionSequence = 0;

        return pause(1000)
               .then(function () {
                   return playToneSequenceLoop();
                });                

        //playToneSequenceLoop recursively calls itself until all the tones in the current sequence are played
        function playToneSequenceLoop() {
            //currentToneNumber is a number from 0 to 3. This represents which of the 4 tones corresponding to the 4 color buttons to play for the current
            var currentToneNumber = stateMap.gameSequenceOfTones[currentPositionSequence],
                promise = 
                    playToneAndLightButton(currentToneNumber, configMap.toneDurationMilliseconds)
                    .then(function () {
                        //if currently playing tones in sequence and user hits start button, stateMap.gameLoopCount will increment to 2
                        // meaning the next line will be false.
                        // this is why the sequence stops when you hit the start button
                        if (++currentPositionSequence <= stateMap.playNumber && stateMap.isGameOn && 1 === stateMap.gameLoopCount) {
                            return new Promise(function (resolve, reject) {
                                setTimeout(function () {
                                    playToneSequenceLoop(currentPositionSequence).
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

    //player finished the game so play celebration
    function playWinCelebration () {
        displayScore(stateMap.score = ':)');  //display smily score
        stateMap.gameLoopCount = 0;

        Promise.all([
            playToneAndLightButton(3, 700),
            playToneAndLightButton(0, 700)])
        .then(function () {
            return Promise.all([
                playToneAndLightButton(1, 700),
                playToneAndLightButton(2, 700)])
        })
        .then(function () {
            return Promise.all([
                playToneAndLightButton(2, 700),
                playToneAndLightButton(3, 700)])
        })
        .then(function () {
            return Promise.all([
                playToneAndLightButton(0, 700),
                playToneAndLightButton(1, 700)])
        })
        .then(function () {
            return Promise.all([
                playToneAndLightButton(1, 700),
                playToneAndLightButton(3, 700)])
        })
        .then(function () {
            return Promise.all([
                playToneAndLightButton(2, 700),
                playToneAndLightButton(0, 700)])
        })
        .then(function () {
            playToneAndLightButton(0, 2000);
            playToneAndLightButton(1, 2000);
            playToneAndLightButton(2, 2000);
            playToneAndLightButton(3, 2000);
        });
    }

    //set the color of the a button and the state associated with the button
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

    //toggleButtonStateAndColor toggles the color and state for on/off and strict buttons only
    function toggleButtonStateAndColor(button) {
        var isOnOffButton = button.id === 'onOffButton',
            isButtonOn = isOnOffButton ? stateMap.isGameOn : stateMap.isStrictMode,
            isButtonGoingOff = isButtonOn,
            isGameOffAndPlayerPressedRestartOrStrict = !stateMap.isGameOn && !isOnOffButton;

        if (isGameOffAndPlayerPressedRestartOrStrict) {
            return false;
        }

        setButtonStateAndColor(button, !isButtonOn);

        //player turned off the game so shut down 
        if (isOnOffButton && isButtonGoingOff) {
            setButtonStateAndColor(simon.buttons.getButton('strictButton'), false);
            stateMap.gameLoopCount = 0;
            displayScore(stateMap.score = '');  //display empty string as score 
        }
    }

    function verifyUserPlayedCorrectTone () {
        var currentPlayerToneNumber = stateMap.currentPlayerToneNumber;
        return stateMap.userSequenceOfTones[currentPlayerToneNumber] === stateMap.gameSequenceOfTones[currentPlayerToneNumber];
    }

    // returns a promise that resolves when the player has finished her turn.
    // function continually checks to see if player finished her turn
    function wasPlayerTurnValid () {

        var _wasPlayerTurnValid;
        return new Promise(function (resolve, reject) {
            
            checkIfComputersTurnAndGameOn();

            function checkIfComputersTurnAndGameOn () {
                //at this point in code, whoseTurn = COMPUTERS_TURN if and only if user played all tones correctly in the current sequence 
                // in this case, whoseTurn would have been set to computer in handleGameButtonMouseUp
                if (stateMap.whoseTurn === COMPUTERS_TURN || stateMap.gameLoopCount > 1) {
                    resolve(_wasPlayerTurnValid = true);
                } else if (!stateMap.userPlayValid || !stateMap.isGameOn) {
                    //if player turned off the game, resolve _wasPlayerTurnValid = false, this will effectively stop the game play in function playGame
                    resolve(_wasPlayerTurnValid = false);
                } else {
                    setTimeout(function () {
                        checkIfComputersTurnAndGameOn();
                    }, 200);
                }
            }
        });
    }
    //----------------------- END PRIVATE FUNCTIONS -----------------------

    //----------------------- BEGIN PUBLIC FUNCTIONS -----------------------
    function init() {
        $(window).load(function () {
            initializeJqueryMap();
            simon.sound.init();
            simon.buttons.init(jqueryMap.gameImage);
            setEventHandlers();
            configMap.numberOfPlays = location.hash === '#short' ? 5 : 20;  //#short hash in url for short game
            location.hash !== '#easy'
        })
    };
    //----------------------- END PUBLIC FUNCTIONS -----------------------

    //----------------------- RETURN PUBLIC API -----------------------
    return {
        init: init
    };
}());

simon.game.init();
