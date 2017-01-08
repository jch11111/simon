var utility = (function () {

    function deepCopy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    return {
        deepCopy: deepCopy
    }
}());