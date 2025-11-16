// ==== ./src/ui/filter.js ====
import $ from 'jquery';

export function setupTokenFilter() {
  $('#filter').on('input', handleFilterInput);
}

function handleFilterInput() {
  const filterValue = $(this).val().toLowerCase();
  filterTokens(filterValue);
}

function filterTokens(filterValue) {
  $('.token').each(function() {
    const $token = $(this);
    const tokenName = $token.find('.token-name').text().toLowerCase();
    
    if (tokenName.startsWith(filterValue)) {
      $token.show();
    } else {
      $token.hide();
    }
  });
}

export function clearFilter() {
  $('#filter').val('');
  $('.token').show();
}
