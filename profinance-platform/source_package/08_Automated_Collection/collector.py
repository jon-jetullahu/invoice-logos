#!/usr/bin/env python3
"""Public-source banking annual report collector. Conservative discovery; no invented coverage."""
import argparse,csv,hashlib,json,re,time,sys
from pathlib import Path
from urllib.parse import urljoin,urlparse,urldefrag
import requests
from bs4 import BeautifulSoup

UA='ProFinance-PublicBankReportsResearch/1.0 (manual research; contact site owner if requested)'
HEADERS={'User-Agent':UA,'Accept':'text/html,application/pdf,*/*'}
PDF=re.compile(r'\.pdf(?:$|[?#])',re.I)
REPORT=re.compile(r'annual|audited|audit|raport|financial|financiar|bilanc|pasqyr|statement|vjetor|berichte|geschäftsbericht|bilancio',re.I)
YEARS=re.compile(r'(?<!\d)(19[89]\d|20[0-2]\d)(?!\d)')

def safe(s):return re.sub('[^a-zA-Z0-9._-]+','_',s).strip('_')[:100]
def session():
 s=requests.Session();s.headers.update(HEADERS);return s

def discover(s,bank,seed,depth,limit,delay):
 host=urlparse(seed).netloc.lower();q=[(seed,0)];seen=set();out=[];pages=[]
 while q and len(seen)<limit:
  url,d=q.pop(0);url=urldefrag(url)[0]
  if url in seen:continue
  if urlparse(url).netloc.lower()!=host:continue
  seen.add(url)
  try:
   r=s.get(url,timeout=25,allow_redirects=True)
   ct=r.headers.get('Content-Type','').lower()
   if 'pdf' in ct or PDF.search(r.url):
    out.append({'bank':bank,'source_page':url,'pdf_url':r.url,'anchor_text':'direct PDF seed','discovery_status':'DISCOVERED'});continue
   if r.status_code>=400:pages.append({'url':url,'status':f'HTTP_{r.status_code}'});continue
   if 'html' not in ct and not r.text.lstrip().startswith('<'):continue
   soup=BeautifulSoup(r.text,'html.parser');pages.append({'url':url,'status':'VISITED'})
   for a in soup.select('a[href]'):
    href=a.get('href','').strip();target=urljoin(r.url,href);label=' '.join(a.stripped_strings)[:200]
    if not target.startswith(('https://','http://')):continue
    if PDF.search(target) or ('download' in target.lower() and REPORT.search(label+' '+target)):
     out.append({'bank':bank,'source_page':url,'pdf_url':target,'anchor_text':label,'discovery_status':'DISCOVERED'})
    elif d<depth and urlparse(target).netloc.lower()==host and REPORT.search(label+' '+target):
     if target not in seen:q.append((target,d+1))
  except requests.RequestException as e:pages.append({'url':url,'status':'ERROR_'+type(e).__name__})
  time.sleep(delay)
 return out,pages

def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('--registry',default='../04_Public_Research/source_registry.csv')
 p.add_argument('--out',default='collected')
 p.add_argument('--depth',type=int,default=2);p.add_argument('--max-pages-per-bank',type=int,default=30)
 p.add_argument('--delay',type=float,default=1.0)
 p.add_argument('--download',action='store_true',help='Download discovered PDF candidates, not only inventory')
 p.add_argument('--limit-pdfs',type=int,default=0,help='0=unlimited')
 p.add_argument('--bank',default='',help='Case-insensitive filter (e.g. PriBank)')
 a=p.parse_args();out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
 with open(a.registry,encoding='utf-8-sig') as f: rows=list(csv.DictReader(f))
 seeds=[x for x in rows if x.get('category','').startswith('BANK_REPORT') and (not a.bank or a.bank.lower() in x['publisher'].lower())]
 s=session();candidates=[];page_log=[]
 for row in seeds:
  bank=row['publisher'];url=row['url'];print('Discovering',bank,url,flush=True)
  try:
   found,pages=discover(s,bank,url,a.depth,a.max_pages_per_bank,a.delay)
   candidates.extend(found);page_log.extend([{'bank':bank,**x} for x in pages]);print(' ',len(found),'candidates')
  except Exception as e:page_log.append({'bank':bank,'url':url,'status':'ERROR_'+str(e)[:160]})
 dedup={}
 for x in candidates:dedup[(x['bank'],x['pdf_url'])]=x
 candidates=list(dedup.values());downloads=[]
 if a.download:
  for i,x in enumerate(candidates):
   if a.limit_pdfs and i>=a.limit_pdfs:break
   bank=safe(x['bank']);url=x['pdf_url'];yrs=YEARS.findall(url+' '+x.get('anchor_text',''))
   year=yrs[-1] if yrs else 'YEAR_UNDETERMINED';folder=out/'pdf'/bank/year;folder.mkdir(parents=True,exist_ok=True)
   filename=safe(Path(urlparse(url).path).name or 'report.pdf');filename=(filename if filename.lower().endswith('.pdf') else filename+'.pdf')
   path=folder/(hashlib.sha1(url.encode()).hexdigest()[:10]+'_'+filename)
   item={**x,'year_guess':year,'file_path':str(path.relative_to(out)),'status':'FAILED'}
   try:
    with s.get(url,timeout=60,stream=True) as r:
     r.raise_for_status();size=0;h=hashlib.sha256()
     with open(path,'wb') as f:
      for chunk in r.iter_content(65536):
       if not chunk:continue
       size+=len(chunk)
       if size>75_000_000:raise ValueError('PDF exceeds 75MB safety cap')
       h.update(chunk);f.write(chunk)
    with open(path,'rb') as f:magic=f.read(5)
    if magic!=b'%PDF-':raise ValueError('Response was not a PDF')
    item.update(status='DOWNLOADED',bytes=size,sha256=h.hexdigest())
   except Exception as e:
    path.unlink(missing_ok=True);item['error']=str(e)[:250]
   downloads.append(item);time.sleep(a.delay)
 def write_csv(name,records,cols):
  with open(out/name,'w',encoding='utf-8-sig',newline='') as f:
   w=csv.DictWriter(f,fieldnames=cols,extrasaction='ignore');w.writeheader();w.writerows(records)
 write_csv('discovered_report_links.csv',candidates,['bank','source_page','pdf_url','anchor_text','discovery_status'])
 write_csv('visited_pages.csv',page_log,['bank','url','status'])
 write_csv('download_manifest.csv',downloads,['bank','source_page','pdf_url','anchor_text','year_guess','file_path','status','bytes','sha256','error'])
 print('Finished. Discovered:',len(candidates),'Downloaded:',sum(x['status']=='DOWNLOADED' for x in downloads))
 print('WARNING: Discovery is not an exhaustive guarantee. Validate each bank/year manually and with search/browser fallbacks.')
if __name__=='__main__':main()
