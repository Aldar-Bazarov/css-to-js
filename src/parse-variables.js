const tokenizer = (code) => {
  code = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
  const whiteSpaces = ["\r\n", "\n\r", "\n", "\r", "\t", " "];
  const specialChars = [":", ";"];
  const tokens = [];
  let prevChar = "\0";
  let char = "\0";
  let token = "";

  for (let i = 0; i < code.length; i++) {
    if (i !== 0) prevChar = code.charAt(i - 1);
    char = code.charAt(i);

    if (
      whiteSpaces.indexOf(char) !== -1 &&
      whiteSpaces.indexOf(prevChar) !== -1
    ) {
      continue;
    }

    if (specialChars.indexOf(char) !== -1) {
      tokens.push(token);
      tokens.push(char);
      token = "";
      continue;
    }
    token += char;
  }

  if (token && token !== "") tokens.push(token);

  return tokens
    .map((token) => token.trim())
    .filter((token) => token !== ":" && token !== ";");
};

const convertToObject = (tokens) => {
  const items = { token: {} };
  tokens.forEach((token, idx, arr) => {
    if (idx % 2 === 0) {
      const propertyName = token.slice(1);
      items.token = { ...items.token, [propertyName]: arr[idx + 1] };
    }
  });
  return items;
};

export default (code) => convertToObject(tokenizer(code));
