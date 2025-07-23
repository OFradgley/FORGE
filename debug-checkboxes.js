// Debug script to inspect checkbox fields in the PDF
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function debugCheckboxes() {
  try {
    const pdfBytes = fs.readFileSync('./FORGE - Character Sheet (01-01-25)(Form Fillable).pdf');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    console.log('All checkbox fields found:');
    fields.forEach((field, index) => {
      if (field.constructor.name === 'PDFCheckBox') {
        console.log(`${index}: ${field.getName()}`);
        console.log(`  - Type: ${field.constructor.name}`);
        console.log(`  - Is checked: ${field.isChecked()}`);
        
        // Try to get the underlying field dictionary
        try {
          const ref = field.ref;
          const dict = pdfDoc.context.lookup(ref);
          if (dict) {
            const opts = dict.lookup(PDFName.of('Opt'));
            const v = dict.lookup(PDFName.of('V'));
            const dv = dict.lookup(PDFName.of('DV'));
            console.log(`  - V value: ${v}`);
            console.log(`  - DV value: ${dv}`);
            console.log(`  - Options: ${opts}`);
          }
        } catch (e) {
          console.log(`  - Could not inspect dictionary: ${e.message}`);
        }
        console.log('---');
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugCheckboxes();
