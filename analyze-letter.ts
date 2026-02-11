import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs/promises';
import * as path from 'path';

// A3 template (conocido - funciona bien)
const A3_TEMPLATE = {
    left: 39.6,
    bottom: 627.0,
    width: 261.36,
    height: 460.8,
};

// Necesitamos encontrar el template correcto para Letter
// Vamos a probar diferentes valores de 'left' para centrar la credencial

async function analyzeLetterPdf() {
    const pdfPath = '/home/gyro/Documents/CLUB/miEspeCredential/Espemático _ ESPE (1).pdf';
    const pdfBytes = await fs.readFile(pdfPath);
    const doc = await PDFDocument.load(pdfBytes);
    const page = doc.getPage(0);
    const { width, height } = page.getSize();

    console.log(`\n📄 Letter PDF Analysis`);
    console.log(`Page Size: ${width} x ${height} pts`);

    // Calcular usando normalización desde A3
    const A3_SIZE = { width: 841.92, height: 1191.12 };
    const normalizedFromA3 = {
        x: A3_TEMPLATE.left / A3_SIZE.width,
        y: (A3_SIZE.height - A3_TEMPLATE.bottom - A3_TEMPLATE.height) / A3_SIZE.height,
        w: A3_TEMPLATE.width / A3_SIZE.width,
        h: A3_TEMPLATE.height / A3_SIZE.height
    };

    console.log(`\n📐 Normalized from A3:`, normalizedFromA3);

    // Aplicar a Letter
    const appliedToLetter = {
        left: normalizedFromA3.x * width,
        bottom: (1 - normalizedFromA3.y - normalizedFromA3.h) * height,
        width: normalizedFromA3.w * width,
        height: normalizedFromA3.h * height
    };

    console.log(`\n✂️ Applied to Letter (current):`, appliedToLetter);

    // La credencial en Letter probablemente está más centrada
    // Vamos a calcular diferentes opciones

    console.log(`\n🎯 Testing different horizontal positions:\n`);

    // Centro horizontal de la página
    const pageCenter = width / 2;
    const cropCenter = appliedToLetter.width / 2;

    // Opción 1: Centrado en la página
    const centeredLeft = pageCenter - cropCenter;
    console.log(`Opción 1 (Centrado): left = ${centeredLeft.toFixed(2)}`);

    // Opción 2: Un poco más a la izquierda (típico en credenciales)
    const leftBiased = centeredLeft * 0.7; // 30% hacia la izquierda
    console.log(`Opción 2 (Izquierda): left = ${leftBiased.toFixed(2)}`);

    // Opción 3: Proporción más baja del actual
    const adjusted = appliedToLetter.left * 0.6;
    console.log(`Opción 3 (60% actual): left = ${adjusted.toFixed(2)}`);

    // Opción 4: Basado en margen estándar
    const marginBased = width * 0.03; // 3% margin
    console.log(`Opción 4 (3% margen): left = ${marginBased.toFixed(2)}`);

    // Recomendación basada en la imagen del usuario
    // La credencial parece estar cortada a la derecha, entonces está muy a la derecha
    // Probablemente necesitamos moverla significativamente a la izquierda

    console.log(`\n💡 Recomendación basada en la imagen:`);
    console.log(`   La credencial está desplazada a la DERECHA`);
    console.log(`   Necesitamos REDUCIR el valor de 'left'`);
    console.log(`   Valor actual: ${appliedToLetter.left.toFixed(2)}`);
    console.log(`   Valor recomendado: ${marginBased.toFixed(2)} (Opción 4)`);

    // Crear template para Letter
    const LETTER_TEMPLATE = {
        left: marginBased,
        bottom: appliedToLetter.bottom,
        width: appliedToLetter.width,
        height: appliedToLetter.height
    };

    console.log(`\n✅ Suggested LETTER_TEMPLATE:`);
    console.log(JSON.stringify(LETTER_TEMPLATE, null, 2));

    // Calcular normalizado para Letter
    const letterNormalized = {
        x: LETTER_TEMPLATE.left / width,
        y: (height - LETTER_TEMPLATE.bottom - LETTER_TEMPLATE.height) / height,
        w: LETTER_TEMPLATE.width / width,
        h: LETTER_TEMPLATE.height / height
    };

    console.log(`\n📏 Letter Normalized Template:`);
    console.log(JSON.stringify(letterNormalized, null, 2));
}

analyzeLetterPdf().catch(console.error);
