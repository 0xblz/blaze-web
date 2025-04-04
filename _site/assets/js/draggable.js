// add draggable functionality to the desktop
$(document).ready(function() {
    // Check if device is mobile/tablet
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    
    let zIndexCounter = 1000;
    
    // Keep track of open dialogs
    const openDialogs = new Map(); // key: pageTitle, value: dialog element
    
    // Only enable draggable on desktop
    if (!isMobile) {
        // Make shortcuts draggable
        $('.shortcut').draggable({
            containment: '.desktop',
            cursor: 'move',
            start: function(event, ui) {
                $(this).addClass('dragging')
                    .css('transform', 'scale(0.9)');
            },
            stop: function(event, ui) {
                var $shortcut = $(this);
                $shortcut.css('transform', '');
                setTimeout(function() {
                    $shortcut.removeClass('dragging');
                }, 10);
            }
        });

        // Make all dialogs draggable by default
        $(document).on('mousedown', '.dialog', function() {
            $(this).css('z-index', ++zIndexCounter);
        });

        // Initialize SoundCloud player draggable
        function initSoundCloudDraggable() {
            const player = $('#soundcloudPlayer');
            if (player.length) {
                player.draggable({
                    containment: 'window',
                    cursor: 'move',
                    handle: '.soundcloud-handle', // Add a handle to prevent iframe issues
                    start: function(event, ui) {
                        $(this).css('z-index', ++zIndexCounter);
                    }
                });

                // Bring player to front when clicked
                player.on('mousedown', function() {
                    $(this).css('z-index', ++zIndexCounter);
                });
            }
        }

        // Try to initialize immediately
        initSoundCloudDraggable();

        // Also try again after a short delay to ensure player is loaded
        setTimeout(initSoundCloudDraggable, 1000);
    }

    // Handle internal page links
    $('a[data-internal-page]').off('click').on('click', function(e) {
        e.preventDefault();
        // Prevent body scrolling when dialog opens
        $('body').css('overflow', 'hidden');
        
        const pageUrl = $(this).attr('href');
        const pageTitle = $(this).attr('data-page-title');
        
        // Check if dialog is already open
        if (openDialogs.has(pageTitle)) {
            const existingDialog = openDialogs.get(pageTitle);
            existingDialog.css('z-index', ++zIndexCounter);
            return;
        }

        // Load content based on file extension
        if (pageUrl.endsWith('.txt')) {
            $.get(pageUrl, function(content) {
                createDialog(pageTitle, content, pageUrl);
            });
        } else {
            createDialog(pageTitle, '<iframe src="' + pageUrl + '" frameborder="0"></iframe>', pageUrl);
        }
    });
    
    function createDialog(pageTitle, content, pageUrl) {
        // Create and append dialog
        const dialog = $('<div class="dialog internal-page-dialog"' + 
            (pageUrl.endsWith('.txt') ? ' data-page="txt"' : '') + '>' +
            '<div class="dialog-header">' +
            '<h5 class="typing-text" data-text="<i class=\'fa-solid fa-file-lines\'></i> ' + pageTitle + '"></h5>' +
            '<button class="close-dialog"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<div class="dialog-content">' +
            (pageUrl.endsWith('.txt') ? '<h4>' + content + '</h4>' : content) +
            '</div>' +
            '</div>');
        
        // Add dialog to body and store reference
        $('body').append(dialog);
        openDialogs.set(pageTitle, dialog);
        
        // Set initial z-index
        dialog.css('z-index', ++zIndexCounter);

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
        
        // Only set max dimensions for txt files
        if (pageUrl.endsWith('.txt')) {
            if (isMobile) {
                dialog.css({
                    'max-width': '100%',
                    'max-height': '100%'
                });
            } else {
                dialog.css({
                    'max-width': '540px',
                    'max-height': '420px',
                    'height': '420px'
                });
            }
            
            // Add scrolling to dialog content for txt files
            dialog.find('.dialog-content').css({
                'overflow-y': 'auto',
                'height': '100%'
            });
        }

        // Center all dialogs
        dialog.css({
            'left': (windowWidth - dialog.outerWidth()) / 2,
            'top': (windowHeight - dialog.outerHeight()) / 2
        });

        // Make draggable
        if (!isMobile) {
            dialog.draggable({
                cursor: 'move',
                cancel: '.close-dialog, iframe', // Prevent dragging from close button and iframe
                start: function(event, ui) {
                    $(this).css('z-index', ++zIndexCounter);
                }
            });
        }
    }

    // Handle dialog close
    $(document).on('click', '.close-dialog', function() {
        // Re-enable body scrolling when dialog closes
        $('body').css('overflow', '');
        const dialog = $(this).closest('.dialog');
        const pageTitle = dialog.find('.typing-text').data('text').match(/> (.*?)$/)[1];
        openDialogs.delete(pageTitle);
        dialog.remove();
    });

    // Prevent native drag only on images and links
    $('.shortcut img, .shortcut a').on('dragstart', function(e) {
        e.preventDefault();
    });
});