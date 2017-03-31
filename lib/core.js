var JSJ = JSJ || {};
JSJ.Core = JSJ.Core || {};

JSJ.Core.range = function(start, end) {
  var range = [];
  for (var i = start; i < end; i++) range.push(i);
  return range;
}

JSJ.Core.or = function(a, fnB) {
  return JSJ.Core.truthy(a) ? a : fnB();
}

JSJ.Core.and = function(a, fnB) {
  if (!JSJ.Core.truthy(a)) return false;
  var b = fnB();
  return JSJ.Core.truthy(b) ? b : false;
}

JSJ.Core.truthy = function(b) {
  return b != null && b !== false
}
