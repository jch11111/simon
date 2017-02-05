/*
* simon.js
* Shell module
*/

var simon = (function () {
    "use strict";

    //----------------------- BEGIN MODULE SCOPE VARIABLES -----------------------
var
    configMap = {
        buttonColorPressed: new Map(),
        buttonColor: new Map(),
        startButtonColorOff: '#A00000',
        strictButtonColorOff: '#00A000',
        startButtonColorOn: '#FF4444',
        strictButtonColorOn: '#44FF44',
        buttonSounds: new Map()
    },
    jqueryMap = {
        colorButtons: new Map(),
        $startButton: null,
        $strictButton: null
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

    function handleColorButtonMouseDown() {
        $(this).css('fill', configMap.buttonColorPressed.get(this.id));
        playSound(configMap.buttonSounds.get(this.id));
        return false;
    }

    function handleColorButtonMouseUp() {
        $(this).css('fill', configMap.buttonColor.get(this.id));
        configMap.buttonSounds.get(this.id).pause();
        return false;
    }

    function handleStartButtonClick() {
        $(jqueryMap.$startButton).css('fill', configMap.startButtonColorOn);
        return false;
    }

    function handleStrictButtonClick() {
        toggleStrictMode();
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
        configMap.buttonColorPressed.set('colorButton0','#FFAAAA');
        configMap.buttonColorPressed.set('colorButton1','#AAF5FF');
        configMap.buttonColorPressed.set('colorButton2','#FFFFAA');
        configMap.buttonColorPressed.set('colorButton3','#AAFFAA');

        configMap.buttonColor.set('colorButton0','#FF0000');
        configMap.buttonColor.set('colorButton1','#00E1FF');
        configMap.buttonColor.set('colorButton2','#F5F500');
        configMap.buttonColor.set('colorButton3','#00E100');
    }

    function initializeJqueryMap() {
        var $gameImage = jqueryMap.$gameImage = $(document.getElementById('gameImage').contentDocument);
        jqueryMap.colorButtons.set('colorButton0', $($gameImage).find('#colorButton0'));
        jqueryMap.colorButtons.set('colorButton1', $($gameImage).find('#colorButton1'));
        jqueryMap.colorButtons.set('colorButton2', $($gameImage).find('#colorButton2'));
        jqueryMap.colorButtons.set('colorButton3', $($gameImage).find('#colorButton3'));

        jqueryMap.$startButton = $($gameImage).find('#startButton');
        jqueryMap.$strictButton = $($gameImage).find('#strictButton');
    }

    function initializeSounds () {
        jqueryMap.colorButtons.forEach(function ($button, buttonId) {
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
        jqueryMap.colorButtons.forEach(function ($button) {
            $button.bind('touchstart mousedown', handleColorButtonMouseDown);
            $button.bind('touchend mouseup', handleColorButtonMouseUp);
            $button.hover(handleButtonMouseOver, handleButtonMouseOut);

            //$button.hover()
        });
        jqueryMap.$startButton.click(handleStartButtonClick);
        jqueryMap.$strictButton.click(handleStrictButtonClick);
    }

    function toggleStrictMode() {
        var strictButtonColor;

        stateMap.isStrictMode = !stateMap.isStrictMode;
        strictButtonColor = stateMap.isStrictMode ? configMap.strictButtonColorOn : configMap.strictButtonColorOff;
        $(jqueryMap.$strictButton).css('fill', strictButtonColor);
    }

    return {
        init: init
    };
}());

simon.init();