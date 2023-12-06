const SPACE = "  ";

function tokenizer(code) {
  const whitespc = ["\r\n", "\n\r", "\n", "\r"];
  const specialChars = ["{", "}", ":", ";"];
  const specialCharsPB = ["{", "}", ";"];
  const tokens = [];
  let inBrackets = false;
  let sc = [];
  let prevChar = "\0";
  let char = "\0";
  let token = "";

  for (let i = 0; i < code.length; i++) {
    if (i !== 0) prevChar = code.charAt(i - 1);
    char = code.charAt(i);

    if (whitespc.indexOf(char) !== -1 && whitespc.indexOf(prevChar) !== -1) {
      continue;
    }

    sc = inBrackets ? specialChars : specialCharsPB;
    if (sc.indexOf(char) !== -1) {
      if (char === "{") inBrackets = true;
      if (char === "}") inBrackets = false;
      tokens.push(token);
      tokens.push(char);
      token = "";
      continue;
    }
    token += char;
  }

  if (token) tokens.push(token);

  return tokens.map((token) => token.trim()).filter((token) => token);
}

function toProperty(name) {
  return name.replace(/[^a-z0-9]([a-z0-9])?/gi, (_, nextAlphanumeric) =>
    nextAlphanumeric ? nextAlphanumeric.toUpperCase() : ""
  );
}

function toSelectors(name) {
  const names = name.split(",");
  return names.map((name) => {
    name = name.trim();
    let newName = "";
    if (name.charAt(0) === ".") {
      newName += "Class";
      name = name.slice(1);
    } else if (name.charAt(0) === "#") {
      newName += "Id";
      name = name.slice(1);
    } else {
      newName += "Element";
    }
    return (
      name.replace(/[^a-z0-9]([a-z0-9])?/gi, (_, nextAlphanumeric) =>
        nextAlphanumeric ? nextAlphanumeric.toUpperCase() : ""
      ) + newName
    );
  });
}

function convertoToJSON(tokens) {
  const items = [];
  let currentItem = null;
  let currentProp = null;
  let nextAction = readSelector;
  tokens.forEach((token) => {
    nextAction = nextAction(token);
  });
  return renderJS(items);

  function readSelector(token) {
    const selectors = toSelectors(token);
    currentItem = {
      originalValue: token,
      selectors: selectors,
      values: {},
    };
    currentProp = null;
    items.push(currentItem);
    return readOpenBracket;
  }
  function readOpenBracket(token) {
    if (token !== "{") throw new Error("expected '{' ");
    return readProperty;
  }
  function readCloseBracket(token) {
    if (token !== "}") throw new Error("expected '}' ");
    return readSelector;
  }
  function readDefinition(token) {
    if (token !== ":") throw new Error("expected ':' ");
    return readValue;
  }
  function readProperty(token) {
    if (token === "}") return readCloseBracket(token);
    const property = toProperty(token);
    currentProp = property;
    if (currentItem !== null && !currentItem.values[property]) {
      currentItem.values[property] = [];
    }
    return readDefinition;
  }
  function readValue(token) {
    if (currentItem && currentProp) {
      currentItem.values[currentProp].push(token);
    }
    return readFinal;
  }
  function readFinal(token) {
    if (token === "}") return readCloseBracket(token);
    if (token !== ";") throw new Error("expected ';' ");
    return readProperty;
  }
}

function renderJS(items) {
  const objects = ["{", items.map(renderItem).join(",\n"), "}"];
  return objects.join("\n");
}

function renderItem(item) {
  const code = [];
  let properties = [];
  for (const prop in item.values) {
    const propitem = {
      name: prop,
      value: item.values[prop][item.values[prop].length - 1],
    };
    let markup = '"';
    if (propitem.value.indexOf('"') !== -1) {
      propitem.value = propitem.value.replace(/"/gi, "'");
    }
    properties.push(
      SPACE +
        '"' +
        propitem.name +
        '"' +
        ": " +
        markup +
        propitem.value +
        markup
    );
  }
  properties = properties.map((x) => SPACE + x);
  item.selectors.forEach((selector, idx, arr) => {
    code.push(SPACE + '"' + selector + '"' + ": {");
    code.push(properties.join(",\n"));
    if (idx !== arr.length - 1) {
      code.push(SPACE + "},");
    } else {
      code.push(SPACE + "}");
    }
  });
  return code.join("\n");
}

export default function (code) {
  const tokens = tokenizer(code);
  const jsonObject = convertoToJSON(tokens);
  return JSON.parse(jsonObject);
}
