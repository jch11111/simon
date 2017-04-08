/*
* simon.buttons.js
* buttons module
*/

simon.buttons = (function () {
    'use strict';

    //----------------------- BEGIN MODULE SCOPE VARIABLES -----------------------

    var buttonsArray = [],
        //simonButtonsObject will be the object with the public API that will be assigned to simon.buttons
        simonButtonsObject = {},
        //buttonIdNumberMap - will map the button id to a button number from 0 - 6. The button numbers will be used in 
        //  simon.game module to determine which action to take
        buttonIdNumberMap = {
            'colorButton0'  : 0,
            'colorButton1'  : 1,
            'colorButton2'  : 2,
            'colorButton3'  : 3,
            'onOffButton'   : 4,
            'startButton'   : 5,
            'strictButton'  : 6
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

    // Begin private function / handleButtonEvent /
    // Purpose : trigger a custom event on this (simon.buttons) object. The simon.game module will listen for and respond to these events
    // Arguments    : 
    //                  * e - the event object
    // Returns      : false
    // Triggers     : eventType that was passed in
    // Throws       : none
    function handleButtonEvent(e) {
        e.preventDefault();
        $(simonButtonsObject).trigger({
            type: e.type,
            button: this,
            buttonNumber: buttonIdNumberMap[this.id]
        });
        return false;
    }
    //----------------------- END PRIVATE FUNCTIONS -----------------------

    //----------------------- BEGIN PUBLIC FUNCTIONS -----------------------

    // Begin public function / getButton /
    // Purpose : returns a button
    // Arguments    : 
    //                  * buttonId - the id of the button to get
    // Returns      : The requested button or false if no button exists with requested id
    // Triggers     : none
    // Throws       : none
    function getButton(buttonId) {
        var buttonIndex = buttonIdNumberMap[buttonId];

        return buttonIndex &&
               buttonIndex < buttonsArray.length &&
               buttonsArray[buttonIndex][0];
    }

    // Begin public function init
    // Purpose : initialize the buttons module by populating the buttons array
    // Arguments
    //          *gameImage - the jquery representation of the game image - the svg image of the simon game
    // Returns      : false
    // Throws       : none
    function init(gameImage) {
        //add the 4 color buttons
        buttonsArray.push($(gameImage).find('#colorButton0'));
        buttonsArray.push($(gameImage).find('#colorButton1'));
        buttonsArray.push($(gameImage).find('#colorButton2'));
        buttonsArray.push($(gameImage).find('#colorButton3'));

        //add the 3 'control' buttons
        buttonsArray.push($(gameImage).find('#startButton'));
        buttonsArray.push($(gameImage).find('#onOffButton'));
        buttonsArray.push($(gameImage).find('#strictButton'));

        //bind event handlers for the buttons
        buttonsArray.forEach(function (button, buttonNumber) {
            //color buttons are the 4 colored buttons the player uses to play the sequence
            //control buttons include the on/off button, the restart button and the strict mode button
            if (buttonNumber < 4) {
                //button numbers < 4 are the 4 color buttons
                button.bind('touchstart mousedown touchend mouseup mouseenter mouseleave', handleButtonEvent);
            } else {
                //button numbers >= 4 are control buttons
                button.bind('click touchstart mouseenter mouseleave', handleButtonEvent);
            }
        });
    }

    // Begin public function / setButtonColor /
    // Purpose : 'lights up' or darkens the button by setting the css fill property to the 'light' or 'dark' color found in the buttonColors object
    // Arguments    : 
    //                  * buttonOrButtonNumber - contains either the button itdelf or the button number
    //                  * isLit:
    //                      = true to use light color
    //                      = false to use dark color - 
    // Calls        : none
    // Returns      : false
    // Triggers     : none
    // Throws       : none
    function setButtonColor(buttonOrButtonNumber, isLit) {
        var buttonColor,
            button;

        //is buttonOrButtonNumber the actual button or a button number?
        if (!isNaN(buttonOrButtonNumber)) {
            //button number was passed in instead of the actual button. 
            button = buttonsArray[Number(buttonOrButtonNumber)][0];
        } else {
            //buttonOrButtonNumber is the actual buttons
            button = buttonOrButtonNumber;
        }
        buttonColor = buttonColors[button.id][(isLit ? 'light' : 'dark')];
        $(button).css('fill', buttonColor);

        return Promise.resolve();
    }

    //Add public API to simonButtonsObject object
    simonButtonsObject.getButton = getButton;
    simonButtonsObject.init = init;
    simonButtonsObject.setButtonColor = setButtonColor;

    //return the public api
    return simonButtonsObject;

}($));