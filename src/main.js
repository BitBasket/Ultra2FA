// Import jQuery from node_modules
import $ from 'jquery';

import * as otplib from 'otplib';

$(function () {
    load2FA();


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
    return [
        { "a": "aa", "s":"AAAAAAAAAAAAAAAAA" },
        { "a": "bb", "s":"IIIIIIIIIIIIIIIIIIIIIIIII" },
        { "a": "eth(user)",  "s":"BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB" },
        { "a": "101domain", "s":"CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC" },     
        { "a": "GitHub.com (username)", "s":"DDDDDDDDDDDDDDDD" },
        { "a": "ethcrash (Eg5G7yeEmC)", "s":"KJIWCVS3KBEFQXSVKQUHAMDGLY2HW3DDJQRTO5BQJRBUYNSGHRCA" },
        { "a": "Bitwage.com (hopeseekr@gmail.com)", "s":"L2IJCDLI4QAHBWP4" },
    ];
}

function decrypt2FA()
{

}

function encrypt2FA()
{

}