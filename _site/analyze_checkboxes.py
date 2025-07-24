import PyPDF2
import json

def analyze_checkbox_fields(pdf_path):
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            if '/AcroForm' in pdf_reader.trailer['/Root']:
                form = pdf_reader.trailer['/Root']['/AcroForm']
                if '/Fields' in form:
                    fields = form['/Fields']
                    
                    # Find Arcane and Divine checkboxes
                    arcane_field = None
                    divine_field = None
                    
                    for i, field_ref in enumerate(fields):
                        field = field_ref.get_object()
                        field_name = field.get('/T', 'Unknown')
                        
                        if isinstance(field_name, bytes):
                            field_name = field_name.decode('utf-8')
                        
                        if field_name == 'Arcane':
                            arcane_field = field
                            print(f"Found Arcane field at index {i + 1}")
                        elif field_name == 'Divine':
                            divine_field = field
                            print(f"Found Divine field at index {i + 1}")
                    
                    # Analyze both fields
                    if arcane_field:
                        print("\n=== ARCANE CHECKBOX ANALYSIS ===")
                        analyze_single_field(arcane_field, "Arcane")
                    
                    if divine_field:
                        print("\n=== DIVINE CHECKBOX ANALYSIS ===")
                        analyze_single_field(divine_field, "Divine")
                    
                    return arcane_field, divine_field
                    
    except Exception as e:
        print(f"Error analyzing checkboxes: {e}")
        return None, None

def analyze_single_field(field, name):
    print(f"Field Name: {name}")
    print(f"Field Type: {field.get('/FT', 'Unknown')}")
    print(f"Field Value (/V): {field.get('/V', 'Not set')}")
    print(f"Default Value (/DV): {field.get('/DV', 'Not set')}")
    print(f"Appearance State (/AS): {field.get('/AS', 'Not set')}")
    
    # Check for Kids (sub-fields)
    kids = field.get('/Kids')
    if kids:
        print(f"Has Kids: {len(kids)} sub-fields")
        for i, kid_ref in enumerate(kids):
            kid = kid_ref.get_object()
            print(f"  Kid {i + 1}:")
            print(f"    Type: {kid.get('/FT', 'Unknown')}")
            print(f"    Value: {kid.get('/V', 'Not set')}")
            print(f"    AS: {kid.get('/AS', 'Not set')}")
            
            # Check for appearance dictionary
            ap = kid.get('/AP')
            if ap:
                print(f"    Appearance Dict: {ap}")
                if '/N' in ap:
                    normal_ap = ap['/N']
                    print(f"    Normal Appearances: {list(normal_ap.keys()) if hasattr(normal_ap, 'keys') else normal_ap}")
    else:
        print("No Kids (direct field)")
    
    # Check for appearance dictionary on main field
    ap = field.get('/AP')
    if ap:
        print(f"Main Appearance Dict: {ap}")
        if '/N' in ap:
            normal_ap = ap['/N']
            if hasattr(normal_ap, 'keys'):
                print(f"Normal Appearances: {list(normal_ap.keys())}")
            else:
                print(f"Normal Appearances: {normal_ap}")
    
    # Check for field flags
    ff = field.get('/Ff')
    if ff:
        print(f"Field Flags: {ff}")
    
    print("---")

if __name__ == "__main__":
    pdf_path = "Character Sheet Template (01-01-25).pdf"
    analyze_checkbox_fields(pdf_path)
