// add draggable functionality to the desktop
$(document).ready(function() {
    // Check if device is mobile/tablet
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    
    // Only enable draggable on desktop
    if (!isMobile) {
        // Make shortcuts draggable
        $('.shortcut').draggable({
            containment: '.desktop',
            cursor: 'move',
            start: function(event, ui) {
                $(this).addClass('dragging');
            },
            stop: function(event, ui) {
                var $shortcut = $(this);
                setTimeout(function() {
                    $shortcut.removeClass('dragging');
                }, 10);
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
    }

    // Handle internal page links
    $('a[data-internal-page]').on('click', function(e) {
        e.preventDefault();
        const pageUrl = $(this).attr('href');
        const pageTitle = $(this).attr('data-page-title');
        
        // Create and append dialog
        const dialog = $('<div class="dialog internal-page-dialog">' +
            '<div class="dialog-header">' +
            '<h5 class="typing-text" data-text="<i class=\'fa-solid fa-floppy-disk\'></i> ' + pageTitle + '"></h5>' +
            '<button class="close-dialog"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<div class="dialog-content">' +
            '<iframe src="' + pageUrl + '" frameborder="0"></iframe>' +
            '</div>' +
            '</div>');
        
        // Add dialog to body and position it
        $('body').append(dialog);

        // Initialize typing animation
        const $typingText = dialog.find('.typing-text');
        const text = $typingText.data('text');
        let i = 0;
        $typingText.html('');
        
        function typeWriter() {
            if (i < text.length) {
                $typingText.html(text.substring(0, i + 1));
                i++;
                setTimeout(typeWriter, 50);
            }
        }
        
        typeWriter();
        
        // Center the dialog initially
        const windowWidth = $(window).width();
        const windowHeight = $(window).height();
        dialog.css({
            left: (windowWidth - dialog.outerWidth()) / 2,
            top: (windowHeight - dialog.outerHeight()) / 2
        });

        // Make draggable
        if (!isMobile) {
            dialog.draggable({
                containment: 'window',
                cursor: 'move',
                cancel: '.close-dialog, iframe', // Prevent dragging from close button and iframe
                start: function(event, ui) {
                    $(this).css('z-index', 9999);
                }
            });
        }
    });
    
    // Handle dialog close
    $(document).on('click', '.close-dialog', function() {
        $(this).closest('.dialog').remove();
    });

    // Prevent link click during drag
    $('.shortcut').on('click', function(e) {
        if ($(this).hasClass('dragging')) {
            e.preventDefault();
        }
    });
});