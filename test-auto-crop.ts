import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs/promises';
import * as path from 'path';

// Copiar las funciones de auto-crop para testing
const A3_REFERENCE = { width: 841.92, height: 1191.12 };
const TEMPLATE_ABSOLUTE = {
    left: 39.6,
    bottom: 627.0,
    width: 261.36,
    height: 460.8,
};

const NORMALIZED_TEMPLATE = {
    x: TEMPLATE_ABSOLUTE.left / A3_REFERENCE.width,
    y: (A3_REFERENCE.height - TEMPLATE_ABSOLUTE.bottom - TEMPLATE_ABSOLUTE.height) / A3_REFERENCE.height,
    w: TEMPLATE_ABSOLUTE.width / A3_REFERENCE.width,
    h: TEMPLATE_ABSOLUTE.height / A3_REFERENCE.height
};

async function testPdfCrop(pdfPath: string) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 Testing: ${path.basename(pdfPath)}`);
    console.log('='.repeat(60));

    const pdfBytes = await fs.readFile(pdfPath);
    const doc = await PDFDocument.load(pdfBytes);
    const page = doc.getPage(0);
    const { width, height } = page.getSize();

    console.log(`📐 Page Size: ${width.toFixed(2)} x ${height.toFixed(2)} pts`);

    // Determinar formato
    let format = 'Unknown';
    if (Math.abs(width - 841.92) < 5 && Math.abs(height - 1191.12) < 5) {
        format = 'A3';
    } else if (Math.abs(width - 612) < 5 && Math.abs(height - 792) < 5) {
        format = 'Letter';
    } else if (Math.abs(width - 595) < 5 && Math.abs(height - 842) < 5) {
        format = 'A4';
    }
    console.log(`📋 Format: ${format}`);

    // Calcular coordenadas absolutas desde normalized
    const absoluteCrop = {
        left: NORMALIZED_TEMPLATE.x * width,
        bottom: (1 - NORMALIZED_TEMPLATE.y - NORMALIZED_TEMPLATE.h) * height,
        width: NORMALIZED_TEMPLATE.w * width,
        height: NORMALIZED_TEMPLATE.h * height
    };

    console.log(`\n✂️  Normalized Template (0-1):`);
    console.log(`   x: ${NORMALIZED_TEMPLATE.x.toFixed(4)}`);
    console.log(`   y: ${NORMALIZED_TEMPLATE.y.toFixed(4)}`);
    console.log(`   w: ${NORMALIZED_TEMPLATE.w.toFixed(4)}`);
    console.log(`   h: ${NORMALIZED_TEMPLATE.h.toFixed(4)}`);

    console.log(`\n✂️  Absolute Crop (pts):`);
    console.log(`   left: ${absoluteCrop.left.toFixed(2)}`);
    console.log(`   bottom: ${absoluteCrop.bottom.toFixed(2)}`);
    console.log(`   width: ${absoluteCrop.width.toFixed(2)}`);
    console.log(`   height: ${absoluteCrop.height.toFixed(2)}`);

    // Verificar si el crop está dentro de límites
    const topOfCrop = absoluteCrop.bottom + absoluteCrop.height;
    const rightOfCrop = absoluteCrop.left + absoluteCrop.width;

    const isValid =
        absoluteCrop.left >= 0 &&
        absoluteCrop.bottom >= 0 &&
        rightOfCrop <= width &&
        topOfCrop <= height;

    console.log(`\n✅ Validation:`);
    console.log(`   Bottom edge: ${absoluteCrop.bottom.toFixed(2)} (valid: ${absoluteCrop.bottom >= 0})`);
    console.log(`   Top edge: ${topOfCrop.toFixed(2)} (valid: ${topOfCrop <= height}, max: ${height})`);
    console.log(`   Left edge: ${absoluteCrop.left.toFixed(2)} (valid: ${absoluteCrop.left >= 0})`);
    console.log(`   Right edge: ${rightOfCrop.toFixed(2)} (valid: ${rightOfCrop <= width}, max: ${width})`);
    console.log(`   Overall: ${isValid ? '✅ PASS' : '❌ FAIL'}`);

    // Aspect ratio check
    const aspectRatio = absoluteCrop.width / absoluteCrop.height;
    const expectedAspect = 0.57;
    const aspectDiff = Math.abs(expectedAspect - aspectRatio);
    const confidence = Math.max(0.6, Math.min(1.0, 1 - aspectDiff / expectedAspect));

    console.log(`\n🎯 Confidence Estimation:`);
    console.log(`   Aspect Ratio: ${aspectRatio.toFixed(3)} (expected: ${expectedAspect})`);
    console.log(`   Difference: ${aspectDiff.toFixed(3)}`);
    console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%`);

    return isValid;
}

async function main() {
    const pdfDir = '/home/gyro/Documents/CLUB/miEspeCredential';
    const pdf1 = path.join(pdfDir, 'Espemático _ ESPE.pdf');
    const pdf2 = path.join(pdfDir, 'Espemático _ ESPE (1).pdf');

    console.log('\n🧪 TESTING NORMALIZED AUTO-CROP FOR PWA');
    console.log('Testing that normalized coordinates work for multiple PDF sizes\n');

    const results = [];

    try {
        results.push(await testPdfCrop(pdf1));
    } catch (e) {
        console.error(`❌ Error testing ${pdf1}:`, e);
        results.push(false);
    }

    try {
        results.push(await testPdfCrop(pdf2));
    } catch (e) {
        console.error(`❌ Error testing ${pdf2}:`, e);
        results.push(false);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Espemático _ ESPE.pdf: ${results[0] ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Espemático _ ESPE (1).pdf: ${results[1] ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`\nOverall: ${results.every(r => r) ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
}

main().catch(console.error);
