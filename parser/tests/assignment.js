(function() {
    var a = 0;
    var b = {
        a: a
    };
    var c = {
        a: a,
        b: b
    };
    a = b.a;
    a = c.a;
    b = c.b;
    var _obj1 = a();
    var d = _obj1.d;
    var e = _obj1.e;
    var f = _obj1.f;
    var A = (function() {
        var p = 0;
        var q = {
            p: p
        };
        var r = {
            p: p,
            q: q
        };
        a = b.a;
        a = c.a;
        b = c.b;
        var _obj2 = a();
        var h = _obj2.h;
        var j = _obj2.j;
        var k = _obj2.k;
        return {
            p: p,
            q: q,
            r: r,
            a: a,
            b: b,
            h: h,
            j: j,
            k: k
        };
    })();
})();