$(document).ready(function() {
    let baselineNodes = 0;
    let baselineMemory = 0;
    let basePercentage = 15;

    function calculateDialogComplexity(dialog) {
        const elements = dialog.find('*').length;
        const hasIframe = dialog.find('iframe').length > 0;
        const textContent = dialog.text().length;
        const hasImages = dialog.find('img').length > 0;
        
        // Calculate complexity score
        let score = 0;
        score += elements * 0.5;  // Each element adds 0.5%
        score += hasIframe ? 15 : 0;  // iframes are heavy
        score += textContent / 1000;  // Each 1000 chars add 1%
        score += hasImages ? 5 : 0;  // Images add 5%
        
        return score;
    }

    function calculateResourceUsage() {
        const resources = performance.getEntriesByType('resource');
        let score = 0;
        
        resources.forEach(resource => {
            if (resource.transferSize) {
                // Add 1% per 100KB transferred
                score += (resource.transferSize / 102400);
            }
        });
        
        return Math.round(score);
    }

    function updateMemoryUsage() {
        try {
            // Count current elements and calculate base memory
            const currentNodes = document.getElementsByTagName('*').length;
            let percentage = basePercentage;
            
            // Set baseline on first run
            if (baselineNodes === 0) {
                baselineNodes = currentNodes;
                baselineMemory = calculateResourceUsage();
            }

            // Calculate DOM growth
            const nodeDiff = currentNodes - baselineNodes;
            percentage += Math.round(nodeDiff / 30) * 2; // More granular node counting
            
            // Calculate dialog complexity
            $('.dialog').each(function() {
                percentage += calculateDialogComplexity($(this));
            });
            
            // Add resource usage
            const currentResources = calculateResourceUsage();
            percentage += currentResources - baselineMemory;
            
            // Add extra for active animations
            const activeAnimations = $(':animated').length;
            percentage += activeAnimations * 2;
            
            // Consider canvas elements if present
            $('canvas').each(function() {
                const canvas = $(this)[0];
                const contextType = canvas.getContext('2d') ? '2d' : 
                                  canvas.getContext('webgl') ? 'webgl' : null;
                if (contextType === 'webgl') {
                    percentage += 10; // WebGL contexts use more memory
                } else if (contextType === '2d') {
                    percentage += 5; // 2D contexts use less
                }
            });
            
            // Keep between 15% and 100%
            percentage = Math.max(15, Math.min(100, Math.round(percentage)));
            
            // Update display
            $('#memoryUsage').text(percentage + '%');
            
            // Add detailed tooltip
            const tooltip = `DOM Elements: ${currentNodes}\n` +
                          `Baseline Elements: ${baselineNodes}\n` +
                          `Active Dialogs: ${$('.dialog').length}\n` +
                          `Resource Score: ${currentResources}%\n` +
                          `Active Animations: ${activeAnimations}`;
            $('#memoryUsage').attr('title', tooltip);
            
        } catch (error) {
            console.error('Error:', error);
            $('#memoryUsage').text('--');
        }
    }

    // Update frequently for smoother changes
    updateMemoryUsage();
    setInterval(updateMemoryUsage, 250);

    // Update on various events that might affect memory
    $(document).on('click', '.shortcut, .close-dialog', updateMemoryUsage);
    $(document).on('animationstart animationend', updateMemoryUsage);
    $(window).on('load resize', updateMemoryUsage);
}); 