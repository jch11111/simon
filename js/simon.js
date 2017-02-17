/*
* simon.js
* Shell module
*/

var simon = (function () {
    "use strict";

    //----------------------- BEGIN MODULE SCOPE VARIABLES -----------------------
    var
        configMap = {
            buttonColorsLigtht  : new Map(),
            buttonColorsDark    : new Map(),
            buttonSounds        : new Map(),
            numberOfPlays       : 20
        },
        jqueryMap = {
            gameButtons     : new Map(),
            controlButtons  : new Map(),
            scoreDisplay    : null
        },
        stateMap = {
            isStrictMode    : false,
            isGameOn        : false,
            isGameStarted   : false,
            score           : 0,
            buttonSequence  : []
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
        if (!stateMap.isGameOn || stateMap.isGameStarted) {
            return false;
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

    function generateButtonSequence() {
        var i;
        
        stateMap.buttonSequence = [];

        for ( i = 1 ; i <= configMap.numberOfPlays; i++ ) {
            stateMap.buttonSequence.push(i % 4);
        }

        shuffleSequence();

        function shuffleSequence() {
            stateMap.buttonSequence.sort(function (a, b) {
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
        jqueryMap.gameButtons.forEach(function ($button, buttonId) {
            var buttonSound = document.createElement('audio');
            buttonSound.setAttribute('src', 'media/sound_' + buttonId + '.mp3');
            configMap.buttonSounds.set(buttonId, buttonSound);
        });
    }

    function playSequence(playNumber) {
        var currentTone,
            buttonSounds = [
                configMap.buttonSounds.get('colorButton0'),
                configMap.buttonSounds.get('colorButton1'),
                configMap.buttonSounds.get('colorButton2'),
                configMap.buttonSounds.get('colorButton3')
            ];

        for ( currentTone = 0; currentTone <= playNumber; currentTone++ ) {
            playSound(buttonSounds[stateMap.buttonSequence[currentTone]], 500);
        }

    }

    function playSound(buttonSound, durationMs) {
        buttonSound.currentTime = 0;
        buttonSound.play();

        if (durationMs) {
            setTimeout ( function () {
                buttonSound.pause();
            }, durationMs);
        }
    }

    function setStateAndButtonColor ($button, isButtonOn) {
        var stateMapProperty = $button.id === 'strictButton' ? 'isStrictMode' 
            : $button.id === 'onOffButton' ? 'isGameOn' : null,
            colorMap = isButtonOn ? configMap.buttonColorsLigtht : configMap.buttonColorsDark;

        if (stateMapProperty) {
            stateMap[stateMapProperty] = isButtonOn;
        }

        $($button).css('fill', colorMap.get($button.id));
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
        var playNumber;
        generateButtonSequence();

        for (playNumber = 0; playNumber < configMap.numberOfPlays; playNumber++) {
            playSequence(playNumber);
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

    return {
        init: init
    };
}());

simon.init();