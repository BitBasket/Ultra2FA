import CryptoJS, { enc } from 'crypto-js';
import $ from 'jquery';
import * as otplib from 'otplib';

function generateOTPCode(secret)
{
    return otplib.authenticator.generate(secret);
}

function load2FA()
{
    download2FA().forEach((account) => {
        const token = generateOTPCode(account.s);

        const tokenDiv  = $('<div class="token"></div>');
        const tokenName = $('<span class="token-name"></span>').text(account.a);
        const tokenCode = $('<span class="token-code"></span>').text(token);
        tokenDiv.append(tokenName).append(tokenCode);

        $('.token-container').append(tokenDiv);
    });
}

function download2FA()
{
    let encrypted2FAData = localStorage.getItem('Ultra2FA.encrypted-data');
    if (!encrypted2FAData) {
        encrypted2FAData = 'U2FsdGVkX1+wKbXcRa4NkpedSum+gc7vmfujLDNCiqdgJ4V2itOF09xYyD1W7NUIoIBhoyuB3SKS6EWRujB2yl4FNk6SUQXRuresjPCw5fyZdt6kUh0InAAsSApvGuhz3z29nN5qEPLUSNG3p7QslAg7+Q/8S6mieYqnOnRA+bwfW5jYOhDVKX2pl9N+ntR8zn4JUNG4KOF8Xp8rtpSlMAicllSKf76iusB4M5i6LIh50DQnj53S9qva4/PA3fZhHRoey5tcAF0FjBhjQhb+e1TR3fPn3JXFVSX7mKpzVI74B9zMuk3EO1gwvQKGWfFF6U4bznC07xv9DuvSTrzEVzkZVFMEfvWk4aMH9iWzEYeXYViBZTRiYZ/tEFYPMucwrm3qTM0KCeXqNMius/wDhBjBiNQZMRuWALPefLhzhh0Qu2qTXpSioAf5iNIA3ocfbJBaea3JvVKh0qEFwK4hK9zVaL10dpitGz38VClguRFraUbk1J/LhTn5lRjregOAf9QRrlmVKYJUHZASyeqQ2ntzclmAUbhhdNfIzIU672XSZmxSJWzDtPD1Y53fx8MGQ8Wsh7aIO1r/5lIvDv9waeClQQqwqz9saCofPPvWj5E=';
        // showFileUploadPopup(() => {
        //     alert('File has been downloaded.');
        // });
    }

    showPasskeyPopup(passkey => {
        import2FA(encrypted2FAData, passkey);
    });

    return [
        { "a": "aa", "s":"AAAAAAAAAAAAAAAAA" },
        { "a": "bb", "s":"IIIIIIIIIIIIIIIIIIIIIIIII" },
        { "a": "eth (user)",  "s":"BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB" },
        { "a": "101domain", "s":"CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC" },     
        { "a": "GitHub.com (username)", "s":"DDDDDDDDDDDDDDDD" },
        { "a": "ethcrash (Eg5G7yeEmC)", "s":"KJIWCVS3KBEFQXSVKQUHAMDGLY2HW3DDJQRTO5BQJRBUYNSGHRCA" },
        { "a": "Bitwage.com (hopeseekr@gmail.com)", "s":"L2IJCDLI4QAHBWP4" },
    ];
}

function decrypt2FA()
{

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

    return decrypted;
}

function showPasskeyPopup(callback) {
    // Check for locally-stored passkey first.
    if (sessionStorage.getItem('Ultra2FA.passkey-ttl') >= Date.now()) {
        const passkey = sessionStorage.getItem('Ultra2FA.passkey');
        if (passkey !== null) {
            callback(passkey);

            return;
        }
    // } else {
    //     $('#filter').val(sessionStorage.getItem('Ultra2FA.passkey-ttl') + ' >= ' + Date.now())
    }

    // Show the popup and overlay
    $('#passkey-popup-overlay').fadeIn();
    $('#passkey-popup').fadeIn();

    // Handle form submission
    $('#passkey-form').off('submit').on('submit', (event) => {
        event.preventDefault();

        // Get the passkey from the input field
        const passkey = $('#passkey').val();

        // Cache the passkey.
        sessionStorage.setItem('Ultra2FA.passkey-ttl', Date.now() + 7_200_000);
        sessionStorage.setItem('Ultra2FA.passkey', passkey);

        // Execute the callback function with the passkey
        callback(passkey);

        // Clear the input field (optional)
        $('#passkey').val('');

        // Hide the popup
        $('#passkey-popup').fadeOut();
        $('#passkey-popup-overlay').fadeOut();
    });

    // Close the popup when the overlay is clicked
    $('#passkey-popup-overlay').off('click').on('click', function() {
        $('#passkey-popup').fadeOut();
        $('#passkey-popup-overlay').fadeOut();
    });

    // Show the popup when the Export button is clicked
    $('#export-btn').on('click', () => {
        showPasskeyPopup(passkey => {
            const encrypted = encrypt2FA(JSON.stringify(download2FA()), passkey);
            downloadExportFile('ultra-2fa.secrets.json.aes', encrypted.toString(CryptoJS.enc.Utf8))
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

function showFileUploadPopup(callback)
{
    // Show the popup and overlay
    $('#file-upload-popup-overlay').fadeIn();
    $('#file-upload-popup').fadeIn();

    // Handle form submission
    $('#file-upload-form').off('submit').on('submit', function(event) {
        event.preventDefault();

        // Get the selected file
        const fileInput = $('#file-upload')[0];
        const file = fileInput.files[0];

        // Check if a file was selected and if it has the correct .aes extension
        if (file && file.name.endsWith('.aes')) {
            // Execute the callback function with the file

            // Read the file contents
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const fileContent = event.target.result;
                    callback(fileContent); // Call the success callback with the file content
                    $('#fileUploadPopup').remove(); // Remove popup after successful upload
                } catch (error) {
                    alert("Error reading the file.");
                    throw new Error("File reading failed.");
                }
            };

            reader.onerror = function() {
                alert("Error reading the file.");
                throw new Error("File reading failed.");
            };

            reader.readAsText(file);

            // Clear the file input field (optional)
            fileInput.value = '';

            // Hide the popup
            $('#file-upload-popup').fadeOut();
            $('#file-upload-popup-overlay').fadeOut();
        } else {
            alert('Please select a valid .aes file.');
        }
    });

    // Close the popup when the overlay is clicked
    $('#file-upload-popup-overlay').off('click').on('click', function() {
        $('#file-upload-popup').fadeOut();
        $('#file-upload-popup-overlay').fadeOut();
    });
}

export { 
    import2FA, download2FA, load2FA, 
    decrypt2FA, encrypt2FA,
};
