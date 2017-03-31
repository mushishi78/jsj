(function() {
    var a = "This is a string!";
    var b = "\r\n  This is a multiple line string.\r\n\r\n  It is useful.\r\n";
    var c = "This is an interpolation: " + b + "";
    var d = "Multiple interpolations: " + a + ", " + b + ", " + c + "";
    var e = "Escapes: '{}\\\"\t\f";
})();