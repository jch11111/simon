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
        controlButtons: new Map()
    },
    stateMap = {
        isStrictMode: false
    };
    //----------------------- END MODULE SCOPE VARIABLES -----------------------
    function handleButtonMouseOver () {
        $(this).css('cursor', 'pointer');
        return false;
    }

    function handleButtonMouseOut() {
        $(this).css('cursor', 'default');
        return false;
    }

    function handleGameButtonMouseDown() {
        $(this).css('fill', configMap.buttonColorsLigtht.get(this.id));
        playSound(configMap.buttonSounds.get(this.id));
        return false;
    }

    function handleGameButtonMouseUp() {
        $(this).css('fill', configMap.buttonColorsDark.get(this.id));
        configMap.buttonSounds.get(this.id).pause();
        return false;
    }

    function handleControlButtonClick () {
        switch (this.id) {
            case 'restartButton':
                handleRestartButtonClick(this);
                break;
            case 'strictButton':
                toggleStrictMode(this);
                break;

        }
        return false;
    }

    function handleRestartButtonClick(restartButton) {
        var buttonColorDark = configMap.buttonColorsDark.get(restartButton.id),
            buttonColorBright = configMap.buttonColorsLigtht.get(restartButton.id),
            flashCount = 10,
            flashDuration = 200;

        $(restartButton).css('fill', buttonColorBright);

        setTimeout(flasher, flashDuration);
        
        function flasher() {
            var buttonColor = flashCount % 2 ? buttonColorBright : buttonColorDark;
            $(restartButton).css('fill', buttonColor);
            flashCount--;

            if (flashCount) {
                setTimeout(flasher, flashDuration);
            } else {
                $(restartButton).css('fill', buttonColorDark);
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

        configMap.buttonColorsDark.set('colorButton0','#FF0000');
        configMap.buttonColorsDark.set('colorButton1','#00E1FF');
        configMap.buttonColorsDark.set('colorButton2','#F5F500');
        configMap.buttonColorsDark.set('colorButton3','#00E100');
        configMap.buttonColorsDark.set('restartButton','#0000A0');
        configMap.buttonColorsDark.set('strictButton','#00A000');
    }

    function initializeJqueryMap() {
        var $gameImage = jqueryMap.$gameImage = $(document.getElementById('gameImage').contentDocument);
        jqueryMap.gameButtons.set('colorButton0', $($gameImage).find('#colorButton0'));
        jqueryMap.gameButtons.set('colorButton1', $($gameImage).find('#colorButton1'));
        jqueryMap.gameButtons.set('colorButton2', $($gameImage).find('#colorButton2'));
        jqueryMap.gameButtons.set('colorButton3', $($gameImage).find('#colorButton3'));

        jqueryMap.controlButtons.set('restartButton', $($gameImage).find('#restartButton'));
        jqueryMap.controlButtons.set('strictButton', $($gameImage).find('#strictButton'));
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

    function setEventHandlers() {
        jqueryMap.gameButtons.forEach(function ($button) {
            $button.bind('touchstart mousedown', handleGameButtonMouseDown);
            $button.bind('touchend mouseup', handleGameButtonMouseUp);
            $button.hover(handleButtonMouseOver, handleButtonMouseOut);
        });

        jqueryMap.controlButtons.forEach(function ($button) {
            $button.bind('click', handleControlButtonClick);
            $button.hover(handleButtonMouseOver, handleButtonMouseOut);
        });

    }

    function toggleStrictMode(strictButton) {
        var colorMap;

        stateMap.isStrictMode = !stateMap.isStrictMode;
        colorMap = stateMap.isStrictMode ? configMap.buttonColorsLigtht : configMap.buttonColorsDark;
        $(strictButton).css('fill', colorMap.get(strictButton.id));
    }

    return {
        init: init
    };
}());

simon.init();