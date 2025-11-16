// ==== ./src/app.js ====
import $ from 'jquery';
import { loadAccounts } from './dataManager.js';
import { displayTokens } from './ui/tokens.js';
import { showPasskeyPopup, updatePasskeyLabel } from './ui/popups.js';
import { setupTokenFilter } from './ui/filter.js';
import { encryptAccounts } from './crypto.js';
import { downloadFile } from './fileOperations.js';
import { MESSAGES, FILE_NAMES } from './constants.js';
import './add-account.js'; // Import add-account functionality

export async function initializeApp() {
  try {
    await load2FA();
    setupEventHandlers();
    setupTokenFilter();
    setupCancelButtons();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    alert('Failed to initialize. Please refresh and try again.');
  }
}

async function load2FA() {
  try {
    const accounts = await loadAccounts();
    displayTokens(accounts);
  } catch (error) {
    console.error('Failed to load 2FA accounts:', error);
    alert('Failed to load 2FA accounts. Please try again or re-upload your secrets file.');
  }
}

function setupEventHandlers() {
  $('#export-btn').on('click', handleExport);
  $('#settings-btn').on('click', handleSettings);
  // Note: #add-btn handler is in add-account.js
}

function setupCancelButtons() {
  // Handle all cancel buttons in popups
  $('.popup .cancel').on('click', function() {
    // Find the parent popup and its corresponding overlay
    const $popup = $(this).closest('.popup');
    const popupId = $popup.attr('id');
    
    // Hide the popup and its overlay
    $popup.fadeOut();
    $(`#${popupId}-overlay`).fadeOut();
    
    // Clear any error messages in this popup
    $popup.find('.error-message').hide().text('');
  });
}

function handleSettings() {
  // TODO: Implement settings functionality
  console.log('Settings clicked');
  alert('Settings functionality coming soon!');
}

async function handleExport() {
  const originalLabel = $('#passkey-popup label').text();
  
  try {
    updatePasskeyLabel(MESSAGES.NEW_PASSKEY_LABEL);
    
    const exportPasskey = await showPasskeyPopup(p => {
      if (!p || p.trim() === '') {
        throw new Error(MESSAGES.EMPTY_PASSKEY_EXPORT);
      }
    }, true);
    
    const accounts = await loadAccounts({ passkeyForNewEncryption: exportPasskey });
    const encryptedData = encryptAccounts(accounts, exportPasskey);
    
    downloadFile(FILE_NAMES.EXPORT, encryptedData);
  } catch (error) {
    console.error('Export operation cancelled or failed:', error);
    alert(`Export cancelled or failed: ${error.message}`);
  } finally {
    updatePasskeyLabel(originalLabel);
  }
}

// Export for use in other modules
export { load2FA };
