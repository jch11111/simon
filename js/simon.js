/*
* simon.js
* Shell module
*/

var simon = (function () {
    "use strict";

    //----------------------- BEGIN MODULE SCOPE VARIABLES -----------------------
    var
        configMap = {
            buttonColorsLigtht: new Map(),
            buttonColorsDark: new Map(),
            buttonSounds: new Map()
        },
        jqueryMap = {
            gameButtons: new Map(),
            controlButtons: new Map(),
            scoreDisplay: null
        },
        stateMap = {
            isStrictMode: false,
            isGameOn: false,
            score: 0
        };
    //----------------------- END MODULE SCOPE VARIABLES -----------------------
    function displayScore () {
        jqueryMap.scoreDisplay.text(stateMap.score);
        console.log(stateMap.score);
    }

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
        var $button = this;
        if (!stateMap.isGameOn) {
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
            case 'restartButton':
                if (!stateMap.isGameOn) {
                    return false;
                }
                handleRestartButtonClick($button);
                break;
            default:
                toggleMode($button);
                break;
        }
        return false;
    }

    function handleRestartButtonClick($restartButton) {
        var buttonColorDark = configMap.buttonColorsDark.get($restartButton.id),
            buttonColorBright = configMap.buttonColorsLigtht.get($restartButton.id),
            flashCount = 10,
            flashDuration = 200;

        stateMap.score = 0;
        displayScore();

        $($restartButton).css('fill', buttonColorBright);

        setTimeout(flasher, flashDuration);
        
        function flasher() {
            var buttonColor = flashCount % 2 ? buttonColorBright : buttonColorDark;
            $($restartButton).css('fill', buttonColor);
            flashCount--;

            if (flashCount && stateMap.isGameOn) {
                setTimeout(flasher, flashDuration);
            } else {
                $($restartButton).css('fill', buttonColorDark);
            }
        }
        return false;
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
        configMap.buttonColorsLigtht.set('restartButton','#9696FF');
        configMap.buttonColorsLigtht.set('strictButton','#44FF44');
        configMap.buttonColorsLigtht.set('onOffButton', '#FF4444');

        configMap.buttonColorsDark.set('colorButton0','#C80000');
        configMap.buttonColorsDark.set('colorButton1','#00A0C8');
        configMap.buttonColorsDark.set('colorButton2', '#C8C800');
        configMap.buttonColorsDark.set('colorButton3','#00C800');
        configMap.buttonColorsDark.set('restartButton','#0000A0');
        configMap.buttonColorsDark.set('strictButton','#00A000');
        configMap.buttonColorsDark.set('onOffButton', '#A00000');

    }

    function initializeJqueryMap() {
        var $gameImage = jqueryMap.$gameImage = $(document.getElementById('gameImage').contentDocument);
        jqueryMap.gameButtons.set('colorButton0', $($gameImage).find('#colorButton0'));
        jqueryMap.gameButtons.set('colorButton1', $($gameImage).find('#colorButton1'));
        jqueryMap.gameButtons.set('colorButton2', $($gameImage).find('#colorButton2'));
        jqueryMap.gameButtons.set('colorButton3', $($gameImage).find('#colorButton3'));

        jqueryMap.controlButtons.set('restartButton', $($gameImage).find('#restartButton'));
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

    function playSound(buttonSound) {
        buttonSound.currentTime = 0;
        buttonSound.play();
    }

    function setButtonState ($button, isButtonOn) {
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

    function toggleMode($button) {
        //TODO: too much button complexity here - separate button module with clean API
        var isOnOffButton = $button.id === 'onOffButton',
            isButtonOn = isOnOffButton ? stateMap.isGameOn : stateMap.isStrictMode,
            isButtonGoingOff = isButtonOn;

        if (!stateMap.isGameOn && !isOnOffButton)  {
            return false;
        }

        setButtonState($button, !isButtonOn);

        if (isOnOffButton && isButtonGoingOff) {
            setButtonState(jqueryMap.controlButtons.get('strictButton')[0], false);
            stateMap.score = '';
            displayScore();
        }
    }

    return {
        init: init
    };
}());

simon.init();