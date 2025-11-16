// ==== ./src/ui/popups.js ====
import $ from 'jquery';
import { MESSAGES } from '../constants.js';
import { cachePasskey, getCachedPasskey } from '../storage.js';
import { readFileAsText } from '../fileOperations.js';

export function showPasskeyPopup(validateCallback, forceNewPasskey = false) {
  return new Promise((resolve, reject) => {
    const $popup = $('#passkey-popup');
    const $overlay = $('#passkey-popup-overlay');
    const $input = $('#passkey');
    const $error = $('#passkey-popup .error-message');
    const $form = $('#passkey-form');

    // Reset state
    resetPopupState($error, $input);

    let hasIncorrectAttempt = false;

    // Try cached passkey first
    if (!forceNewPasskey) {
      const cached = getCachedPasskey();
      if (cached) {
        try {
          validateCallback(cached);
          cachePasskey(cached);
          resolve(cached);
          return;
        } catch (e) {
          console.warn('Cached passkey invalid or expired, prompting for new.', e);
        }
      }
    }

    // Show popup
    showPopupElements($overlay, $popup, $input);

    // Handle submission
    $form.off('submit').on('submit', (event) => {
      event.preventDefault();
      const passkey = $input.val();

      try {
        validateCallback(passkey);
        cachePasskey(passkey);
        hidePopupElements($popup, $overlay, $input, $error);
        resolve(passkey);
      } catch (e) {
        showError($error, e.message || MESSAGES.INCORRECT_PASSKEY);
        hasIncorrectAttempt = true;
      }
    });

    // Handle dismissal
    $overlay.off('click').on('click', () => {
      hidePopupElements($popup, $overlay);
      const errorMsg = hasIncorrectAttempt 
        ? MESSAGES.DISMISS_AFTER_ERROR 
        : MESSAGES.DISMISS_BY_USER;
      reject(new Error(errorMsg));
    });
  });
}

export function showFileUploadPopup() {
  return new Promise((resolve, reject) => {
    const $popup = $('#file-upload-popup');
    const $overlay = $('#file-upload-popup-overlay');
    const $input = $('#file-upload');
    const $form = $('#file-upload-form');

    showPopupElements($overlay, $popup);

    $form.off('submit').on('submit', async (event) => {
      event.preventDefault();
      const file = $input[0].files[0];

      if (!file) {
        alert('Please select a valid file.');
        return;
      }

      try {
        const content = await readFileAsText(file);
        $input.val('');
        hidePopupElements($popup, $overlay);
        resolve(content);
      } catch (error) {
        alert(`Error processing file: ${error.message}`);
        reject(error);
      }
    });

    $overlay.off('click').on('click', () => {
      hidePopupElements($popup, $overlay);
      reject(new Error(MESSAGES.FILE_DISMISS));
    });
  });
}

export function updatePasskeyLabel(text) {
  $('#passkey-popup label[for="passkey"]').text(text);
}

function resetPopupState($error, $input) {
  $error.text('').css('visibility', 'hidden');
  $input.val('');
}

function showPopupElements($overlay, $popup, $focusElement = null) {
  $overlay.fadeIn();
  $popup.fadeIn();
  if ($focusElement) {
    $focusElement.trigger('focus');
  }
}

function hidePopupElements($popup, $overlay, $input = null, $error = null) {
  if ($input) $input.val('');
  if ($error) $error.text('').css('visibility', 'hidden');
  $popup.fadeOut();
  $overlay.fadeOut();
}

function showError($error, message) {
  $error.text(message).css('visibility', 'visible');
}
