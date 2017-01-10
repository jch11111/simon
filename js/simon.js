var tictactoe = (function () {

    function init() {
        $(function () {
            setEventHandlers();
        })
    };

    function setEventHandlers() {
        $('#c1').click(function () {
            console.log('c1');
        })
        $('#c2').click(function () {
            console.log('c2');
        })
    }

    return {
        init: init
    };
}());

tictactoe.init();