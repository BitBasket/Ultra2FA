import $ from 'jquery';

let rowCount = 1;

// Function to show the Add Account popup
function showAddAccountPopup() {
    $('#add-account-popup-overlay').fadeIn();
    $('#add-account-popup').fadeIn();
}

// Handle Add button click to show popup
$('#add-btn').on('click', function() {
    showAddAccountPopup();
});

// Handle Cancel button click to hide popup
$('#cancel-account').on('click', function() {
    hidePopup();
});

// Handle form submission
$('#add-account-form').on('submit', function(event) {
    event.preventDefault();
    let valid = true;

    // Loop through each row to validate inputs
    $('#add-account-form .input-row').each(function() {
        const accountValue = $(this).find('input[name="account[]"]').val().trim();
        const secretValue = $(this).find('input[name="secret[]"]').val().trim();

        if (accountValue === '' && secretValue === '') {
            // Ignore blank rows
            return true;
        } else if (accountValue === '' || secretValue === '') {
            valid = false;
            $('#error-message').text('Both Account and Secret fields are required for each entry.').show();
            return false;
        }
    });

    if (valid) {
        $('#error-message').hide();
        hideAddAccountPopup();
        // Process the form data here
        console.log('Form submitted successfully.');
    }
});

// Handle Add Row button click
$('#add-row-btn').on('click', function() {
    rowCount++;
    const newRow = `
        <div class="input-row">
            <input type="text" name="account[]" placeholder="Account ${rowCount}">
            <input type="text" name="secret[]" placeholder="Secret ${rowCount}">
        </div>
    `;
    $('#additional-rows').append(newRow);

    // Move the Add Row button below the newly added row
    $('#add-row-btn').appendTo('#additional-rows');
}); 