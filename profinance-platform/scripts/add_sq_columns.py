"""Adds Albanian (`*_sq`) columns to research CSVs. Source-language columns are never modified."""
import csv, sys
from pathlib import Path

R = Path(__file__).resolve().parent.parent / 'research'

ROLES = {
 'BRD-CHAIR':'Kryetari i Bordit (joekzekutiv)','BRD-INED':'Drejtor i pavarur joekzekutiv','BRD-SNED':'Drejtor joekzekutiv i emëruar nga aksionarët',
 'EXE-CEO':'Kryeshefi ekzekutiv (CEO)','EXE-DCEO':'Zëvendëskryeshefi / Shefi i operacioneve (COO)','EXE-CFO':'Shefi i financave (CFO)',
 'CTL-CRO':'Shefi i rrezikut (CRO)','CTL-CCO':'Shefi i pajtueshmërisë (CCO)','CTL-MLRO':'Zyrtari për PPP/LFT (MLRO)','CTL-HIA':'Shefi i auditimit të brendshëm',
 'CTL-IA':'Auditor i brendshëm','CTL-CISO':'Shefi i sigurisë së informacionit (CISO)','CTL-DPO':'Zyrtari për mbrojtjen e të dhënave (DPO)',
 'RSK-AN':'Analist rreziku (kreditor/tregu/operacional/SNRF 9)','CMP-OFF':'Zyrtar i pajtueshmërisë','AML-AN':'Analist PPP / monitorimi i transaksioneve',
 'FRD-AN':'Analist i mashtrimeve','CRD-HEAD':'Shefi i kreditimit (analiza dhe miratimi)','CRD-UW':'Analist krediti','CRD-ADM':'Zyrtar i administrimit të kredive / kolateralit',
 'COL-OFF':'Zyrtar i arkëtimit dhe rikuperimit','LSE-SPEC':'Specialist i lizingut','GFN-RM':'Zyrtar i financimit të mallrave / marrëdhënieve me tregtarët',
 'TRS-HEAD':'Shefi i thesarit dhe ALM','TRS-AN':'Analist thesari / ALM','FIN-CTRL':'Kontrollor financiar','FIN-ACC':'Kontabilist',
 'FIN-REG':'Specialist i raportimit rregullativ','LEG-HEAD':'Shefi i çështjeve ligjore','HR-MGR':'Menaxher i burimeve njerëzore',
 'PRC-MGR':'Menaxher i prokurimit dhe i furnitorëve/outsourcing-ut','OPS-HEAD':'Shefi i operacioneve','OPS-BO':'Zyrtar i zyrës mbështetëse / operacioneve të depozitave',
 'OPS-PAY':'Zyrtar i pagesave dhe shlyerjeve','OPS-KYC':'Zyrtar i njohjes së klientit (KYC) / hapjes së llogarive','CRD-CARDMGR':'Menaxher i kartelave dhe bankingut digjital',
 'CRD-OPS':'Zyrtar i operacioneve të kartelave / digjitale','PRD-MGR':'Menaxher produkti (përfshirë strukturimin e produkteve islame)','MKT-MGR':'Menaxher marketingu',
 'IT-CIO':'Shefi i teknologjisë së informacionit (CIO/CTO)','IT-SUP':'Administrator sistemesh / mbështetje TI','IT-DEV':'Zhvillues integrimesh / analist biznesi',
 'IT-SEC':'Analist sigurie','CC-AGENT':'Agjent i qendrës së thirrjeve','ADM-OFF':'Administrata e zyrës / objektet','BR-MGR':'Menaxher dege',
 'BR-RO':'Zyrtar i marrëdhënieve / shitjeve në degë','BR-TELLER':'Arkëtar',
}
COSTS = {
 'COST-TECH-CBS-IMPL':'Implementimi i njëhershëm i CBS të Facilization deri në nisje','COST-TECH-CBS-SUB':'Abonimi i Facilization (licenca, hostim, shërbime të menaxhuara; mesatare 5-vjeçare)',
 'COST-TECH-CBS-5Y':'Totali 5-vjeçar i ofertës së Facilization (vetëm referencë)','COST-TECH-VISA':'Anëtarësimi në Visa / procesori / platforma e kartelave (shih modulin Visa; USD)',
 'COST-TECH-EUC':'Pajisjet e përdoruesve (laptopë/kompjuterë/periferikë) për FTE të ri','COST-TECH-PROD':'Licencat e produktivitetit dhe bashkëpunimit (email, zyrë, siguria e pajisjeve)',
 'COST-TECH-NET':'Rrjeti i zyrës dhe telekomunikimi për lokacion','COST-TECH-NETCAPEX':'Pajisjet e rrjetit, muret mbrojtëse, kabllimi për lokacion',
 'COST-TECH-SWIFT':'Konfigurimi i lidhjes SWIFT (byro shërbimi)','COST-TECH-SWIFT-RUN':'Tarifat vjetore të SWIFT dhe të byrosë së shërbimit',
 'COST-TECH-CERT':'Domenet, certifikatat TLS, llogaritë në dyqanet e aplikacioneve','COST-TECH-CYBER':'Testet e depërtimit, red-team, zbulimi dhe reagimi i menaxhuar (nga banka)',
 'COST-TECH-DR':'Lokacioni i rimëkëmbjes nga fatkeqësitë / testimi DR (nëse nuk përfshihet në hostim)','COST-TECH-MIGR':'Migrimi i të dhënave të portofolit dhe klientëve të IFJB-së',
 'COST-TECH-CREDREG':'Tarifat e regjistrit të kredive','COST-TECH-ATM':'Blerja dhe instalimi i bankomatit (për bankomat)',
 'COST-TECH-ATM-RUN':'Mirëmbajtja, lidhja dhe furnizimi me para i bankomatit (për bankomat)','COST-PREM-HQ-RENT':'Qiraja e selisë (EUR për m² në muaj × m² e selisë)',
 'COST-PREM-HQ-FIT':'Rregullimi i selisë përfshirë sistemet e sigurisë (për m²)','COST-PREM-VAULT':'Trezori i selisë / qendra e parave',
 'COST-PREM-BR-RENT':'Qiraja e degës për degë','COST-PREM-BR-FIT':'Rregullimi i degës (sportele, kasafortë, kamera, alarme) për degë të re',
 'COST-PREM-SEC':'Roja sigurie, monitorimi i alarmit dhe transporti i parave për lokacion','COST-PREM-UTIL':'Shërbimet komunale, pastrimi, mirëmbajtja për lokacion',
 'COST-PREM-FURN':'Mobiljet dhe pajisjet e zyrës për FTE të ri','COST-PRO-001':'Këshilltari ligjor: rruga e licencimit, shndërrimi/transferimi, dokumentacioni i aksionarëve dhe pronarëve përfitues, kontratat',
 'COST-PRO-002':'Këshillimi rregullativ/për licencim dhe plani i biznesit (projeksione 3–5 vjeçare, teste stresi)','COST-PRO-003':'ICAAP/ILAAP, kuadri i rrezikut dhe paketa e politikave',
 'COST-PRO-004':'Auditimi i jashtëm statutor (vjetor)','COST-PRO-005':'Zhvillimi/validimi i modeleve SNRF 9, mbështetje aktuariale',
 'COST-PRO-006':'Bordi mbikëqyrës i Sheriatit dhe auditimi i Sheriatit (vjetor)','COST-PRO-006S':'Strukturimi i produkteve islame, kontratat dhe politikat kontabël',
 'COST-PRO-008':'Këshillimi tatimor','COST-PRO-009':'Zyra e menaxhimit të projektit / konsulentët e implementimit nga ana e bankës',
 'COST-REG-001':'Tarifa e aplikimit për licencë në BQK','COST-REG-002':'Tarifat mbikëqyrëse / vjetore të BQK-së',
 'COST-REG-003':'Primi i sigurimit të depozitave në FSDK (normë vjetore mbi depozitat e siguruara)','COST-REG-004':'Tarifat e pjesëmarrjes në sistemin e pagesave (KIPS), regjistrit dhe anëtarësimit',
 'COST-OTH-MKT-LAUNCH':'Fushata e markës dhe e lansimit','COST-OTH-MKT-RUN':'Marketingu i vazhdueshëm dhe tërheqja e depozitave',
 'COST-OTH-INS':'Sigurimi bankar (bankers\' blanket bond), D&O, kibernetik, i pronës','COST-HR-TRAIN':'Trajnimet dhe certifikimet (ACAMS, rreziku, SNRF) për FTE',
 'COST-HR-RECR':'Kostoja e rekrutimit (% e pagës bruto vjetore të çdo punonjësi të ri)','COST-HR-BEN':'Sigurimi shëndetësor privat dhe përfitimet për FTE',
 'COST-OTH-GA':'Udhëtimet, materialet e zyrës, postimi, shpenzime të tjera të përgjithshme për FTE','COST-OTH-CONT':'Rezerva për të paparashikuarat mbi kostot e njëhershme të themelimit',
}
REQS = {
 'REQ-LIC-001':'Të përcaktohet nëse Pro Finance Home Sh.A. (IFJB e licencuar) mund të shndërrohet në bankë përmes transformimit ligjor apo duhet të themelojë bankë të re dhe të transferojë asetet/detyrimet',
 'REQ-LIC-002':'Takim(e) para aplikimit me Departamentin e Licencimit të BQK-së para dorëzimit',
 'REQ-LIC-003':'Aplikim i plotë për licencë me të gjitha shtojcat dhe dëshminë e pagesës së tarifës së licencimit (aplikimet e paplota nuk shqyrtohen)',
 'REQ-LIC-004':'BQK miraton ose refuzon paraprakisht brenda 3 muajve nga aplikimi i plotë',
 'REQ-LIC-005':'Përmbushja e kushteve të miratimit paraprak, pastaj aplikimi për licencë përfundimtare; ekzaminimi në vend i BQK-së para hapjes',
 'REQ-CAP-001':'Kapitali fillestar minimal i depozituar në BQK para licencës përfundimtare: ≥ 7 mln € (rregullorja 2020 me referencë në 04/L-093 neni 15)',
 'REQ-CAP-002':'Kapitali i paguar duhet të mbetet në çdo kohë ≥ minimumit ligjor',
 'REQ-CAP-003':'Raporti i mjaftueshmërisë së kapitalit total ≥ 12% e APR',
 'REQ-CAP-004':'Raporti minimal i Nivelit 1 / CET1','REQ-CAP-005':'Tamponi ruajtës i kapitalit / tamponë të tjerë dhe shtesa e Shtyllës 2 (SREP)',
 'REQ-CAP-006':'Kërkesa për raportin e levës','REQ-CAP-007':'ICAAP dhe plani i kapitalit në planin e biznesit',
 'REQ-LIQ-001':'Asetet likuide ≥ 25% e detyrimeve afatshkurtra',
 'REQ-LIQ-002':'Kërkesa për rezervë minimale 10% e detyrimeve me maturim < 1 vit; deri në 50% si para në arkë',
 'REQ-LE-001':'Ekspozimi ndaj një klienti / grupi të lidhur ≤ 15% e kapitalit të Nivelit 1','REQ-LE-002':'Ekspozimet > 10% e Nivelit 1 kërkojnë miratim paraprak të bordit',
 'REQ-LE-003':'Kufijtë dhe miratimi i ekspozimeve ndaj palëve të lidhura','REQ-FX-001':'Pozicioni i hapur neto valutor ≤ 15% e Nivelit 1',
 'REQ-OWN-001':'Miratimi paraprak i BQK-së për aksionarët me pjesëmarrje cilësore/kyçe; përshtatshmëria dhe ndershmëria; burimi i fondeve',
 'REQ-GOV-001':'Bordi i drejtorëve në përputhje me rregullat e përbërjes/pavarësisë të Rregullores për qeverisjen korporative',
 'REQ-GOV-002':'Komiteti i auditimit dhe komiteti i rrezikut i bordit (nuk kërkohen për degët e huaja)',
 'REQ-GOV-003':'Miratimi paraprak i BQK-së për menaxherët e lartë (CEO dhe mbajtësit e funksioneve kyçe) – përshtatshmëria dhe ndershmëria',
 'REQ-GOV-004':'Funksion i pavarur i auditimit të brendshëm që raporton te komiteti i auditimit','REQ-GOV-005':'Funksione të pavarura të menaxhimit të rrezikut dhe të pajtueshmërisë',
 'REQ-AML-001':'Programi PPP/LFT; zyrtar i caktuar për PPP; KYC/CDD; kontrolli i sanksioneve; raportimi i transaksioneve të dyshimta te NjIF-K',
 'REQ-DIS-001':'Anëtarësimi në FSDK dhe pagesa e primeve të bazuara në rrezik mbi depozitat e siguruara',
 'REQ-REP-001':'Raportimi rregullativ te BQK sipas Rregullores për raportimin e bankave',
 'REQ-ISL-001':'Banka islame / dritarja islame e përkufizuar në ligj; nuk u gjet rregullore specifike e BQK-së për bankingun islam',
 'REQ-PAY-001':'Pjesëmarrja në sistemin ndërbankar të pagesave të BQK-së (KIPS) dhe në regjistrin e kredive',
 'REQ-OPS-001':'Ambiente që plotësojnë standardet e sigurisë; trezori; vazhdimësia e biznesit/rimëkëmbja nga fatkeqësitë',
 'REQ-OUT-001':'Transferimi te palë të treta i funksioneve materiale (përfshirë hostimin/shërbimet e menaxhuara të CBS) i nënshtrohet rregullave/njoftimit të BQK-së',
}
SECTOR = {
 'SEC-001':'Totali i aseteve të sektorit bankar','SEC-002':'Kreditë e sektorit bankar','SEC-003':'Raporti i KJP-ve në sektorin bankar','SEC-004':'Fitimi neto i sektorit bankar',
 'SEC-005':'Kapitali i sektorit bankar','SEC-006':'Pjesa e 5 bankave më të mëdha në asete','SEC-007':'Numri i bankave komerciale','SEC-008':'Numri i bankave',
 'SEC-009':'KNA e sektorit','SEC-010':'KNE e sektorit','SEC-011':'Raporti i mjaftueshmërisë së kapitalit të sektorit','SEC-012':'RMK e sektorit',
 'SEC-013':'Treguesi i likuiditetit të sektorit','SEC-014':'Norma efektive e interesit për kreditë','SEC-015':'Norma efektive e interesit për depozitat',
 'SEC-016':'Terminalet POS','SEC-017':'Bankomatët','SEC-018':'Llogaritë bankare','SEC-019':'Paga mesatare bruto mujore (ekonomia)',
 'SEC-020':'Paga mesatare bruto e veprimtarisë më të paguar (TIK)','SEC-021':'Paga minimale','SEC-022':'Mbulimi i sigurimit të depozitave për depozitues për bankë',
}
SALARY = {
 'SAL-001':'Të gjithë punonjësit (mesatarja e ekonomisë)','SAL-002':'Të gjithë punonjësit (mesatarja e ekonomisë)','SAL-003':'Të gjithë punonjësit (mesatarja e ekonomisë)',
 'SAL-004':'Mesatarja e sektorit të informacionit dhe komunikimit','SAL-005':'Mesatarja e sektorit publik','SAL-006':'Mesatarja e sektorit privat','SAL-007':'Paga minimale ligjore',
 'SAL-008':'Kostoja e personelit për punonjës në banka','SAL-009':'Pagat specifike për role në banka (shpallje pune)',
}

def add(file, idcol, col, mapping, after):
    p = R / file
    rows = list(csv.DictReader(p.open(encoding='utf-8-sig')))
    fields = list(rows[0].keys())
    if col not in fields:
        fields.insert(fields.index(after) + 1, col)
    missing = [r[idcol] for r in rows if r[idcol] not in mapping]
    if missing:
        sys.exit(f'{file}: missing Albanian for {missing}')
    for r in rows:
        r[col] = mapping[r[idcol]]
    with p.open('w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader(); w.writerows(rows)
    print(f'{file}: {col} ({len(rows)} rows)')

add('hr_roles.csv', 'role_id', 'role_sq', ROLES, 'role')
add('cost_database.csv', 'cost_id', 'item_sq', COSTS, 'item')
add('cbk_requirements.csv', 'requirement_id', 'requirement_sq', REQS, 'requirement')
add('sector_indicators.csv', 'indicator_id', 'label_sq', SECTOR, 'label')
add('kosovo_bank_salary_evidence.csv', 'evidence_id', 'role_or_scope_sq', SALARY, 'role_or_scope')
