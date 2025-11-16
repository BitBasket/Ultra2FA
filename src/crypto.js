// ==== ./src/crypto.js ====
import CryptoJS from 'crypto-js';

export function encrypt(text, secretKey) {
  const encrypted = CryptoJS.AES.encrypt(text, secretKey).toString();
  console.log('Data encrypted successfully');
  return encrypted;
}

export function decrypt(encrypted, secretKey) {
  const decrypted = CryptoJS.AES.decrypt(encrypted, secretKey)
    .toString(CryptoJS.enc.Utf8);
  
  if (!decrypted) {
    throw new Error('Decryption resulted in empty data.');
  }
  
  return decrypted;
}

export function encryptAccounts(accounts, passkey) {
  return encrypt(JSON.stringify(accounts), passkey);
}

export function decryptAccounts(encryptedData, passkey) {
  const decryptedData = decrypt(encryptedData, passkey);
  return JSON.parse(decryptedData);
}
