// ==== ./src/parsers.js ====
export function parsePlaintextSecrets(textContent) {
  if (!textContent || typeof textContent !== 'string') {
    throw new Error('Input content is invalid.');
  }

  const lines = textContent.split(/\r?\n/);
  const accounts = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine === '') continue;

    const separatorIndex = trimmedLine.indexOf(':');

    if (separatorIndex <= 0) {
      throw new Error(`Invalid line format: "${trimmedLine}". Expected "name:secret".`);
    }

    const accountName = trimmedLine.substring(0, separatorIndex).trim();
    const secret = trimmedLine.substring(separatorIndex + 1).trim();

    if (secret === '') {
      throw new Error(`Invalid line format: Secret is empty for account "${accountName}".`);
    }

    accounts.push({ a: accountName, s: secret });
  }

  if (accounts.length === 0) {
    throw new Error('No valid accounts found in the file.');
  }

  return accounts;
}

export function isPlaintextFormat(content) {
  try {
    parsePlaintextSecrets(content);
    return true;
  } catch {
    return false;
  }
}
