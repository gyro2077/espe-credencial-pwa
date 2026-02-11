// Script para limpiar localStorage automáticamente al cargar la app
// Esto asegura que siempre se use el template del código, no uno viejo guardado

(function () {
    // Solo ejecutar en cliente
    if (typeof window === 'undefined') return;

    const STORAGE_KEY = 'credential-crop-template';
    const VERSION_KEY = 'template-version';
    const CURRENT_VERSION = '7.0'; // v7.0: DISABLED user template - forcing code templates

    const savedVersion = localStorage.getItem(VERSION_KEY);

    if (savedVersion !== CURRENT_VERSION) {
        console.log('🔄 Template version mismatch. Clearing old template...');
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        console.log('✅ Template cache cleared. Will use latest auto-detect.');
    } else {
        console.log('✅ Template version OK:', CURRENT_VERSION);
    }
})();

export { };
