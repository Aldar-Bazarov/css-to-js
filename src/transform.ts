const SPACE = "  ";

interface Item {
  originalValue: string;
  selectors: string[];
  values: { [key: string]: string[] };
}

function tokenizer(code: string) {
  const whitespc = ["\r\n", "\n\r", "\n", "\r"];
  const specialChars = ["{", "}", ":", ";"];
  const specialCharsPB = ["{", "}", ";"];
  const tokens: string[] = [];
  let inBrackets = false;
  let sc: string[] = [];
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

function renderJS(items: Item[]) {
  const objects = ["{", items.map(renderItem).join(",\n"), "}"];
  return objects.join("\n");
}

function renderItem(item: Item) {
  const code: string[] = [];
  let properties: string[] = [];
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
  item.selectors.forEach((selector) => {
    code.push(SPACE + '"' + selector + '"' + ": {");
    code.push(properties.join(",\n"));
    code.push(SPACE + "}");
  });
  return code.join("\n");
}

function convertoToJSON(tokens: string[]) {
  const items: Item[] = [];
  let currentItem: Item | null = null;
  let currentProp: string | null = null;
  let nextAction = readSelector;
  tokens.forEach((token) => {
    nextAction = nextAction(token);
  });
  return renderJS(items);

  function readSelector(token: string) {
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
  function readOpenBracket(token: string) {
    if (token !== "{") throw new Error("expected '{' ");
    return readProperty;
  }
  function readCloseBracket(token: string) {
    if (token !== "}") throw new Error("expected '}' ");
    return readSelector;
  }
  function readDefinition(token: string) {
    if (token !== ":") throw new Error("expected ':' ");
    return readValue;
  }
  function readProperty(token: string) {
    if (token === "}") return readCloseBracket(token);
    const property = toProperty(token);
    currentProp = property;
    if (currentItem !== null && !currentItem.values[property]) {
      currentItem.values[property] = [];
    }
    return readDefinition;
  }
  function readValue(token: string) {
    if (currentItem && currentProp) {
      currentItem.values[currentProp].push(token);
    }
    return readFinal;
  }
  function readFinal(token: string) {
    if (token === "}") return readCloseBracket(token);
    if (token !== ";") throw new Error("expected ';' ");
    return readProperty;
  }
}

function toProperty(name: string) {
  return name.replace(/[^a-z0-9]([a-z0-9])?/gi, (_, nextAlphanumeric) =>
    nextAlphanumeric ? nextAlphanumeric.toUpperCase() : ""
  );
}

function toSelectors(name: string) {
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

export default function (code: string) {
  const tokens = tokenizer(code);
  const jsonObject = convertoToJSON(tokens);
  return JSON.parse(jsonObject);
}
