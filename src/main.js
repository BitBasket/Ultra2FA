// Import jQuery from node_modules
import $ from 'jquery';
import * as TwoFA from './2fa.js';

$(function () {
    TwoFA.load2FA();

    $('#filter').on('input', function() {
        const filterValue = $(this).val().toLowerCase();

        $('.token').each(function() {
            var tokenName = $(this).find('.token-name').text().toLowerCase();

            if (tokenName.startsWith(filterValue)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });
});

$('.popup .cancel').on('click', function() {
    $('.overlay').fadeOut();
    $('.popup').fadeOut();
    $('.error-message').hide(); // Hide error message
});
