class ThemeManager {
    constructor(effects) {
        this.effects = effects;
        this.themeToggle = document.getElementById('theme-toggle');
        this.currentTheme = localStorage.getItem('theme') || 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        
        this.init();
    }
    
    init() {
        this.updateTheme(this.currentTheme);
        this.themeToggle.addEventListener('change', () => {
            const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            this.updateTheme(newTheme);
        });
    }
    
    updateTheme(theme) {
        this.currentTheme = theme;
        document.body.setAttribute('data-theme', theme);
        this.themeToggle.checked = theme === 'dark';
        localStorage.setItem('theme', theme);
        
        if (theme === 'dark') {
            this.effects.startStars();
        } else {
            this.effects.startClouds();
        }
    }
}