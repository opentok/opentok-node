$(document).ready(function() {
    $('a').click(function() {
        var sessionId = $(this).parent().data('sessionid');
        var connectionId = $(this).parent().data('connectionid');

        $.post($(this).attr('href'), { sessionId: sessionId, connectionId: connectionId });

        return false;
    });
});