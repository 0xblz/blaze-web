let baselineMemory = 0;
let totalResourceSize = 0;

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i)) + sizes[i];
}

function calculateResourceSize() {
    const resources = performance.getEntriesByType('resource');
    let size = 0;
    resources.forEach(resource => {
        if (resource.transferSize) {
            size += resource.transferSize;
        }
    });
    return size;
}

function updateMemoryUsage() {
    try {
        // Count DOM elements
        const domElements = document.getElementsByTagName('*').length;
        
        // Count active dialogs
        const activeDialogs = $('.dialog').length;
        
        // Count loaded resources
        const resources = performance.getEntriesByType('resource').length;
        
        // Calculate a percentage based on these metrics
        // Base max on reasonable estimates: 1000 DOM elements, 5 dialogs, 50 resources
        const maxElements = 1000;
        const maxDialogs = 5;
        const maxResources = 50;
        
        const elementScore = (domElements / maxElements) * 50; // 50% weight
        const dialogScore = (activeDialogs / maxDialogs) * 30;  // 30% weight
        const resourceScore = (resources / maxResources) * 20;  // 20% weight
        
        let percentage = Math.round(elementScore + dialogScore + resourceScore);
        percentage = Math.min(Math.max(percentage, 1), 100); // Keep between 1-100
        
        // Update display
        $('#memoryUsage').text(`${percentage}%`);
        
        // Add tooltip with details
        const tooltip = `DOM Elements: ${domElements}\nActive Dialogs: ${activeDialogs}\nLoaded Resources: ${resources}`;
        $('#memoryUsage').attr('title', tooltip);

    } catch (error) {
        console.error('Error measuring usage:', error);
        $('#memoryUsage').text('--');
    }
}

// Update frequently to catch changes
$(document).ready(function() {
    // Initial update
    updateMemoryUsage();
    
    // Regular updates
    setInterval(updateMemoryUsage, 500);
    
    // Update on dialog events
    $(document).on('click', '.shortcut, .close-dialog', function() {
        setTimeout(updateMemoryUsage, 100);
    });
}); 