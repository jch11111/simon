var simon = (function () {
    "use strict";

    var $colorButton1;

    function init() {
        $(window).load(function () {
            setEventHandlers();
        })
    };

    function handleMouseDown(buttonNumber) {
        $($colorButton1).css('fill', '#F66');
    }

    function handleMouseUp(buttonNumber) {
        $($colorButton1).css('fill', '#F00');
    }

    function setEventHandlers() {
        
        var $gameImage = $(document.getElementById('gameImage').contentDocument);
        $colorButton1 = $($gameImage).find('#colorButton1');

        $($colorButton1).mousedown(function () {
            handleMouseDown(1);
        });

        $($colorButton1).mouseup(function () {
            handleMouseUp(1);
        });
    }

    return {
        init: init
    };
}());

simon.init();