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
        buttonColor: ['#FF0000', '00E1FF', 'F5F500', '00E100']
    },
    jqueryMap = {
        colorButtons: [],
        buttonSounds: []
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

    function init() {
        $(window).load(function () {
            initializeJqueryMap();
            initializeSounds();
            setEventHandlers();
        })
    };

    function initializeButtonSound (button) {
        var buttonSound = document.createElement('audio');
        buttonSound.setAttribute('src', 'media/sound' + button + '.ogg');
        jqueryMap.buttonSounds.push(buttonSound);
    }

    function initializeJqueryMap() {
        var $gameImage = jqueryMap.$gameImage = $(document.getElementById('gameImage').contentDocument);
        jqueryMap.colorButtons.push($($gameImage).find('#colorButton0'));
        jqueryMap.colorButtons.push($($gameImage).find('#colorButton1'));
        jqueryMap.colorButtons.push($($gameImage).find('#colorButton2'));
        jqueryMap.colorButtons.push($($gameImage).find('#colorButton3'));
    }

    function initializeSounds () {
        for (var button = 0; button < 4; button++) {
            initializeButtonSound(button);
        }
        //var buttonSound = document.createElement('audio');
        //buttonSound.setAttribute('src', 'media/sound0.ogg');
        //jqueryMap.buttonSounds.push(buttonSound);

        //buttonSound.loop = false;

        //buttonSound.addEventListener('ended', function () {
        //    playSound(this);
        //}, false);

        //buttonSound.addEventListener("timeupdate", function () {
        //    if ( this.currentTime === this.duration ) {
        //        playSound (this);
        //    }
        //}, false);

    }



    function playSound(buttonSound) {
        buttonSound.currentTime = 0;
        buttonSound.play();
    }

    function setEventHandlers() {
        jqueryMap.colorButtons.forEach(function ($button, buttonNumber) {
            $button.bind('touchstart mousedown', function () {
                handleMouseDown(buttonNumber);
            });

            $button.bind('touchend mouseup', function () {
                handleMouseUp(buttonNumber);
            });
        });
    }

    return {
        init: init
    };
}());

simon.init();