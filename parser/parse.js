var JSJ = JSJ || {};

JSJ.parse = function(tokens) {
  var i = -1, token = tokens[0];

  function step() {
    for (i += 1; i < tokens.length; i++) {
      token = tokens[i];
      if (["number", "string", "symbol", "name", "binary"].indexOf(token.type) >= 0) return;
    }
    token = { type: "eof" };
  }

  function assert(expected) {
    if (token.value === expected) return;
    throw { error: "unexpected-token", token: token, expected: expected };
  }

  function topLevel() {
    step();

    // Namespace
    if (token.value === "namespace"){
      var namespace = [];
      step();
      while (true) {
        if (token.type !== "name") throw { error: "namespace-name", token: token };
        namespace.push(token.value);
        step();
        if (token.value !== ".") break;
        step();
      }
    }

    // Using
    if (token.value === "using") {
      var using = [];
      step();
      assert("{");
      step();
      while (token.value !== "}") {
        var usingName = [];

        while (true) {
          if (token.type !== "name") throw { error: "using-name", token: token };
          usingName.push(token.value);
          step();
          if (token.value !== ".") break;
          step();
        }

        using.push(usingName);
      }
      step();
    }

    // Statements
    var statements = [];
    while (token.type !== "eof") {
      statements.push(statement());
    }

    return { namespace: namespace, using: using, statements: statements };
  }

  function statement() {
    // If
    if (token.value === "if") {
      step();
      assert("(");
      step();
      var condition = expression(0);
      assert(")");
      step();

      var ifs = [{ condition: condition, ifTrue: block() }];

      while (token.value === "else") {
        step();

        // Else if block
        if (token.value === "if") {
          step();
          assert("(");
          step();
          condition = expression(0);
          assert(")");
          step();
          ifs.push({ condition: condition, ifTrue: block() });
          continue;
        }

        // Final else block
        var ifFalse = block();
      }

      return { type: "if", ifs: ifs, ifFalse: ifFalse };
    }

    // For
    if (token.value === "for") {
      var names = [];
      step();
      assert("(");
      step();

      if (token.type !== "name") throw { error: "invalid-for-name", token: token };
      names.push(token.value);
      step();

      // Take second name for key values pairs
      if (token.value !== "in") {
        if (token.type !== "name") throw { error: "invalid-for-name", token: token };
        names.push(token.value);
        step();
      }

      assert("in");
      step();
      collection = expression(0);
      assert(")");
      step();

      return { type: "for", names: names, collection: collection, block: block() };
    }

    // Loop
    if (token.value === "loop") {
      step();
      return { type: "loop", block: block() };
    }

    // Return
    if (token.value === "return") {
      step();
      if (token.value !== ";") {
        var value = expression(0);
      }
      assert(";");
      step();
      return { type: "return", value: value };
    }

    // Break and Continue
    if (token.value === "break" || token.value === "continue") {
      var type = token.value;
      step();
      assert(";");
      step();
      return { type: type };
    }

    // Do
    if (token.value === "do") {
      step();
      var e = expression(0);
      assert(";");
      step();
      return { type: "do", expression: e };
    }

    // Block
    if (token.value === "{") {
      return { type: "block", statements: block() };
    }

    // Assignment
    if (token.type === "name") {
      var left = [token.value];
      step();

      // One to one
      if (token.value === "=" || token.value === ":") {
        var type = token.value;
        step();
        var right = expression(0);
        assert(";");
        step();
        return { type: type, left: left[0], right: right };
      }

      // Many to One
      if (token.value === "=~" || token.value === ":~") {
        var type = token.value;
        step();
        var right = []

        do {
          if (token.type !== "name") throw { type: "invalid-assignment", token: token };
          right.push(token.value);
          step();
        } while (token.value !== ";")

        assert(";");
        step();
        return { type: type, left: left[0], right: right };
      }

      // One to Many
      while (token.value !== "~=" && token.value !== "~:") {
          if (token.type !== "name") throw { type: "invalid-assignment", token: token };
          left.push(token.value);
          step();
      }
      var type = token.value;
      step();
      var right = expression(0);
      assert(";");
      step();
      return { type: type, left: left, right: right };
    }

    throw { error: "unrecognized-statement", token: token };
  }

  function block() {
    var statements = [];
    assert("{");
    step();
    while (token.value !== "}") {
      statements.push(statement());
    }
    step();
    return statements;
  }

  function expression(rbp) {
    var tree = nud();
    while (rbp < lbp(token.value)) tree = led(tree);
    return tree;
  }

  function lbp(value) {
    if (["&&", "||"].indexOf(value) >= 0) return 1;
    if (["==", "!=", "<", "<=", ">", ">="].indexOf(value) >= 0) return 2;
    if ("+-".indexOf(value) >= 0) return 3;
    if ("*/%".indexOf(value) >= 0) return 4;
    if (["!", ".."].indexOf(value) >= 0) return 5;
    if (".[(".indexOf(value) >= 0) return 6;
    return 0;
  }

  // nud - when a token is found at the begining of an expression tree
  function nud() {
    var tree;

    // Number
    if (token.type === "number") {
      const left = token.value;
      step();

      // Integer
      if (token.value !== ".") {
        tree = { type: "integer", value: left };
      }

      // Decimal
      else {
        step();
        if (token.type !== "number") throw { error: "invalid-decimal", token: token };
        tree = { type: "decimal", value: left + "." + token.value };
        step();
      }
    }

    // Strings
    else if (token.type === "string") {
      var parts = [];

      while (true) {
        var lastChar = token.value[token.value.length - 1];
        var str = token.value.slice(1, token.value.length - 1);

        parts.push({ string: str });
        if (lastChar === "'") break;

        step();
        parts.push({ expression: expression(0) });
      }

      tree = { type: "string", parts: parts };
      step();
    }

    // Constants
    else if (["true", "false", "undef"].indexOf(token.value) >= 0) {
      tree = { type: "constant", value: token.value };
      step();
    }

    // ! prefix
    else if (token.value === "!") {
      step();
      tree = { type: "!", right: expression(lbp("!")) };
    }

    // Function
    else if (token.value === "fn") {
      var parameters = [];
      step();
      assert("(");
      for (step(); token.value !== ")"; step()) {
        if (token.type !== "name") throw { error: "invalid-param", token: token };
        parameters.push(token.value);
      }
      step();
      assert("{");
      tree = { type: "fn", parameters: parameters, statements: block() };
    }

    // Bracket subgroup
    else if (token.value === "(") {
      step();
      tree = expression(0);
      assert(")");
      step();
    }

    // Block
    else if (token.value === "{") {
      tree = { type: "block", statements: block() };
    }

    // Array
    else if (token.value === "[") {
      var members = [];
      step();
      while (token.value !== "]") {
        members.push(expression(0));
        if (token.value === "]") break;
        if (token.value !== ",") throw { error: "no-comma-in-array", token: token };
        step();
      }
      tree = { type: "array", members: members };
      step();
    }

    // Variable
    else if (token.type === "name") {
      tree = { type: "variable", value: token.value };
      step();
    }

    if (!tree) throw { error: "no-nud", token: token }
    return tree;
  }

  // led - when a token is found infixed on an expression tree
  function led(left) {
    var tree;

    // Binary operators
    if (token.type === "binary") {
      var operator = token.value;
      var bp = lbp(token.value);
      step();
      var right = expression(bp);
      tree = { type: "binary", operator: operator, left: left, right: right };
    }

    // Property accessor
    else if (token.value === ".") {
      step();
      if (token.type !== "name") throw { error: "invalid-property", token: token };
      tree = { type: "property-accessor", left: left, right: token.value };
      step();
    }

    // Index accessor
    else if (token.value === "[") {
      step();
      var right = expression(0);
      assert("]");
      tree = { type: "index-accessor", left: left, right: right };
      step();
    }

    // Function invocation
    else if (token.value === "(") {
      var arguments = [];
      step();
      while (token.value !== ")") {
        arguments.push(expression(0));
        if (token.value === ",") step();
      }
      tree = { type: "invocation", function: left, arguments: arguments };
      step();
    }

    if (tree) return tree;
    throw { error: "no-led", token: token }
  }

  return topLevel();
};
