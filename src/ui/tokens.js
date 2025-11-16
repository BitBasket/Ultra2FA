// ==== ./src/ui/tokens.js ====
import $ from 'jquery';
import { generateOTPCode } from '../otp.js';

export function clearTokens() {
  $('.token-wrapper').empty();
}

export function displayTokens(accounts) {
  clearTokens();
  
  accounts.forEach((account) => {
    const tokenElement = createTokenElement(account);
    $('.token-wrapper').append(tokenElement);
  });
}

function createTokenElement(account) {
  const token = generateOTPCode(account.s);
  
  const $tokenDiv = $('<div class="token"></div>');
  const $tokenName = $('<span class="token-name"></span>').text(account.a);
  const $tokenCode = $('<span class="token-code"></span>').text(token);
  
  return $tokenDiv.append($tokenName).append($tokenCode);
}

export function addTokenToDisplay(account) {
  const tokenElement = createTokenElement(account);
  $('.token-wrapper').append(tokenElement);
}
