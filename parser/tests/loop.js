(function() {
    var a = 0;
    while (true) {
        a = (a + 1);
        if (JSJ.Core.truthy((a > 10))) {
            break;
        }
        var b = (a * 5);
    }
})();