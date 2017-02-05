/*
* simon.js
* Shell module
*/

var simon = (function () {
    "use strict";

    //----------------------- BEGIN MODULE SCOPE VARIABLES -----------------------
var
    configMap = {
        buttonColorPressed: ['#FFAAAA', 'AAF5FF', 'FFFFAA', 'AAFFAA'],
        buttonColor: ['#FF0000', '00E1FF', 'F5F500', '00E100'],
        startButtonColorOff: '#A00000',
        strictButtonColorOff: '#00A000',
        startButtonColorOn: '#FF4444',
        strictButtonColorOn: '#44FF44',
    },
    jqueryMap = {
        colorButtons: [],
        buttonSounds: []
    },
    stateMap = {
        isStrictMode: false
    };
    //----------------------- END MODULE SCOPE VARIABLES -----------------------

    function handleMouseDown(button) {
        $(jqueryMap.colorButtons[button]).css('fill', configMap.buttonColorPressed[button]);
        playSound(jqueryMap.buttonSounds[button]);
    }

    function handleMouseUp(button) {
        $(jqueryMap.colorButtons[button]).css('fill', configMap.buttonColor[button]);
        jqueryMap.buttonSounds[button].pause();
    }

    function handleStartButtonClick() {
        $(jqueryMap.$startButton).css('fill', configMap.startButtonColorOn);
    }

    function handleStrictButtonClick() {
        toggleStrictMode();
    }

    function init() {
        $(window).load(function () {
            initializeJqueryMap();
            initializeSounds();
            setEventHandlers();
        })
    };

    function initializeButtonSound (button) {
        var buttonSound = document.createElement('audio');
        buttonSound.setAttribute('src', 'media/sound' + button + '.mp3');
        jqueryMap.buttonSounds.push(buttonSound);
    }

    function initializeJqueryMap() {
        var $gameImage = jqueryMap.$gameImage = $(document.getElementById('gameImage').contentDocument);
        jqueryMap.colorButtons.push($($gameImage).find('#colorButton0'));
        jqueryMap.colorButtons.push($($gameImage).find('#colorButton1'));
        jqueryMap.colorButtons.push($($gameImage).find('#colorButton2'));
        jqueryMap.colorButtons.push($($gameImage).find('#colorButton3'));
        jqueryMap.$startButton = $($gameImage).find('#startButton');
        jqueryMap.$strictButton = $($gameImage).find('#strictButton');
    }

    function initializeSounds () {
        for (var button = 0; button < 4; button++) {
            initializeButtonSound(button);
        }
    }

    function playSound(buttonSound) {
        buttonSound.currentTime = 0;
        buttonSound.play();
    }

    function setEventHandlers() {
        jqueryMap.colorButtons.forEach(function ($button, buttonNumber) {
            $button.bind('touchstart mousedown', function () {
                handleMouseDown(buttonNumber);
                return false;
            });

            $button.bind('touchend mouseup', function () {
                handleMouseUp(buttonNumber);
                return false;
            });
        });
        jqueryMap.$startButton.click(function () {
            handleStartButtonClick();
            return false;
        })
        jqueryMap.$strictButton.click(function () {
            handleStrictButtonClick();
            return false;
        })
        
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