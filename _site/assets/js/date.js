$(document).ready(function() {
    function updateDateTime() {
        const now = new Date();
        
        // Format date: DD.MM.YYYY
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const formattedDate = `${day}.${month}.${year}`;
        
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