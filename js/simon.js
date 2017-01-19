var tictactoe = (function () {

    function init() {
        $(function () {
            setEventHandlers();
        })
    };

    function setEventHandlers() {
        $('#path5283').click(function () {
            console.log('path5283');
        })
        $('#path5285').click(function () {
            console.log('path5285');
        })
        $('#path5287').click(function () {
            console.log('path5287');
        })
        $('#path5289').click(function () {
            console.log('path5289');
        })
    }

    return {
        init: init
    };
}());

tictactoe.init();