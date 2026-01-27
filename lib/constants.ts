// Crop normalizado inicial (Aproximación Portrait / Vertical)
export const DEFAULT_CREDENTIAL_CROP = {
    x: 0.05,
    y: 0.05,
    w: 0.40, // Más angosto
    h: 0.85, // Más alto
};

// Rectángulo de la foto dentro de la credencial recortada (0..1)
export const DEFAULT_PHOTO_RECT = {
    x: 0.28, // Centrado aprox
    y: 0.18,
    w: 0.44,
    h: 0.28,
};
