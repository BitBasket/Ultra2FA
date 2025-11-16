// ==== ./src/2fa.js ====
import CryptoJS, { enc } from 'crypto-js';
import $ from 'jquery';
import * as otplib from 'otplib';

// Show the popup when the Export button is clicked
$('#export-btn').on('click', async () => {
    // Always ask for a new passkey.
    const $passkeyLabel = $('#passkey-popup label');
    const originalPasskeyLabelText = $passkeyLabel.text();
    $passkeyLabel.text('Enter your new passkey');

    try {
        // Await the passkey from the popup for export.
        const exportPasskey = await showPasskeyPopup(p => {
            if (!p || p.trim() === '') {
                throw new Error("Passkey cannot be empty for export.");
            }
        }, true); // `getNewPasskey = true` to force new input.

        // Now, download the existing 2FA accounts.
        // If localStorage is empty and a plaintext file is uploaded,
        // it will reuse the `exportPasskey` to encrypt for local storage.
        const accounts = await download2FA({ passkeyForNewEncryption: exportPasskey }); // Modified call

        // Encrypt the accounts with the *newly provided export passkey*
        const encrypted2FAData = encrypt2FA(JSON.stringify(accounts), exportPasskey);
        downloadExportFile('ultra-2fa.secrets.json.aes', encrypted2FAData);

    } catch (error) {
        console.error("Export operation cancelled or failed:", error);
        alert("Export cancelled or failed: " + error.message);
    } finally {
        $passkeyLabel.text(originalPasskeyLabelText);
    }
});

function generateOTPCode(secret)
{
    return otplib.authenticator.generate(secret);
}

async function load2FA()
{
    try {
        const accounts = await download2FA();
        // Clear existing tokens before adding new ones, to prevent duplicates on re-load
        $('.token-container').empty();
        accounts.forEach((account) => {
            const token = generateOTPCode(account.s);

            const tokenDiv  = $('<div class="token"></div>');
            const tokenName = $('<span class="token-name"></span>').text(account.a);
            const tokenCode = $('<span class="token-code"></span>').text(token);
            tokenDiv.append(tokenName).append(tokenCode);

            $('.token-container').append(tokenDiv);
        });
    } catch (error) {
        console.error("Failed to load 2FA accounts:", error);
        alert("Failed to load 2FA accounts. Please try again or re-upload your secrets file.");
        // If initial load fails completely (e.g. user dismisses file upload or passkey repeatedly),
        // we might want to clear local storage again, or show a more persistent error state.
    }
}

// Make download2FA an async function that returns the accounts
async function download2FA(options = {}) // Modified signature
{
    // Destructure the options. We'll check if `passkeyForNewEncryption` is provided.
    const { passkeyForNewEncryption = null } = options;

    let encrypted2FAData = localStorage.getItem('Ultra2FA.encrypted-data');

    // If no encrypted data is found, prompt for file upload
    if (encrypted2FAData === null) {
        try {
            const fileContent = await showFileUploadPopup();

            try {
                // Attempt to parse as our plaintext format first.
                // This will throw an error if the format is wrong.
                const plaintextAccounts = parsePlaintextSecrets(fileContent);
                console.log("Plaintext secrets file detected.");

                let passkeyToUseForLocalStorage;

                if (passkeyForNewEncryption) {
                    // If a passkey was provided (e.g., from an export operation), use it.
                    console.log("Using provided passkey for local storage encryption from context.");
                    passkeyToUseForLocalStorage = passkeyForNewEncryption;
                } else {
                    // Otherwise, prompt the user for a new passkey to encrypt for local storage.
                    console.log("Prompting for NEW passkey to encrypt secrets for local storage.");
                    const $passkeyLabel = $('#passkey-popup label');
                    const originalPasskeyLabelText = $passkeyLabel.text();
                    $passkeyLabel.text('Enter a new passkey to encrypt your secrets');

                    try {
                        passkeyToUseForLocalStorage = await showPasskeyPopup(p => {
                            if (!p || p.trim() === '') {
                                throw new Error("Passkey cannot be empty.");
                            }
                        }, true); // `getNewPasskey = true` to force new input
                    } finally {
                        $passkeyLabel.text(originalPasskeyLabelText);
                    }
                }

                // Encrypt the plaintext data (converted back to JSON for internal storage)
                const newlyEncryptedData = encrypt2FA(JSON.stringify(plaintextAccounts), passkeyToUseForLocalStorage);
                localStorage.setItem('Ultra2FA.encrypted-data', newlyEncryptedData);

                // Since we have the accounts, we can return them directly.
                return plaintextAccounts;

            } catch (parsingError) {
                // parsePlaintextSecrets failed, so we assume it's the encrypted format.
                console.log("File is not in 'name:secret' format, assuming encrypted:", parsingError.message);
                encrypted2FAData = fileContent;
                // Store indefinitely in localStorage after successful upload
                localStorage.setItem('Ultra2FA.encrypted-data', encrypted2FAData);
                // The rest of the function will now proceed to decrypt this data.
            }

        } catch (error) {
            // If file upload is dismissed or fails, we cannot proceed.
            throw new Error("File upload required to proceed: ".concat(error.message));
        }
    }

    let accounts;
    try {
        // Await the passkey from the popup. The callback will handle decryption/parsing.
        await showPasskeyPopup(p => {
            try {
                const data = import2FA(encrypted2FAData, p);
                accounts = JSON.parse(data); // Assigns to accounts from outer scope
            } catch (e) {
                throw new Error("Invalid passkey / encrypted data."); // This error is caught by showPasskeyPopup's internal catch
            }
        });

        // If we reach here, accounts have been successfully loaded and parsed.
        return accounts;
    } catch (e) {
        // This catch block handles rejections from showPasskeyPopup (dismissal or failure)

        // Invalidate any cached passkey, as it failed or was dismissed.
        sessionStorage.removeItem('Ultra2FA.passkey');
        sessionStorage.removeItem('Ultra2FA.passkey-ttl');

        // Check if the dismissal happened after an incorrect attempt for existing data
        if (e.message === "Passkey entry dismissed after incorrect attempt." && localStorage.getItem('Ultra2FA.encrypted-data') !== null) {
            // Remove the problematic encrypted data from localStorage
            localStorage.removeItem('Ultra2FA.encrypted-data');
            // Recursively call download2FA, which will now trigger showFileUploadPopup
            return await download2FA();
        } else {
            // For other errors (e.g., general dismissal), re-throw
            throw e;
        }
    }
}

/**
 * Parses a multi-line, colon-separated string of 2FA secrets.
 * Each line should be in the format "Account Name:SECRETKEY".
 * @param {string} textContent The raw text from the imported file.
 * @returns {Array<{a: string, s: string}>} An array of account objects.
 * @throws {Error} If the content is invalid or contains no valid accounts.
 */
function parsePlaintextSecrets(textContent) {
    if (!textContent || typeof textContent !== 'string') {
        throw new Error("Input content is invalid.");
    }

    const lines = textContent.split(/\r?\n/); // Handles both Windows and Unix line endings
    const accounts = [];

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine === '') {
            return; // Skip empty lines
        }

        const separatorIndex = trimmedLine.indexOf(':');

        // A valid line must have a name (length > 0) and a secret.
        // So the separator can't be at the beginning or be missing.
        if (separatorIndex <= 0) {
            // This line is malformed, so we assume the whole file is not our plaintext format.
            throw new Error(`Invalid line format: "${trimmedLine}". Expected "name:secret".`);
        }

        const accountName = trimmedLine.substring(0, separatorIndex).trim();
        const secret = trimmedLine.substring(separatorIndex + 1).trim();

        if (secret === '') {
            throw new Error(`Invalid line format: Secret is empty for account "${accountName}".`);
        }

        accounts.push({ a: accountName, s: secret });
    });

    if (accounts.length === 0) {
        throw new Error("No valid accounts found in the file.");
    }

    return accounts;
}

function encrypt2FA(text, secretKey)
{
    // Encrypt the JSON string using AES-256
    const encrypted = CryptoJS.AES.encrypt(text, secretKey).toString();
    console.log(encrypted);
    return encrypted;
}

function import2FA(encrypted, secretKey)
{
    const decrypted = CryptoJS.AES.decrypt(encrypted, secretKey).toString(CryptoJS.enc.Utf8);
    // If decryption fails, toString(Utf8) might return an empty string or throw depending on CryptoJS version/error handling.
    // It's safer to ensure non-empty before JSON.parse.
    if (!decrypted) {
        throw new Error("Decryption resulted in empty data.");
    }
    return decrypted;
}

function cachePasskey(passkey)
{
    // Cache the passkey. TTL is 2 hours.
    sessionStorage.setItem('Ultra2FA.passkey-ttl', Date.now() + 7_200_000);
    sessionStorage.setItem('Ultra2FA.passkey', passkey);
}

/**
 * Shows the passkey entry popup and returns a Promise.
 * The promise resolves with the passkey on success, or rejects on dismissal/failure.
 * @param {function(string): void} decryptAndValidateCallback - A function that attempts decryption/validation. It should throw on failure.
 * @param {boolean} getNewPasskey - If true, always show the popup, ignoring cached passkey.
 * @returns {Promise<string>} A promise that resolves with the passkey or rejects with an Error.
 */
function showPasskeyPopup(decryptAndValidateCallback, getNewPasskey = false) {
    return new Promise((resolve, reject) => {
        const $passkeyPopup = $('#passkey-popup');
        const $passkeyPopupOverlay = $('#passkey-popup-overlay');
        const $passkeyInput = $('#passkey');
        const $errorMessage = $('.error-message');
        const $passkeyForm = $('#passkey-form'); // Reference the form

        // Reset state
        $errorMessage.text('').css('visibility', 'hidden');
        $passkeyInput.val('');

        let incorrectPasskeyAttempted = false; // Flag to track if error message was shown

        // Attempt cached passkey first if not explicitly asking for a new one
        if (getNewPasskey === false && sessionStorage.getItem('Ultra2FA.passkey-ttl') >= Date.now()) {
            const cachedPasskey = sessionStorage.getItem('Ultra2FA.passkey');
            if (cachedPasskey !== null) {
                try {
                    decryptAndValidateCallback(cachedPasskey); // Try with cached passkey
                    cachePasskey(cachedPasskey); // Re-cache to update TTL if successful
                    resolve(cachedPasskey); // Resolve if cached passkey works
                    return; // Exit, no need to show popup
                } catch (e) {
                    // Cached passkey failed, proceed to show popup and ask for new one.
                    // This is not an "incorrect passkey" visible error yet, so `incorrectPasskeyAttempted` remains false.
                    console.warn("Cached passkey invalid or expired, prompting for new.", e);
                    // Fall through to show the actual popup
                }
            }
        }

        // Show the popup
        $passkeyPopupOverlay.fadeIn();
        $passkeyPopup.fadeIn();
        $passkeyInput.trigger('focus');

        // Handle form submission
        $passkeyForm.off('submit').on('submit', (event) => { // Bind to the form for submission
            event.preventDefault();
            const enteredPasskey = $passkeyInput.val();

            try {
                decryptAndValidateCallback(enteredPasskey); // Attempt decryption/validation
                cachePasskey(enteredPasskey); // Cache the *correct* passkey
                // On success, close popup and resolve
                $passkeyInput.val('');
                $errorMessage.text('').css('visibility', 'hidden');
                $passkeyPopup.fadeOut();
                $passkeyPopupOverlay.fadeOut();
                resolve(enteredPasskey);
            } catch (e) {
                // On failure, display error and keep popup open
                $errorMessage.text(e.message || 'Incorrect passkey.').css('visibility', 'visible'); // Use error message from callback
                incorrectPasskeyAttempted = true; // Mark that an incorrect attempt happened
            }
        });

        // Handle popup closing (overlay click)
        $passkeyPopupOverlay.off('click').on('click', () => {
            $passkeyPopup.fadeOut();
            $passkeyPopupOverlay.fadeOut();
            // Reject if the popup was closed after an incorrect attempt,
            // otherwise, a general dismissal error.
            if (incorrectPasskeyAttempted) {
                reject(new Error("Passkey entry dismissed after incorrect attempt."));
            } else {
                reject(new Error("Passkey entry dismissed by user."));
            }
        });
    });
}

function downloadExportFile(filename, text) {
    var blob = new Blob([text], { type: 'text/plain' });
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Shows the file upload popup and returns a Promise.
 * The promise resolves with the file content on successful upload, or rejects on dismissal/failure.
 * @returns {Promise<string>} A promise that resolves with the file content as text.
 */
function showFileUploadPopup()
{
    return new Promise((resolve, reject) => {
        const $fileUploadPopup = $('#file-upload-popup');
        const $fileUploadPopupOverlay = $('#file-upload-popup-overlay');
        const $fileInput = $('#file-upload');
        const $fileUploadForm = $('#file-upload-form');

        // Show the popup and overlay
        $fileUploadPopupOverlay.fadeIn();
        $fileUploadPopup.fadeIn();

        // Handle form submission
        $fileUploadForm.off('submit').on('submit', function(event) {
            event.preventDefault();

            const file = $fileInput[0].files[0];

            if (file) {
                const reader = new FileReader();

                reader.onload = function(event) {
                    try {
                        const fileContent = event.target.result;
                        $fileInput.val(''); // Clear file input field
                        $fileUploadPopup.fadeOut(); // Close popup
                        $fileUploadPopupOverlay.fadeOut();
                        resolve(fileContent);
                    } catch (error) {
                        // Error during processing read file content
                        alert("Error processing file: " + error.message);
                        reject(new Error("File processing failed: " + error.message));
                    }
                };

                reader.onerror = function() {
                    alert("Error reading file.");
                    reject(new Error("File reading failed."));
                };

                reader.readAsText(file);
            } else {
                alert('Please select a valid .aes file.');
            }
        });

        // Close the popup when the overlay is clicked and reject the promise
        $fileUploadPopupOverlay.off('click').on('click', function() {
            $fileUploadPopup.fadeOut();
            $fileUploadPopupOverlay.fadeOut();
            reject(new Error("File upload dismissed by user."));
        });
    });
}

export {
    load2FA
};
