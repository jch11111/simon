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
        moduleObject = {},
        //buttonIdNumberMap - will map the button id to a button number from 0 - 4. The button numbers will be used in 
        //  simon.game module to determine which tone to play
        buttonIdNumberMap = {
            'colorButton0': 0,
            'colorButton1': 1,
            'colorButton2': 2,
            'colorButton3': 3

        },
        //buttonColors provides the hex color codes for the button for light (button is lit up) and dark (button not lit up) states.
        buttonColors = {
            'colorButton0': {
                'light': '#FFAAAA',
                'dark': '#C80000'
            },
            'colorButton1': {
                'light': '#AAF5FF',
                'dark': '#00A0C8'
            },
            'colorButton2': {
                'light': '#FFFFAA',
                'dark': '#C8C800'
            },
            'colorButton3': {
                'light': '#AAFFAA',
                'dark': '#00C800'
            },
            'startButton': {
                'light': '#9696FF',
                'dark': '#0000A0'
            },
            'strictButton': {
                'light': '#44FF44',
                'dark': '#00A000'
            },
            'onOffButton': {
                'light': '#FF4444',
                'dark': '#A00000'
            }
        };
    //----------------------- END MODULE SCOPE VARIABLES -----------------------


    //----------------------- BEGIN PRIVATE FUNCTIONS -----------------------

    // Begin private function / handleColorButtonEvent /
    // Purpose : trigger a custom event on this (simon.buttons) object. The simon.game module will listen for and respond to these events
    // Arguments    : 
    //                  * e - the event object
    //                  * button - the button that raised the event
    //                  * eventType - the type of event to trigger
    // Returns      : false
    // Triggers     : eventType that was passed in
    // Throws       : none
    function handleColorButtonEvent(e, button, eventType) {
        e.preventDefault();
        $(moduleObject).trigger({
            type: eventType,
            button: button,
            buttonNumber: buttonIdNumberMap[button.id]
        });
        return false;
    }

    // Begin private function / handleColorButtonMouseDown /
    // Purpose : triggers 'colorButtonMouseDown' event that game module will handle
    // Arguments    : 
    //                  * e - the event object
    // Calls        : handleColorButtonEvent
    // Returns      : false
    // Triggers     : none
    // Throws       : none
    function handleColorButtonMouseDown(e) {
        return handleColorButtonEvent(e, this, 'colorButtonMouseDown');
    }

    // Begin private function / handleColorButtonMouseOut /
    // Purpose : triggers 'colorButtonMouseOut' event that game module will handle
    // Arguments    : 
    //                  * e - the event object
    // Calls        : handleColorButtonEvent
    // Returns      : false
    // Triggers     : none
    // Throws       : none
    function handleColorButtonMouseOut(e) {
        return handleColorButtonEvent(e, this, 'colorButtonMouseOut');
    }


    // Begin private function / handleColorButtonMouseOver /
    // Purpose : triggers 'colorButtonMouseOver' event that game module will handle
    // Arguments    : 
    //                  * e - the event object
    // Calls        : handleColorButtonEvent
    // Returns      : false
    // Triggers     : none
    // Throws       : none
    function handleColorButtonMouseOver(e) {
        return handleColorButtonEvent(e, this, 'colorButtonMouseOver');
    }

    // Begin private function / handleColorButtonMouseUp /
    // Purpose : triggers 'colorButtonMouseUp' event that game module will handle
    // Arguments    : 
    //                  * e - the event object
    // Calls        : handleColorButtonEvent
    // Returns      : false
    // Triggers     : none
    // Throws       : none
    function handleColorButtonMouseUp(e) {
        return handleColorButtonEvent(e, this, 'colorButtonMouseUp');
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
            $button.bind('touchend mouseup', handleColorButtonMouseUp);
            $button.hover(handleColorButtonMouseOver, handleColorButtonMouseOut);
        });
    }

    // Begin private function / setButtonColor /
    // Purpose : 'lights up' or darkens the button by setting the css fill property to the 'light' or 'dark' color found in the buttonColors object
    // Arguments    : 
    //                  * button - the button to set color for,
    //                  * isLit:
    //                      = true to use light color
    //                      = false to use dark color - 
    // Calls        : none
    // Returns      : false
    // Triggers     : none
    // Throws       : none
    function setButtonColor(button, isLit) {
        var buttonColor = buttonColors[button.id][(isLit ? 'light' : 'dark')];
        $(button).css('fill', colorMap.get(button.id));
    }

    //----------------------- END PRIVATE FUNCTIONS -----------------------

    moduleObject.init = init;
    return moduleObject;

}($));  //gameImage is the svg image passed in from game module (simon.game.js)