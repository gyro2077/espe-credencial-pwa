import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs/promises';

async function visuallyAnalyzeLetterPdf() {
    const pdfPath = '/home/gyro/Documents/CLUB/miEspeCredential/Espemático _ ESPE (1).pdf';
    const pdfBytes = await fs.readFile(pdfPath);
    const doc = await PDFDocument.load(pdfBytes);
    const page = doc.getPage(0);
    const { width, height } = page.getSize();

    console.log('\n' + '='.repeat(70));
    console.log('📄 LETTER PDF VISUAL ANALYSIS');
    console.log('='.repeat(70));
    console.log(`Page Size: ${width} x ${height} pts\n`);

    // Basándome en la imagen del usuario, la credencial parece estar:
    // - Muy cerca del borde izquierdo (margen mínimo)
    // - Centrada verticalmente en la mitad superior
    // - Ancho estándar de credencial

    console.log('🔍 Testing different horizontal positions:\n');

    // La credencial en la imagen se ve que tiene poco margen izquierdo
    // Vamos a probar posiciones más extremas

    const tests = [
        { name: 'Muy pegado izquierda', x: 0.015, xPts: 0.015 * width },
        { name: 'Pegado izquierda', x: 0.020, xPts: 0.020 * width },
        { name: 'Margen mínimo', x: 0.025, xPts: 0.025 * width },
        { name: 'Actual (problemático)', x: 0.030, xPts: 0.030 * width },
        { name: 'Margen pequeño', x: 0.035, xPts: 0.035 * width },
        { name: 'Margen mediano', x: 0.040, xPts: 0.040 * width },
    ];

    tests.forEach(test => {
        const rightEdgePts = test.xPts + (0.310 * width); // w = 0.310
        const centerPts = test.xPts + (0.310 * width / 2);
        const offsetFromCenter = centerPts - (width / 2);
        const offsetPercent = (offsetFromCenter / width) * 100;

        console.log(`${test.name}:`);
        console.log(`  x: ${test.x.toFixed(4)} (${test.xPts.toFixed(2)} pts)`);
        console.log(`  Right edge: ${rightEdgePts.toFixed(2)} pts`);
        console.log(`  Center: ${centerPts.toFixed(2)} pts (${offsetPercent.toFixed(1)}% ${offsetFromCenter > 0 ? 'RIGHT' : 'LEFT'} of page center)`);
        console.log(`  Fits in page: ${rightEdgePts <= width ? '✅' : '❌'}`);
        console.log();
    });

    // Analizar la imagen del usuario
    console.log('='.repeat(70));
    console.log('📸 USER IMAGE ANALYSIS:');
    console.log('='.repeat(70));
    console.log('Based on the screenshot provided by the user:\n');
    console.log('Visual observations:');
    console.log('  - Credential appears nicely framed');
    console.log('  - Small left margin (not too tight, not too wide)');
    console.log('  - Right side has proper spacing');
    console.log('  - Vertically centered in upper portion');
    console.log('');
    console.log('💡 RECOMMENDATION:');
    console.log('  Looking at the user\'s screenshot, the credential looks good');
    console.log('  BUT user says "sigue asomando mal"');
    console.log('  This suggests we need VISUAL VERIFICATION in browser');
    console.log('');
    console.log('  Possible issues:');
    console.log('  1. Horizontal position might be slightly off');
    console.log('  2. Vertical position might need adjustment');
    console.log('  3. Width/height might need fine-tuning');
    console.log('');

    // Verificar dimensiones verticales también
    console.log('='.repeat(70));
    console.log('📐 VERTICAL ANALYSIS:');
    console.log('='.repeat(70));

    const y = 0.087;
    const h = 0.387;

    const topPts = y * height;
    const bottomPts = (1 - y - h) * height;
    const heightPts = h * height;

    console.log(`Current vertical template:`);
    console.log(`  y (from top): ${y.toFixed(4)} (${topPts.toFixed(2)} pts)`);
    console.log(`  h (height): ${h.toFixed(4)} (${heightPts.toFixed(2)} pts)`);
    console.log(`  bottom (from bottom): ${bottomPts.toFixed(2)} pts`);
    console.log(`  top edge: ${(topPts + heightPts).toFixed(2)} pts (of ${height} max)`);
    console.log('');

    // Sugerencias basadas en credencial típica
    console.log('='.repeat(70));
    console.log('✨ OPTIMAL TEMPLATE SUGGESTION:');
    console.log('='.repeat(70));
    console.log('');
    console.log('For Letter PDF (612 x 792 pts):');
    console.log('');
    console.log('Option A - Minimal left margin (tight):');
    console.log('  { x: 0.020, y: 0.087, w: 0.310, h: 0.387 }');
    console.log('  Left: ~12pts, fits most credentials tightly');
    console.log('');
    console.log('Option B - Small left margin (balanced):');
    console.log('  { x: 0.025, y: 0.087, w: 0.310, h: 0.387 }');
    console.log('  Left: ~15pts, better visual balance');
    console.log('');
    console.log('Option C - Current (might be too far right):');
    console.log('  { x: 0.030, y: 0.087, w: 0.310, h: 0.387 }');
    console.log('  Left: ~18pts, user reports issues');
    console.log('');
    console.log('💡 RECOMMENDATION: Try Option A (x: 0.020) first');
    console.log('   This will shift credential ~6pts MORE to the LEFT');
}

visuallyAnalyzeLetterPdf().catch(console.error);
