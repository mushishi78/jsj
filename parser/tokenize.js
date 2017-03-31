var JSJ = JSJ || {};

JSJ.tokenize = function(text) {
  if (!text) return [];

  var start = 0;
  var tokens = [];
  var braceStack = [];
  var i;
  var lineCount = 0;
  var lineIndex = 0;

  function addToken(type, end) {
    tokens.push({
      type: type,
      value: text.slice(start, end),
      line: lineCount,
      column: start - lineIndex
    });
    start = end;
  }

  function isDigit(c) {
    return c >= '0' && c <= '9';
  }

  function isNameChar(c) {
    return (c === '$' || c === '_') || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
  }

  while (start < text.length) {

    // Newline
    if (text[start] === '\r') {
      if (text[start + 1] === '\n') {
        // Skip the \r character on windows
        start += 1;
      } else {
        // Replace the \r character on old macs
        text[start] = '\n';
      }
    }
    if (text[start] === '\n') {
      addToken("newline", start + 1);
      lineCount++;
      lineIndex = start;
      continue;
    }

    // Tabs
    if ('\t\v'.indexOf(text[start]) >= 0) {
      for (i = start + 1; i < text.length; i++) {
        if ('\t\v'.indexOf(text[i]) < 0) break;
      }
      addToken("illegal-tabs", i);
      continue;
    }

    // Comment
    if (text[start] === '#') {
      for (i = start + 1; i < text.length; i++) {
        if ('\n\r'.indexOf(text[i]) >= 0) break;
      }
      addToken("comment", i);
      continue;
    }

    // Whitespace
    if (text[start] === ' ') {
      for (i = start + 1; i < text.length; i++) {
        if (text[i] !== ' ') break;
      }
      addToken("whitespace", i);
      continue;
    }

    // Number
    if (isDigit(text[start])) {
      for (i = start + 1; i < text.length; i++) {
        if (!isDigit(text[i])) break;
      }

      // If it not the begining of a name
      if (!text[i] || " )}],.;".indexOf(text[i]) >= 0) {
        addToken("number", i);
        continue;
      }
    }

    // String
    if (text[start] === "'") {
      for (i = start + 1; i < text.length; i++) {
        if (text[i] === "'" || text[i] === '{') break;

        // skip a character if escaped
        if (text[i] === '\\') i++;
      }

      // If interpolation push on brace stack
      if (text[i] === '{') braceStack.push("string");

      addToken("string", i + 1);
      continue;
    }

    // Closing interpolated string
    if (
      text[start] === "}" &&
      braceStack[braceStack.length - 1] === "string"
    ) {
      for (i = start + 1; i < text.length; i++) {
        if (text[i] === "'" || text[i] === '{') break;

        // skip a character if escaped
        if (text[i] === '\\') i++;
      }

      // If interpolation finished, pop from brace stack
      if (text[i] === "'") braceStack.pop();

      addToken("string", i + 1);
      continue;
    }

    // Opening brace
    if (text[start] === '{') {
      braceStack.push("block");
    }
    // Closing brace
    if (
      text[start] === '}' &&
      braceStack[braceStack.length - 1] === "block"
    ) {
      braceStack.pop();
    }

    // Name
    if (isNameChar(text[start])) {
      for (i = start + 1; i < text.length; i++) {
        if (!isNameChar(text[i])) break;
      }
      addToken("name", i);
      continue;
    }

    // 2 character binary
    if (["&&", "||", "==", "!=", "<=", ">="].indexOf(text.slice(start, start + 2)) >= 0) {
      addToken("binary", start + 2);
      continue;
    }

    // 2 character symbol
    if (["..", "~=", "=~", "~:", ":~"].indexOf(text.slice(start, start + 2)) >= 0) {
      addToken("symbol", start + 2);
      continue;
    }

    // 1 character binary
    if ("<>+-*/%".indexOf(text[start]) >= 0) {
      addToken("binary", start + 1);
      continue;
    }

    // 1 character symbol
    if ("(){}[].,;:=!".indexOf(text[start]) >= 0) {
      addToken("symbol", start + 1);
      continue;
    }

    addToken("unknown", start + 1);
  }
  return tokens;
};
