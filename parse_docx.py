import zipfile
import xml.etree.ElementTree as ET
import sys
import os

def parse_docx(filename):
    if not os.path.exists(filename) or os.path.getsize(filename) == 0:
        print(f"File {filename} is empty or does not exist.")
        return
    try:
        with zipfile.ZipFile(filename) as zf:
            xml_content = zf.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            text = [node.text for node in tree.iter() if node.tag.endswith('}t') and node.text]
            print(f"--- CONTENT OF {filename} ---")
            print('\n'.join(text))
            print("-" * 40)
    except Exception as e:
        print(f"Error reading {filename}: {e}")

for f in sys.argv[1:]:
    parse_docx(f)
