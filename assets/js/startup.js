document.addEventListener('DOMContentLoaded', () => {
    // Create and configure audio element
    const clickSound = new Audio('/assets/audio/notification.mp3');
    clickSound.volume = 0.2;
    
    // Function to play sound
    const playClickSound = (event) => {
        // Create a new audio instance each time to avoid conflicts
        const sound = new Audio('/assets/audio/notification.mp3');
        sound.volume = 0.2;
        sound.play().catch(error => {
            console.log('Audio playback failed:', error);
        });
    };

    // Use event delegation on the desktop container for better performance and reliability
    const desktop = document.querySelector('.desktop');
    if (desktop) {
        desktop.addEventListener('click', (event) => {
            // Check if clicked element or its parent is a shortcut
            const shortcut = event.target.closest('.shortcut');
            if (shortcut) {
                playClickSound();
            }
        });
    }
}); 