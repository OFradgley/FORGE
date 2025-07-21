import PyPDF2
import json
import sys

def extract_pdf_fields(pdf_path):
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            # Check if the PDF has form fields
            if '/AcroForm' in pdf_reader.trailer['/Root']:
                form = pdf_reader.trailer['/Root']['/AcroForm']
                if '/Fields' in form:
                    fields = form['/Fields']
                    field_data = []
                    
                    print(f"Found {len(fields)} form fields in the PDF:\n")
                    
                    for i, field_ref in enumerate(fields):
                        field = field_ref.get_object()
                        field_name = field.get('/T', 'Unknown')
                        field_type = field.get('/FT', 'Unknown')
                        
                        # Convert bytes to string if necessary
                        if isinstance(field_name, bytes):
                            field_name = field_name.decode('utf-8')
                        if isinstance(field_type, bytes):
                            field_type = field_type.decode('utf-8')
                            
                        field_data.append({
                            'index': i + 1,
                            'name': field_name,
                            'type': field_type
                        })
                        
                        print(f"{i + 1}. \"{field_name}\" ({field_type})")
                    
                    # Save to JSON
                    with open('pdf-fields.json', 'w') as json_file:
                        json.dump(field_data, json_file, indent=2)
                    
                    print(f"\nField data saved to pdf-fields.json")
                    return field_data
                else:
                    print("No form fields found in the PDF")
            else:
                print("This PDF does not contain form fields")
                
    except Exception as e:
        print(f"Error extracting PDF fields: {e}")
        return None

if __name__ == "__main__":
    pdf_path = "FORGE - Character Sheet (01-01-25)(Form Fillable).pdf"
    extract_pdf_fields(pdf_path)
