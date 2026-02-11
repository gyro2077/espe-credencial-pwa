import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs/promises';
import * as path from 'path';

// Import the actual templates
const PAGE_FORMATS = {
    A3: { width: 841.92, height: 1191.12 },
    LETTER: { width: 612, height: 792 },
    A4: { width: 595, height: 842 }
};

const TEMPLATES = {
    A3: {
        x: 0.047,
        y: 0.087,
        w: 0.310,
        h: 0.387
    },
    LETTER: {
        x: 0.030,  // UPDATED: Less margin to shift left
        y: 0.087,
        w: 0.310,
        h: 0.387
    },
    A4: {
        x: 0.045,
        y: 0.087,
        w: 0.310,
        h: 0.387
    }
};

type PageFormat = 'A3' | 'LETTER' | 'A4' | 'UNKNOWN';

function detectPageFormat(width: number, height: number): PageFormat {
    const tolerance = 5;

    if (Math.abs(width - PAGE_FORMATS.A3.width) < tolerance &&
        Math.abs(height - PAGE_FORMATS.A3.height) < tolerance) {
        return 'A3';
    }

    if (Math.abs(width - PAGE_FORMATS.LETTER.width) < tolerance &&
        Math.abs(height - PAGE_FORMATS.LETTER.height) < tolerance) {
        return 'LETTER';
    }

    if (Math.abs(width - PAGE_FORMATS.A4.width) < tolerance &&
        Math.abs(height - PAGE_FORMATS.A4.height) < tolerance) {
        return 'A4';
    }

    return 'UNKNOWN';
}

async function testPdfCrop(pdfPath: string) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📄 Testing: ${path.basename(pdfPath)}`);
    console.log('='.repeat(70));

    const pdfBytes = await fs.readFile(pdfPath);
    const doc = await PDFDocument.load(pdfBytes);
    const page = doc.getPage(0);
    const { width, height } = page.getSize();

    const format = detectPageFormat(width, height);
    const template = TEMPLATES[format === 'UNKNOWN' ? 'A3' : format];

    console.log(`📐 Page Size: ${width.toFixed(2)} x ${height.toFixed(2)} pts`);
    console.log(`📋 Format: ${format}`);
    console.log(`📏 Template: ${format} → x: ${template.x.toFixed(4)}`);

    // Calculate absolute coordinates
    const absoluteCrop = {
        left: template.x * width,
        bottom: (1 - template.y - template.h) * height,
        width: template.w * width,
        height: template.h * height
    };

    console.log(`\n✂️  Absolute Crop (pts):`);
    console.log(`   left: ${absoluteCrop.left.toFixed(2)}`);
    console.log(`   bottom: ${absoluteCrop.bottom.toFixed(2)}`);
    console.log(`   width: ${absoluteCrop.width.toFixed(2)}`);
    console.log(`   height: ${absoluteCrop.height.toFixed(2)}`);

    // Validation
    const topOfCrop = absoluteCrop.bottom + absoluteCrop.height;
    const rightOfCrop = absoluteCrop.left + absoluteCrop.width;

    const isValid =
        absoluteCrop.left >= 0 &&
        absoluteCrop.bottom >= 0 &&
        rightOfCrop <= width &&
        topOfCrop <= height;

    console.log(`\n✅ Validation:`);
    console.log(`   Left: ${absoluteCrop.left.toFixed(2)} / ${width.toFixed(2)} (${isValid ? '✅' : '❌'})`);
    console.log(`   Right: ${rightOfCrop.toFixed(2)} / ${width.toFixed(2)} (${rightOfCrop <= width ? '✅' : '❌'})`);
    console.log(`   Bottom: ${absoluteCrop.bottom.toFixed(2)} / ${height.toFixed(2)} (${isValid ? '✅' : '❌'})`);
    console.log(`   Top: ${topOfCrop.toFixed(2)} / ${height.toFixed(2)} (${topOfCrop <= height ? '✅' : '❌'})`);
    console.log(`   Overall: ${isValid ? '✅ PASS' : '❌ FAIL'}`);

    // Centering analysis
    const pageCenter = width / 2;
    const cropCenter = absoluteCrop.left + (absoluteCrop.width / 2);
    const offset = cropCenter - pageCenter;
    const offsetPercent = (offset / width) * 100;

    console.log(`\n📊 Centering Analysis:`);
    console.log(`   Page center: ${pageCenter.toFixed(2)} pts`);
    console.log(`   Crop center: ${cropCenter.toFixed(2)} pts`);
    console.log(`   Offset: ${offset.toFixed(2)} pts (${offsetPercent.toFixed(1)}% ${offset > 0 ? 'RIGHT' : 'LEFT'})`);

    return isValid;
}

async function main() {
    const pdfDir = '/home/gyro/Documents/CLUB/miEspeCredential';
    const pdf1 = path.join(pdfDir, 'Espemático _ ESPE.pdf');
    const pdf2 = path.join(pdfDir, 'Espemático _ ESPE (1).pdf');

    console.log('\n🧪 TESTING FORMAT-SPECIFIC AUTO-CROP');
    console.log('Testing with A3-specific and Letter-specific templates\n');

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

    console.log(`\n${'='.repeat(70)}`);
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(70));
    console.log(`Espemático _ ESPE.pdf (A3): ${results[0] ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Espemático _ ESPE (1).pdf (Letter): ${results[1] ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`\nOverall: ${results.every(r => r) ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log('\n💡 Letter template now uses x: 0.030 (18.36pts) vs previous 0.047 (28.79pts)');
    console.log('   This shifts the crop ~10pts to the LEFT to fix rightward offset');
}

main().catch(console.error);
