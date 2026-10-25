#!/usr/bin/env python3
"""Extract searchable text with page citations from collected PDF documents."""
import argparse,csv,json,hashlib
from pathlib import Path
import fitz
p=argparse.ArgumentParser();p.add_argument('--input',default='collected/pdf');p.add_argument('--out',default='collected/extracted');a=p.parse_args()
root=Path(a.input);out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
rows=[]
for file in sorted(root.rglob('*.pdf')):
 try:
  doc=fitz.open(file);pages=[]
  for i,page in enumerate(doc):
   txt=page.get_text('text');pages.append({'page':i+1,'text':txt,'text_chars':len(txt),'tables':[[list(map(str,r)) for r in table.extract()] for table in page.find_tables()]})
  relative=file.relative_to(root);dest=out/relative.with_suffix('.json');dest.parent.mkdir(parents=True,exist_ok=True)
  dest.write_text(json.dumps({'source_file':str(relative),'page_count':len(doc),'pages':pages},ensure_ascii=False),encoding='utf-8')
  rows.append({'file':str(relative),'pages':len(doc),'status':'EXTRACTED_TEXT_TABLES','output':str(dest)})
 except Exception as e:rows.append({'file':str(file),'pages':'','status':'ERROR','output':str(e)[:200]})
with (out/'extraction_manifest.csv').open('w',newline='',encoding='utf-8') as f:
 w=csv.DictWriter(f,fieldnames=['file','pages','status','output']);w.writeheader();w.writerows(rows)
print('Processed',len(rows),'PDFs. Scanned PDFs with no text require targeted OCR and manual review.')
