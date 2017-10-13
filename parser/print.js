var JSJ = JSJ || {};

JSJ.print = function(ast) {

  // Scope
  var names = [], props = [];
  var namesStack = [], propsStack = [];

  function nameExists(name) {
    if (names.indexOf(name) >= 0) return true;

    for (var i = 0; i < namesStack.length; i++) {
      if (namesStack[i].indexOf(name) >= 0) return true;
    }

    return false;
  }

  // Obfuscation
  var obCounts = {};
  function obfuscate(name) {
    if (obCounts[name] === undefined) {
      obCounts[name] = 0;
    }
    obCounts[name] += 1;
    return "_" + name + obCounts[name];
  }

  // Output
  var output = "";
  function print(str) {
    output += str;
  }

  function printTopLevel() {
    var namespace;

    if (ast.namespace) {
      for (var i = 0; i < ast.namespace.length; i++) {
        namespace = ast.namespace.slice(0,  i + 1).join(".");
        print("var " + namespace + " = " + namespace + " || {};");
      }
    }

    print("(function() {");

    if (ast.using) {
      for (var i = 0; i < ast.using.length; i++) {
        var parts = ast.using[i];
        var name = parts[parts.length - 1];
        print("var " + name + " = " + parts.join(".") + ";");
        names.push(name);
      }
    }

    printStatements(ast.statements);

    if (namespace) {
      for (var i = 0; i < props.length; i++) {
        print(namespace + "." + props[i] + " = " + props[i] + ";");
      }
    }

    print("})();")
  }

  function printStatements(statements) {
    for (var i = 0; i < statements.length; i++) {
      var statement = statements[i];

      // If
      if (statement.type === "if") {
        for (var j = 0; j < statement.ifs.length; j++) {
          print("if (JSJ.Core.truthy(");
          printExpression(statement.ifs[j].condition);
          print(")) {");
          namesStack.push(names);
          names = [];
          printStatements(statement.ifs[j].ifTrue);
          names = namesStack.pop();
          if (j < statement.ifs.length - 1) print("} else ");
        }

        if (statement.ifFalse) {
          print("} else {");
          namesStack.push(names);
          names = [];
          printStatements(statement.ifFalse);
          names = namesStack.pop();
        }

        print("}");
      }

      // For
      if (statement.type === "for") {
        var collection = obfuscate("collection");
        print("var " + collection + " = ");
        printExpression(statement.collection);
        print(";");
        namesStack.push(names);
        names = [];

        // Array iterator
        if (statement.names.length === 1) {
          var iterator = obfuscate("index");
          print("for (" +
            "var " + iterator + " = 0;" +
            iterator + " < " + collection + ".length;" +
            iterator + "++) {");

          var name = statement.names[0];
          if (!nameExists(name)) {
            print("var ");
            names.push(name);
          }

          print(name + " = " + collection + "[" + iterator + "];");
        }

        // Object iterator
        else {
          var key = statement.names[0];
          var value = statement.names[1];
          print("for (");

          if (!nameExists(key)) {
            print("var ");
            names.push(key);
          }

          print(key + " in " + collection + ") {");
          print("if (!" + collection + ".hasOwnProperty(" + key + ")) continue;")

          if (!nameExists(value)) {
            print("var ");
            names.push(value);
          }

          print(value + " = " + collection + "[" + key + "];");
        }
        printStatements(statement.block);
        names = namesStack.pop();
        print("}");
      }

      // Loop
      if (statement.type === "loop") {
        print("while(true) {");
        namesStack.push(names);
        names = [];
        printStatements(statement.block);
        names = namesStack.pop();
        print("}");
      }

      // Return
      if (statement.type === "return") {
        if (statement.value && props.length > 0) throw { error: "props-and-return" };

        if (props.length > 0) {
          printPropsReturn();
          return;
        }

        print("return");

        if (statement.value) {
          print(" ");
          printExpression(statement.value);
        }

        print(";");
      }

      // Break
      if (statement.type === "break") {
        print("break;");
      }

      // Continue
      if (statement.type === "continue") {
        print("continue;");
      }

      // Do
      if (statement.type === "do") {
        printExpression(statement.expression);
        print(";");
      }

      // Block
      if (statement.type === "block") {
        print("(");
        printFunction([], statement.statements);
        print(")();");
      }

      // = Assignment
      if (statement.type === "=") {
        var name = statement.left;

        if (!nameExists(name)) {
          print("var ");
          names.push(name);
        }

        print(name + " = ");
        printExpression(statement.right);
        print(";");
      }

      // : Assignment
      if (statement.type === ":") {
        var name = statement.left;

        if (props.indexOf(name) < 0) {
          props.push(name);
        }

        if (!nameExists(name)) {
          print("var ");
          names.push(name);
        }

        print(name + " = ");
        printExpression(statement.right);
        print(";");
      }

      // =~ Assignment
      if (statement.type === "=~") {
        var name = statement.left;

        if (!nameExists(name)) {
          print("var ");
          names.push(name);
        }
        print(name + " = { ");

        for (var j = 0; j < statement.right.length; j++) {
          if (j > 0) print(", ");
          var v = statement.right[j];
          if (!nameExists(v)) throw { error: "unknown-variable", variable: v };
          print(v + ":" + v);
        }
        print("} ;");
      }

      // :~ Assignment
      if (statement.type === ":~") {
        var name = statement.left;

        if (props.indexOf(name) < 0) {
          props.push(name);
        }

        if (!nameExists(name)) {
          print("var ");
          names.push(name);
        }
        print(name + " = { ");

        for (var j = 0; j < statement.right.length; j++) {
          if (j > 0) print(", ");
          var v = statement.right[j];
          if (!nameExists(v)) throw { error: "unknown-variable", variable: v };
          print(v + ":" + v);
        }
        print("} ;");
      }

      // ~= Assignment
      if (statement.type === "~=") {
        // If simple variable use directly
        if (statement.right.type === "variable") {
          var obj = statement.right.value;
        }

        // If expression, assign to obfuscated local
        else {
          var obj = obfuscate("obj");
          print("var " + obj + " = ");
          printExpression(statement.right);
          print(";");
        }

        for (var j = 0; j < statement.left.length; j++) {
          var name = statement.left[j];
          if (!nameExists(name)) {
            print("var ");
            names.push(name);
          }
          print(name + " = " + obj + "." + name + ";");
        }
      }

      // ~: Assignment
      if (statement.type === "~:") {
        // If simple variable use directly
        if (statement.right.type === "variable") {
          var obj = statement.right.value;
        }

        // If expression, assign to obfuscated local
        else {
          var obj = obfuscate("obj");
          print("var " + obj + " = ");
          printExpression(statement.right);
          print(";");
        }

        for (var j = 0; j < statement.left.length; j++) {
          var name = statement.left[j];
          if (props.indexOf(name) < 0) {
            props.push(name);
          }
          if (!nameExists(name)) {
            print("var ");
            names.push(name);
          }
          print(name + " = " + obj + "." + name + ";");
        }
      }
    }
  }

  function printPropsReturn() {
    if (props.length === 0) return;
    print("return { ");

    for (var i = 0; i < props.length; i++) {
      if (i > 0) print(", ");
      print(props[i] + ": " + props[i]);
    }

    print(" };");
  }

  function printExpression(expression) {
    if (expression.type === "integer" || expression.type === "decimal") {
      print(expression.value);
    }

    if (expression.type === "string") {
      for (var i = 0; i < expression.parts.length; i++) {
        if (i > 0) print(" + ");

        var part = expression.parts[i];

        if (part.expression) {
          printExpression(part.expression);
        }

        if (part.string != null) {
          print("\"");
          print(part.string.replace(
            /(\")|(\\')|(\\{)|(\\})|(\n)|(\t)|(\v)|(\0)|(\b)|(\f)|(\r)/g,
            function(
              str,
              doubleQuote,
              singleQuote,
              openBrace,
              closeBrace,
              newline,
              tab,
              vtab,
              nullChar,
              backspace,
              formfeed,
              carriageReturn) {
              if (doubleQuote) return "\\\"";
              if (singleQuote) return "'";
              if (openBrace) return "{";
              if (closeBrace) return "}";
              if (newline) return "\\n";
              if (tab) return "\\t";
              if (vtab) return "\\v";
              if (nullChar) return "\\0";
              if (backspace) return "\\b";
              if (formfeed) return "\\f";
              if (carriageReturn) return "\\r";
              return str;
            }
          ));
          print("\"");
        }
      }
    }

    if (expression.type === "constant") {
      var value = expression.value;
      if (value === "undef") value = "undefined";
      print(value);
    }

    if (expression.type === "!") {
      print("!JSL.Core.truthy(");
      printExpression(expression.right);
      print(")");
    }

    if (expression.type === "fn") {
      printFunction(expression.parameters, expression.statements);
    }

    if (expression.type === "block") {
      if (expression.statements.length === 0) {
        print("{}");
      } else {
        print("(");
        printFunction([], expression.statements);
        print(")()");
      }
    }

    if (expression.type === "array") {
      print("[");
      for (var i = 0; i < expression.members.length; i++) {
        if (i > 0) print(", ");
        printExpression(expression.members[i]);
      }
      print("]");
    }

    if (expression.type === "variable") {
      if (!nameExists(expression.value)) throw { error: "unknown-variable", variable: expression.value };
      print(expression.value);
    }

    if (expression.type === "binary") {
      if (expression.operator === "||") {
        print("JSJ.Core.or(");
        printExpression(expression.left);
        print(",");
        print("function() { return ");
        printExpression(expression.right);
        print("; })");
      }

      else if (expression.operator === "&&") {
        print("JSJ.Core.and(");
        printExpression(expression.left);
        print(",");
        print("function() { return ");
        printExpression(expression.right);
        print("; })");
      }

      else if (expression.operator === "..") {
        print("JSJ.Core.range(");
        printExpression(expression.left);
        print(",");
        printExpression(expression.right);
        print(")");
      }

      else {
        var operator = expression.operator;

        if (operator === "==") operator = "===";
        if (operator === "!=") operator = "!==";

        print("(");
        printExpression(expression.left);
        print(" " + operator + " ");
        printExpression(expression.right);
        print(")");
      }
    }

    if (expression.type === "property-accessor") {
      printExpression(expression.left);
      print("." + expression.right);
    }

    if (expression.type === "index-accessor") {
      printExpression(expression.left);
      print("[");
      printExpression(expression.right);
      print("]");
    }

    if (expression.type === "invocation") {
      printExpression(expression.function);
      print("(");
      for (var i = 0; i < expression.arguments.length; i++) {
        if (i > 0) print(", ");
        printExpression(expression.arguments[i]);
      }
      print(")");
    }
  }

  function printFunction(parameters, statements) {
    namesStack.push(names);
    propsStack.push(props);
    names = [];
    props = [];

    print("function(");
    for (var i = 0; i < parameters.length; i++) {
      if (i > 0) print(", ");
      print(parameters[i]);
      names.push(parameters[i]);
    }
    print(") {");

    printStatements(statements);

    // If the last statement was not a return
    // need to print a return for any props
    var lastStatement = statements[statements.length - 1];
    if (lastStatement && lastStatement.type !== "return") printPropsReturn();

    print("}");
    props = propsStack.pop();
    names = namesStack.pop();
  }

  printTopLevel();
  return output;
};
