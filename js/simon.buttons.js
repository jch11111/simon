/*
* simon.buttons.js
* buttons module
*/

simon.buttons = (function () {
    'use strict';

    //----------------------- BEGIN MODULE SCOPE VARIABLES -----------------------
    //color buttons are the 4 colored buttons the player uses to play the sequence
    var colorButtonsArray = [],
    //control buttons include the on/off button, the restart button and the strict mode button
        controlButtonArray = [],
        moduleObject = {};
    //----------------------- END MODULE SCOPE VARIABLES -----------------------


    //----------------------- BEGIN PRIVATE FUNCTIONS -----------------------

    // Begin private function handleColorButtonMouseDown
    // Purpose : fire 'handleColorButtonMouseDown' event that game module will handle
    // Arguments    : none
    // Returns      : false
    // Triggers     : testo
    // Throws       : none
    function handleColorButtonMouseDown(e) {
        e.preventDefault();
        $(moduleObject).trigger({
            type: 'colorButtonMouseDown',
            button: this
        });
    }

    // Begin private function handleColorButtonMouseUp
    // Purpose : fire 'handleColorButtonMouseUp' event that game module will handle
    // Arguments    : none
    // Returns      : false
    // Throws       : none
    function handleColorButtonMouseUp() {
    }

    // Begin private function init
    // Purpose : initialize the buttons module by populating the buttons array and .....
    // Arguments    : none
    // Returns      : false
    // Throws       : none
    function init(gameImage) {
        colorButtonsArray.push($(gameImage).find('#colorButton0'));
        colorButtonsArray.push($(gameImage).find('#colorButton1'));
        colorButtonsArray.push($(gameImage).find('#colorButton2'));
        colorButtonsArray.push($(gameImage).find('#colorButton3'));

        controlButtonArray.push($(gameImage).find('#startButton'));
        controlButtonArray.push($(gameImage).find('#onOffButton'));
        controlButtonArray.push($(gameImage).find('#onOffButton'));

        colorButtonsArray.forEach(function ($button) {
            $button.bind('touchstart mousedown', handleColorButtonMouseDown);
            //$button.bind('touchend mouseup', handleColorButtonMouseUp);
            //$button.hover(handleButtonMouseOver, handleButtonMouseOut);
        });
    }
    //----------------------- END PRIVATE FUNCTIONS -----------------------

    moduleObject.init = init;
    return moduleObject;

}($));  //gameImage is the svg image passed in from game module (simon.game.js)