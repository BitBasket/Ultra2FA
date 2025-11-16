// ==== ./src/dataManager.js ====
import { 
  getEncryptedData, 
  saveEncryptedData, 
  removeEncryptedData,
  clearCachedPasskey 
} from './storage.js';
import { encryptAccounts, decryptAccounts } from './crypto.js';
import { parsePlaintextSecrets, isPlaintextFormat } from './parsers.js';
import { showPasskeyPopup, showFileUploadPopup, updatePasskeyLabel } from './ui/popups.js';
import { MESSAGES } from './constants.js';

export async function loadAccounts(options = {}) {
  const { passkeyForNewEncryption = null } = options;
  let encryptedData = getEncryptedData();

  if (!encryptedData) {
    encryptedData = await handleNewDataUpload(passkeyForNewEncryption);
  }

  return await decryptExistingData(encryptedData);
}

async function handleNewDataUpload(providedPasskey) {
  const fileContent = await showFileUploadPopup();
  
  if (isPlaintextFormat(fileContent)) {
    return await handlePlaintextUpload(fileContent, providedPasskey);
  } else {
    saveEncryptedData(fileContent);
    return fileContent;
  }
}

async function handlePlaintextUpload(fileContent, providedPasskey) {
  console.log('Plaintext secrets file detected.');
  
  const accounts = parsePlaintextSecrets(fileContent);
  const passkey = providedPasskey || await getNewPasskeyForEncryption();
  
  const encryptedData = encryptAccounts(accounts, passkey);
  saveEncryptedData(encryptedData);
  
  return encryptedData;
}

async function getNewPasskeyForEncryption() {
  const originalLabel = $('#passkey-popup label').text();
  
  try {
    updatePasskeyLabel(MESSAGES.NEW_PASSKEY_ENCRYPT_LABEL);
    
    return await showPasskeyPopup(p => {
      if (!p || p.trim() === '') {
        throw new Error(MESSAGES.EMPTY_PASSKEY);
      }
    }, true);
  } finally {
    updatePasskeyLabel(originalLabel);
  }
}

async function decryptExistingData(encryptedData) {
  try {
    let accounts;
    
    await showPasskeyPopup(passkey => {
      accounts = decryptAccounts(encryptedData, passkey);
    });
    
    return accounts;
  } catch (error) {
    clearCachedPasskey();
    
    if (error.message === MESSAGES.DISMISS_AFTER_ERROR && getEncryptedData()) {
      removeEncryptedData();
      return await loadAccounts();
    }
    
    throw error;
  }
}
