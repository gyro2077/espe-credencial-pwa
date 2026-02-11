import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs/promises';

async function findPerfectLetterCoords() {
    const pdfPath = '/home/gyro/Documents/CLUB/miEspeCredential/Espemático _ ESPE (1).pdf';
    const pdfBytes = await fs.readFile(pdfPath);
    const doc = await PDFDocument.load(pdfBytes);
    const page = doc.getPage(0);
    const { width, height } = page.getSize();

    console.log('\n🎯 ENCONTRANDO COORDENADAS PERFECTAS PARA LETTER PDF');
    console.log('='.repeat(70));
    console.log(`Page: ${width} x ${height} pts\n`);

    // Basándome en credenciales estándar y la imagen del usuario:
    // La credencial ocupa aproximadamente:
    // - Ancho: ~190-200 pts (31% de 612)
    // - Alto: ~300-310 pts (38-39% de 792)

    // Probar diferentes configuraciones
    const tests = [
        { name: 'Muy pegado izq', x: 0.010, w: 0.320 },
        { name: 'Pegado izq + ancho', x: 0.015, w: 0.320 },
        { name: 'Margen mín + ancho', x: 0.020, w: 0.320 },
        { name: 'Centrado izq', x: 0.025, w: 0.320 },
        { name: 'Actual (probablemente malo)', x: 0.015, w: 0.310 },
        { name: 'Más ancho', x: 0.010, w: 0.330 },
    ];

    console.log('Probando diferentes configuraciones:\n');

    tests.forEach((test, i) => {
        const leftPts = test.x * width;
        const widthPts = test.w * width;
        const rightPts = leftPts + widthPts;

        const centerPts = leftPts + (widthPts / 2);
        const pageCenter = width / 2;
        const offsetFromCenter = centerPts - pageCenter;

        console.log(`${i + 1}. ${test.name}:`);
        console.log(`   Template: { x: ${test.x.toFixed(3)}, w: ${test.w.toFixed(3)} }`);
        console.log(`   Left: ${leftPts.toFixed(1)} pts`);
        console.log(`   Width: ${widthPts.toFixed(1)} pts`);
        console.log(`   Right: ${rightPts.toFixed(1)} pts (${rightPts <= width ? '✅' : '❌'} fits)`);
        console.log(`   Offset: ${offsetFromCenter.toFixed(1)} pts ${offsetFromCenter > 0 ? 'RIGHT' : 'LEFT'} of center`);
        console.log();
    });

    // Analizar dimensiones razonables para credencial
    console.log('='.repeat(70));
    console.log('📏 ANÁLISIS DE DIMENSIONES TÍPICAS:\n');

    // Una credencial típica de ESPE debería ser:
    // Aspecto ratio portrait, aproximadamente 1:1.6 a 1:1.8
    const credentialAspect = 0.57; // w/h típico para credenciales verticales

    // Si height = 0.387 de la página (306 pts en Letter)
    const h = 0.387;
    const heightPts = h * height;

    // Entonces width ideal sería:
    const idealWidthPts = heightPts * credentialAspect;
    const idealW = idealWidthPts / width;

    console.log(`Height (dado): ${h.toFixed(3)} (${heightPts.toFixed(1)} pts)`);
    console.log(`Ideal width para aspect ${credentialAspect}: ${idealW.toFixed(3)} (${idealWidthPts.toFixed(1)} pts)`);
    console.log();

    // Entonces, si queremos centrar o posicionar a la izquierda:
    const suggestions = [
        {
            name: 'OPCIÓN A: Muy pegado a la izquierda',
            x: 0.008,
            w: idealW,
            desc: 'Margen mínimo, captura todo el contenido'
        },
        {
            name: 'OPCIÓN B: Pequeño margen izquierdo',
            x: 0.012,
            w: idealW,
            desc: 'Balance entre margen y contenido'
        },
        {
            name: 'OPCIÓN C: Margen moderado',
            x: 0.018,
            w: idealW,
            desc: 'Más margen, pero puede cortar contenido'
        },
        {
            name: 'OPCIÓN D: Ancho aumentado',
            x: 0.010,
            w: 0.320,
            desc: 'Un poco más de ancho para capturar más'
        }
    ];

    console.log('='.repeat(70));
    console.log('✨ SOLUCIONES RECOMENDADAS:\n');

    suggestions.forEach((sug, i) => {
        const leftPts = sug.x * width;
        const widthPts = sug.w * width;
        const rightPts = leftPts + widthPts;

        console.log(`${sug.name}:`);
        console.log(`  Template: { x: ${sug.x.toFixed(3)}, w: ${sug.w.toFixed(3)}, y: 0.087, h: 0.387 }`);
        console.log(`  Descripción: ${sug.desc}`);
        console.log(`  Posición: ${leftPts.toFixed(1)} → ${rightPts.toFixed(1)} pts`);
        console.log(`  Width: ${widthPts.toFixed(1)} pts`);
        console.log();
    });

    console.log('='.repeat(70));
    console.log('💡 RECOMENDACIÓN FINAL:\n');
    console.log('Basándome en credenciales típicas de ESPE:');
    console.log('{ x: 0.010, y: 0.087, w: 0.320, h: 0.387 }\n');
    console.log('Esto da:');
    console.log(`  - Left: ${(0.010 * width).toFixed(1)} pts (~6pts margen)`);
    console.log(`  - Width: ${(0.320 * width).toFixed(1)} pts (capta más contenido)`);
    console.log(`  - Height: ${(0.387 * height).toFixed(1)} pts (OK)`);
    console.log();
    console.log('El ancho aumentado (0.320 vs 0.310) debería capturar');
    console.log('cualquier contenido que estaba siendo cortado.');
}

findPerfectLetterCoords().catch(console.error);
