(function() {
    var A = function() {
        return 5;
    };
    var C = function(a, b) {
        if (JSJ.Core.truthy((a > b))) {
            var p = 5;
        } else {
            var q = 6;
        }
        return {
            p: p,
            q: q
        };
    };
})();