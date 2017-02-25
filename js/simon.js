/*
* simon.js
* Shell module
*/

var simon = (function () {
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
        stateMap = {
            gameSequence    : [],
            isGameOn        : false,
            isGameStarted   : false,
            isStrictMode    : false,
            playNumber      : null,
            score           : 0,
            userSequence    : null,
            whoseTurn       : null,
            userPlayValid   : true,
            currentPlayerTone : null
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
        console.log('handleGameButtonMouseDown');
        var $button = this
        console.log(stateMap.currentPlayerTone);
        console.log(stateMap.whoseTurn);
        if (!stateMap.isGameOn || stateMap.whoseTurn === COMPUTERS_TURN) {
            return false;
        }

        if (stateMap.whoseTurn === PLAYERS_TURN) {
            stateMap.userSequence.push(configMap.buttonIndex[$button.id]);
            stateMap.currentPlayerTone++;
            if (!verifyUserPlay()) {
                console.log('invalid play');
                stateMap.userPlayValid = false;
                playSound(configMap.buttonSounds.get('fail'), 500);
                return false;  //TODO: Play fail sound
            }
        }

        $($button).css('fill', configMap.buttonColorsLigtht.get($button.id));
        playSound(configMap.buttonSounds.get($button.id));
        return false;
    }

    function handleGameButtonMouseUp() {
        var $button = this;
        if (!stateMap.isGameOn) {
            return false;
        }
        $($button).css('fill', configMap.buttonColorsDark.get($button.id));
        configMap.buttonSounds.get($button.id).pause();
        if (stateMap.userPlayValid & stateMap.currentPlayerTone === stateMap.playNumber) {
            stateMap.whoseTurn = COMPUTERS_TURN;
        }
        return false;
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

        stateMap.isGameStarted = true;
        stateMap.score = 0;
        displayScore();
        startGame();
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
    }
    
    function initializeSounds () {
        var buttonSound;
        jqueryMap.gameButtons.forEach(function ($button, buttonId) {
            buttonSound = document.createElement('audio');
            buttonSound.setAttribute('src', 'media/sound_' + buttonId + '.mp3');
            configMap.buttonSounds.set(buttonId, buttonSound);
        });
        buttonSound = document.createElement('audio');
        buttonSound.setAttribute('src', 'media/sound_fail.mp3');
        configMap.buttonSounds.set('fail', buttonSound);
    }

    function playSequence() {
        var currentTone,
            buttonSounds = [
                configMap.buttonSounds.get('colorButton0'),
                configMap.buttonSounds.get('colorButton1'),
                configMap.buttonSounds.get('colorButton2'),
                configMap.buttonSounds.get('colorButton3')
            ],
            buttons = [
                jqueryMap.gameButtons.get('colorButton0')[0],
                jqueryMap.gameButtons.get('colorButton1')[0],
                jqueryMap.gameButtons.get('colorButton2')[0],
                jqueryMap.gameButtons.get('colorButton3')[0]
            ];

        currentTone = 0;
        return playCurrentTone();

        function playCurrentTone () {
            setButtonColor(buttons[stateMap.gameSequence[currentTone]], true);
            var promise = playSound(buttonSounds[stateMap.gameSequence[currentTone]], 750)
            .then(function () {
                setButtonColor(buttons[stateMap.gameSequence[currentTone]], false);
                if (++currentTone <= stateMap.playNumber) {
                    setTimeout(function () {
                        playCurrentTone();
                    }, 150);
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

    function startGame () {
        stateMap.playNumber = 0;
        stateMap.userSequence = [];
        generateGameSequence();
        stateMap.whoseTurn = COMPUTERS_TURN;
        stateMap.currentPlayerTone = -1;

        playSequenceAndWaitForUser();

        function playSequenceAndWaitForUser () {
            playSequence()
            .then(function () {
                stateMap.whoseTurn = PLAYERS_TURN;
                return waitForComputersTurn()
            })
            .then(function () {
                stateMap.playNumber++;
                stateMap.userSequence = [];
                stateMap.currentPlayerTone = -1;
                if (stateMap.playNumber <= configMap.numberOfPlays) {
                    playSequenceAndWaitForUser();
                }
            });
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
        //next: fix this - only works for first play
        var currentPlayerTone = stateMap.currentPlayerTone;

        if (stateMap.userSequence[currentPlayerTone] !== stateMap.gameSequence[currentPlayerTone]) {
            console.log('stateMap.userSequence', stateMap.userSequence);
            console.log('stateMap.gameSequence', stateMap.gameSequence);
            console.log('currentPlayerTone', currentPlayerTone);
        }

        return stateMap.userSequence[currentPlayerTone] === stateMap.gameSequence[currentPlayerTone];
        //stateMap.userSequence.forEach(function (buttonNumber, arrayIndex) {
        //    if (stateMap.gameSequence[arrayIndex] != buttonNumber) {
        //        isUserCorrect = false;
        //    }
        //});

        //return isUserCorrect;
    }


    function waitForComputersTurn () {
        // waitForComputersTurn 
        // returns a promise that resolves when the user has finished his turn or after user turn has timed out
        var promise = new Promise(function (resolve, reject) {
            
            checkIfComputersTurn();

            function checkIfComputersTurn () {
                if (stateMap.whoseTurn === COMPUTERS_TURN) {
                    resolve();
                } else {
                    setTimeout(function () {
                        checkIfComputersTurn();
                    }, 500);
                }
            }
        });

        return promise;

    }

    return {
        init: init
    };
}());

simon.init();