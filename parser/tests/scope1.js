(function() {
    var a = 5;
    a = 10;
    (function() {
        var b = 10;
        b = 9;
    })();
    var b = 25;
})();