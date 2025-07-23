// PDF Field Extractor for FORGE Character Sheet
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function extractPDFFields() {
    try {
        // Read the PDF file
        const pdfPath = './FORGE - Character Sheet (01-01-25)(Form Fillable).pdf';
        const existingPdfBytes = fs.readFileSync(pdfPath);
        
        // Load the PDF
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const form = pdfDoc.getForm();
        const fields = form.getFields();
        
        console.log(`Found ${fields.length} form fields in the PDF:\n`);
        
        const fieldData = [];
        
        fields.forEach((field, index) => {
            const fieldName = field.getName();
            const fieldType = field.constructor.name;
            
            fieldData.push({
                index: index + 1,
                name: fieldName,
                type: fieldType
            });
            
            console.log(`${index + 1}. "${fieldName}" (${fieldType})`);
        });
        
        // Save results to a JSON file for reference
        fs.writeFileSync('pdf-fields.json', JSON.stringify(fieldData, null, 2));
        console.log('\nField data saved to pdf-fields.json');
        
        return fieldData;
        
    } catch (error) {
        console.error('Error extracting PDF fields:', error);
    }
}

// Run the extraction
extractPDFFields();
