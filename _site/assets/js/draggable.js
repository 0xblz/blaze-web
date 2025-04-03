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
        const dialog = $('<div class="dialog internal-page-dialog"' + 
            (pageTitle === 'about.txt' ? ' data-page="about.txt"' : '') + '>' +
            '<div class="dialog-header">' +
            '<h5 class="typing-text" data-text="<i class=\'fa-solid fa-file-lines\'></i> ' + pageTitle + '"></h5>' +
            '<button class="close-dialog"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<div class="dialog-content">' +
            (pageTitle === 'about.txt' ? 
                '<h4>' +
                'I collaborate with innovative companies to design and build creative digital experiences. ' +
                'At <a href="https://x.com/prtyDAO" target="_blank">PartyDAO</a> (2022–present), I\'ve contributed to the design of <a href="https://party.app" target="_blank">party.app</a> and <a href="https://world.org/ecosystem" target="_blank">World</a> apps, shaping engaging and user-friendly products.' +
                '<hr>' +
                'Previously, I was the founding designer at <a href="https://www.crunchbase.com/organization/showtime-732e" target="_blank">Showtime</a> (2021–2022), leading the product design direction. In 2021, I also collaborated with <a href="https://workos.com" target="_blank">WorkOS</a>, creating compelling marketing graphics and visual materials.' +
                '<hr>' +
                'From 2015–2017, I worked at <a href="https://bitovi.com" target="_blank">Bitovi</a>, delivering major web projects for brands including <a href="https://lowes.com" target="_blank">Lowe\'s</a> and <a href="https://levi.com" target="_blank">Levi\'s</a>. ' +
                'Prior to this, between 2013–2017, I pursued experimental 3D projects as a freelance designer, including work in space and weather-related visualizations. ' +
                'Early in my career at <a href="https://scribd.com" target="_blank">Scribd</a> (2010–2012), I focused on designing and enhancing their core website.' +
                '<hr>' +
                'I\'m currently experimenting with AI, weather visualizations, and 3D tools to make complex data more intuitive and engaging.' +
                '</h4>' :
                '<iframe src="' + pageUrl + '" frameborder="0"></iframe>'
            ) +
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

    // Prevent native drag only on images and links
    $('.shortcut img, .shortcut a').on('dragstart', function(e) {
        e.preventDefault();
    });
});