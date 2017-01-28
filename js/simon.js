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
        colorButtons: []
    };
    //----------------------- END MODULE SCOPE VARIABLES -----------------------

    function init() {
        $(window).load(function () {
            initializeJqueryMap();
            setEventHandlers();
        })
    };

    function initializeJqueryMap () {
        var $gameImage = jqueryMap.$gameImage = $(document.getElementById('gameImage').contentDocument);
        jqueryMap.colorButtons.push($($gameImage).find('#colorButton0'));
        jqueryMap.colorButtons.push($($gameImage).find('#colorButton1'));
        jqueryMap.colorButtons.push($($gameImage).find('#colorButton2'));
        jqueryMap.colorButtons.push($($gameImage).find('#colorButton3'));
    }

    function handleMouseDown(button) {
        $(jqueryMap.colorButtons[button]).css('fill', configMap.buttonColorPressed[button]);
    }

    function handleMouseUp(button) {
        $(jqueryMap.colorButtons[button]).css('fill', configMap.buttonColor[button]);
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