/*
* simon.game.js
* game play module
*/


/*
turning off the game should kill the sequence if being played
add Map to anything that is a map
buttonColors light and dark should not be in configMap, just move these to buttonMap
add tests
put sounds in separate module and name space the modules
namespace the javascript and css - simon.game, simon.sound
clean up css
add win celebration if user makes it to 20
*/
simon.game = (function () {
    "use strict";

    //----------------------- BEGIN MODULE SCOPE VARIABLES -----------------------
    var
        COMPUTERS_TURN  = { who: 'computer'},
        PLAYERS_TURN    = { who: 'player' },
        configMap = {
            buttonColorsLigtht  : new Map(),
            buttonColorsDark    : new Map(),
            buttonSounds        : new Map(),
            numberOfPlays       : 20,
            buttonIndex         : {
                'colorButton0': 0,
                'colorButton1': 1,
                'colorButton2': 2,
                'colorButton3': 3,
            }
        },
        jqueryMap = {
            gameButtons     : new Map(),
            controlButtons  : new Map(),
            scoreDisplay    : null
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
    function handleButtonMouseOver () {
        var $button = this;
        $($button).css('cursor', 'pointer');
        return false;
    }

    function handleButtonMouseOut() {
        var $button = this;
        $($button).css('cursor', 'default');
        return false;
    }

    function handleGameButtonMouseDown() {
        var $button = this
        console.log('gameon', stateMap.isGameOn, 'whoseturn', stateMap.whoseTurn);
        if (!stateMap.isGameOn || stateMap.whoseTurn === COMPUTERS_TURN) {
            return false;
        }

        if (!stateMap.userPlayValid) {
            console.log('playing fail for user', stateMap.whoseTurn);
            playFailSound();
            return;
        }

        if (stateMap.whoseTurn === PLAYERS_TURN) {
            stateMap.userSequence.push(configMap.buttonIndex[$button.id]);
            stateMap.currentPlayerTone++;
            if (!verifyUserPlay()) {
                console.log('invalid play');
                stateMap.userPlayValid = false;
                playFailSound();
                return false;
            }
        }

        $($button).css('fill', configMap.buttonColorsLigtht.get($button.id));
        playSound(configMap.buttonSounds.get($button.id));
        return false;
    }

    function handleGameButtonMouseUp() {
        var $button = this,
            numberOfNotesForUserToPlay = stateMap.playNumber;
            
        if (!stateMap.isGameOn || stateMap.whoseTurn === COMPUTERS_TURN) {
            return false;
        }
        $($button).css('fill', configMap.buttonColorsDark.get($button.id));
        configMap.buttonSounds.get($button.id).pause();

        if (userPlayedSequenceSuccessfully()) {
            stateMap.whoseTurn = COMPUTERS_TURN;
        }
        return false;

        function userPlayedSequenceSuccessfully() {
            return stateMap.userPlayValid && stateMap.currentPlayerTone === numberOfNotesForUserToPlay;
        }
    }

    function handleControlButtonClick () {
        var $button = this;
        switch ($button.id) {
            case 'startButton':
                if (!stateMap.isGameOn) {
                    return false;
                }
                handleStartButtonClick($button);
                break;
            default:
                toggleButtonAndState($button);
                break;
        }
        return false;
    }

    function handleStartButtonClick($startButton) {
        flashButton($startButton);

        stateMap.score = 0;
        displayScore();
        playGame();
    }
    //----------------------- END EVENT HANDLERS -----------------------
    function flashButton ($button) {
        var buttonColorDark = configMap.buttonColorsDark.get($button.id),
            buttonColorBright = configMap.buttonColorsLigtht.get($button.id),
            flashCount = 10,
            flashDuration = 200;

        $($button).css('fill', buttonColorBright);

        setTimeout(flasher, flashDuration);

        function flasher() {
            var buttonColor = flashCount % 2 ? buttonColorBright : buttonColorDark;
            $($button).css('fill', buttonColor);
            flashCount--;

            if (flashCount && stateMap.isGameOn) {
                setTimeout(flasher, flashDuration);
            } else {
                $($button).css('fill', buttonColorDark);
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
            initializeConfigMap();
            initializeSounds();
            setEventHandlers();
        })
    };

    function initializeConfigMap () {
        configMap.buttonColorsLigtht.set('colorButton0','#FFAAAA');
        configMap.buttonColorsLigtht.set('colorButton1','#AAF5FF');
        configMap.buttonColorsLigtht.set('colorButton2','#FFFFAA');
        configMap.buttonColorsLigtht.set('colorButton3','#AAFFAA');
        configMap.buttonColorsLigtht.set('startButton','#9696FF');
        configMap.buttonColorsLigtht.set('strictButton','#44FF44');
        configMap.buttonColorsLigtht.set('onOffButton', '#FF4444');

        configMap.buttonColorsDark.set('colorButton0','#C80000');
        configMap.buttonColorsDark.set('colorButton1','#00A0C8');
        configMap.buttonColorsDark.set('colorButton2', '#C8C800');
        configMap.buttonColorsDark.set('colorButton3','#00C800');
        configMap.buttonColorsDark.set('startButton','#0000A0');
        configMap.buttonColorsDark.set('strictButton','#00A000');
        configMap.buttonColorsDark.set('onOffButton', '#A00000');

    }

    function initializeJqueryMap() {
        var $gameImage = jqueryMap.$gameImage = $(document.getElementById('gameImage').contentDocument);
        jqueryMap.gameButtons.set('colorButton0', $($gameImage).find('#colorButton0'));
        jqueryMap.gameButtons.set('colorButton1', $($gameImage).find('#colorButton1'));
        jqueryMap.gameButtons.set('colorButton2', $($gameImage).find('#colorButton2'));
        jqueryMap.gameButtons.set('colorButton3', $($gameImage).find('#colorButton3'));

        jqueryMap.controlButtons.set('startButton', $($gameImage).find('#startButton'));
        jqueryMap.controlButtons.set('strictButton', $($gameImage).find('#strictButton'));
        jqueryMap.controlButtons.set('onOffButton', $($gameImage).find('#onOffButton'));

        jqueryMap.scoreDisplay = $($gameImage).find('#scoreDisplay');
        //jqueryMap.scoreDisplay.css('text-align', 'left');
    }
    
    function initializeSounds () {
        var buttonSound;
        //loop through the buttons. We will use the id of the button for 2 purposes:
        //  (1) - the id will be part of the filename of the mp3 sound file. For example, for button with id = 'colorButton0', there
        //    will be an mp3 file in location media/sound_colorButton0.mp3
        //  (2) - the id of the button will be the key of the sound in configMap.buttonSound map. For example, for  button with id = 'colorButton0', there
        //    will be a corresponding mp3 sound in configMap.buttonSound map with key = 'colorButton0'
        jqueryMap.gameButtons.forEach(function ($button, buttonId) {
            buttonSound = document.createElement('audio');
            buttonSound.setAttribute('src', 'media/sound_' + buttonId + '.mp3');
            configMap.buttonSounds.set(buttonId, buttonSound);
        });
        buttonSound = document.createElement('audio');
        buttonSound.setAttribute('src', 'media/sound_fail.mp3');
        configMap.buttonSounds.set('fail', buttonSound);
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
        playSound(configMap.buttonSounds.get('fail'), 500);
    }

    // playSequence
    // Plays the current sequence of tones 
    function playSequence() {
        var currentTone = 0,
            // buttonSounds is an array of sounds. The sequence of tones is an array of integers from 0 - 3. By putting the sounds (which are in a map)
            //  into an array, we can easily look up the sound for any tone in the sequence because the tone number (0 - 3) will be the index in 
            //  the array of sounds
            buttonSounds = [
                configMap.buttonSounds.get('colorButton0'),
                configMap.buttonSounds.get('colorButton1'),
                configMap.buttonSounds.get('colorButton2'),
                configMap.buttonSounds.get('colorButton3')
            ],
            // also putting the buttins in the array so we can eaily look up a button. The tone number (0-3) is the index into the array
            buttons = [
                jqueryMap.gameButtons.get('colorButton0')[0],
                jqueryMap.gameButtons.get('colorButton1')[0],
                jqueryMap.gameButtons.get('colorButton2')[0],
                jqueryMap.gameButtons.get('colorButton3')[0]
            ];

        return pause(1000)
               .then(function () {
                   return playCurrentTone();
                });                

        function playCurrentTone () {
            var promise = 
                setButtonColor(buttons[stateMap.gameSequence[currentTone]], true)
                .then(function () {
                    return playSound(buttonSounds[stateMap.gameSequence[currentTone]], 750)
                })
                .then(function () {
                    return setButtonColor(buttons[stateMap.gameSequence[currentTone]], false)
                })
                .then(function () {
                    console.log('currentTone', currentTone, 'playNumber', stateMap.playNumber);
                    if (++currentTone <= stateMap.playNumber) {
                        return new Promise(function (resolve, reject) {
                            setTimeout(function () {
                                playCurrentTone().
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

    function playSound(buttonSound, durationMs) {
        var promise;

        buttonSound.currentTime = 0;
        buttonSound.play(),

        promise = new Promise(function(resolve, reject) {
            if (durationMs) {
                setTimeout(function () {
                    buttonSound.pause();
                    resolve();
                }, durationMs);
            } else {
                resolve();
            }
        });

        return promise;
    }

    function setButtonColor ($button, isButtonOn) {
        var colorMap = isButtonOn ? configMap.buttonColorsLigtht : configMap.buttonColorsDark;
        $($button).css('fill', colorMap.get($button.id));
        return Promise.resolve();
    }

    function setStateAndButtonColor ($button, isButtonOn) {
        var stateMapProperty = $button.id === 'strictButton' ? 'isStrictMode' 
            : $button.id === 'onOffButton' ? 'isGameOn' : null;

        if (stateMapProperty) {
            stateMap[stateMapProperty] = isButtonOn;
        }

        setButtonColor($button, isButtonOn);
    }

    function setEventHandlers() {
        jqueryMap.gameButtons.forEach(function ($button) {
            $button.bind('touchstart mousedown', handleGameButtonMouseDown);
            $button.bind('touchend mouseup', handleGameButtonMouseUp);
            $button.hover(handleButtonMouseOver, handleButtonMouseOut);
        });

        jqueryMap.controlButtons.forEach(function ($button) {
            $button.bind('click touchstart', handleControlButtonClick);
            //$button.bind('touchstart', function () { return false; });
            $button.hover(handleButtonMouseOver, handleButtonMouseOut);
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
                    if (stateMap.isStrictMode) {
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

    function toggleButtonAndState($button) {
        //TODO: too much button complexity here - separate button module with clean API
        var isOnOffButton = $button.id === 'onOffButton',
            isButtonOn = isOnOffButton ? stateMap.isGameOn : stateMap.isStrictMode,
            isButtonGoingOff = isButtonOn;

        if (!stateMap.isGameOn && !isOnOffButton)  {
            return false;
        }

        setStateAndButtonColor($button, !isButtonOn);

        if (isOnOffButton && isButtonGoingOff) {
            setStateAndButtonColor(jqueryMap.controlButtons.get('strictButton')[0], false);
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
            
            checkIfComputersTurn();

            function checkIfComputersTurn () {
                //at this point in code, whoseTurn = COMPUTERS_TURN if and only if user played all notes correctly in the current sequence 
                // in this case, whoseTurn would have been set to computer in handleGameButtonMouseUp
                if (stateMap.whoseTurn === COMPUTERS_TURN) {
                    resolve(_wasPlayerTurnValid = true);
                } else if (!stateMap.userPlayValid) {
                    resolve(_wasPlayerTurnValid = false);
                } else {
                    setTimeout(function () {
                        checkIfComputersTurn();
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