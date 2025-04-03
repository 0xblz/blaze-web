$(document).ready(function() {
    function updateWifiStatus() {
        const wifiIcon = $('#wifiStatus');
        
        if (navigator.onLine) {
            wifiIcon.css('opacity', '1');
            wifiIcon.attr('title', 'Connected');
        } else {
            wifiIcon.css('opacity', '0.4');
            wifiIcon.attr('title', 'Disconnected');
        }
    }

    // Initial check
    updateWifiStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateWifiStatus);
    window.addEventListener('offline', updateWifiStatus);

    // Check periodically (some browsers don't fire events reliably)
    setInterval(updateWifiStatus, 1000);
}); 