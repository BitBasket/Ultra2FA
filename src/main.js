// Import jQuery from node_modules
import $ from 'jquery';

$(function () {
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

