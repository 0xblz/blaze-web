$(document).ready(function() {
    function updateDateTime() {
        const now = new Date();
        
        // Format date: Fri Apr 4
        const formattedDate = now.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        
        // Format time: 12:04 pm
        const timeOptions = { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        };
        const formattedTime = now.toLocaleTimeString('en-US', timeOptions).toLowerCase();
        
        // Update the DOM
        $('.fa-calendar-days').parent().html(
            '<i class="fa-solid fa-calendar-days"></i> ' + formattedDate
        );
        
        $('.fa-clock').parent().html(
            '<i class="fa-solid fa-clock"></i> ' + formattedTime
        );
    }

    // Update immediately and then every second
    updateDateTime();
    setInterval(updateDateTime, 1000);
}); 