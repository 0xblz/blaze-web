document.addEventListener('DOMContentLoaded', () => {
    // Create audio element
    const clickSound = new Audio('/assets/audio/notification.mp3');
    
    // Set volume
    clickSound.volume = 0.2;
    
    // Add click sound to all shortcuts
    const shortcuts = document.querySelectorAll('.shortcut');
    
    shortcuts.forEach(shortcut => {
        shortcut.addEventListener('click', () => {
            // Reset sound to start and play
            clickSound.currentTime = 0;
            clickSound.play().catch(error => {
                console.log('Audio playback failed:', error);
            });
        });
    });
}); 