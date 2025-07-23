// PDF Field Inspector - to understand original formatting
async function inspectPDFFields() {
    try {
        const response = await fetch('./FORGE - Character Sheet (01-01-25)(Form Fillable).pdf');
        const pdfBytes = await response.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        
        console.log('=== PDF FIELD FORMATTING INSPECTION ===');
        
        form.getFields().forEach((field, index) => {
            const fieldName = field.getName();
            console.log(`\n${index + 1}. Field: "${fieldName}"`);
            
            try {
                if (field.constructor.name.includes('TextField')) {
                    const widgets = field.acroField.getWidgets();
                    widgets.forEach((widget, widgetIndex) => {
                        const da = widget.getDefaultAppearance();
                        const mk = widget.getAppearanceCharacteristics();
                        
                        console.log(`  Widget ${widgetIndex}:`);
                        console.log(`    Default Appearance: ${da || 'None'}`);
                        if (mk) {
                            console.log(`    Appearance Characteristics: Present`);
                        }
                    });
                }
            } catch (e) {
                console.log(`    Error inspecting: ${e.message}`);
            }
        });
        
    } catch (error) {
        console.error('Error inspecting PDF:', error);
    }
}

// Call this in browser console to inspect formatting
window.inspectPDFFields = inspectPDFFields;
