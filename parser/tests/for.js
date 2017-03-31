(function() {
    var _collection1 = [0, 1, 2];
    for (var _index1 = 0; _index1 < _collection1.length; _index1++) {
        var a = _collection1[_index1];
        var res = (res + a);
    }
    var _collection2 = JSJ.Core.range(0, 2);
    for (var _index2 = 0; _index2 < _collection2.length; _index2++) {
        var i = _collection2[_index2];
        var res = (res + i);
    }
    var _collection3 = {};
    for (var key in _collection3) {
        if (!_collection3.hasOwnProperty(key)) continue;
        var value = _collection3[key];
        var res = [key, value];
    }
})();