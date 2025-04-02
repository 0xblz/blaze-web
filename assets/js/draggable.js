// add draggable functionality to the desktop
$(document).ready(function() {
    // Make shortcuts draggable
    $('.shortcut').draggable({
        containment: '.desktop',
        cursor: 'move',
        start: function(event, ui) {
            // Prevent default link behavior when dragging
            $(this).addClass('dragging');
        },
        stop: function(event, ui) {
            // Re-enable link after drag
            var $shortcut = $(this);
            setTimeout(function() {
                $shortcut.removeClass('dragging');
            }, 10);
        }
    });

    // Prevent link click during drag
    $('.shortcut').on('click', function(e) {
        if ($(this).hasClass('dragging')) {
            e.preventDefault();
        }
    });

    // Make dialog draggable
    $('.dialog').draggable({
        containment: 'window',
        cursor: 'move',
        start: function(event, ui) {
            $(this).css('z-index', 1000);
        }
    });
});