# Organizimi i propozuar: Banka Pro Finance, vitet 1 deri 3

*Përkthim pune nga versioni anglisht.*

Struktura ndjek kërkesat e raportuara në Kosovë: një bord me komitete të auditimit dhe të rrezikut, funksione të pavarura kontrolli, miratim i përshtatshmërisë dhe ndershmërisë së menaxhmentit të lartë, dhe një zyrtar për PPP. Aty ku një rregull nuk mund të verifikohej, boshllëku plotësohet me praktikën e zakonshme të mirë për një bankë të re. Detajet sipas roleve, numri i FTE-ve sipas skenarit dhe shkallët e pagave janë në `hr_roles.csv`, ndërsa moduli i Stafit në platformë i llogarit drejtpërdrejt numrin e punonjësve dhe kostot.

```
                    Asambleja e Përgjithshme e Aksionarëve
                                      │
            Bordi i Drejtorëve (Kryetari + drejtorë të pavarur + drejtor i aksionarëve)
      ┌──────────────────┬────────────┴──────────────┬───────────────────────┐
 Komiteti i Auditimit  Komiteti i Rrezikut  (Shpërblimet/Emërimet – i rekomanduar)  (Bordi i Sheriatit – nëse ka dritare islame)
      │                  │
 Shefi i Auditimit    Shefi i Rrezikut (CRO) ── Analistë rreziku · Mashtrimet · CISO (vijë me pika) ─ Analist sigurie
 të Brendshëm ─           │
 auditorë                 │              Shefi i Pajtueshmërisë (CCO) ─ Zyrtarë pajtueshmërie · DPO
                          │              Zyrtari për PPP/LFT ─ Analistë PPP
                                      │
                         Kryeshefi Ekzekutiv (CEO)
  ┌───────────┬──────────────┬──────┴───────┬──────────────┬───────────────┐
 Zv/COO       CFO           CIO/CTO      Shefi i Kreditimit  Shefi i Thesarit   Biznesi (Pakicë, Lizing, Financim mallrash, Kartela dhe digjitale, Produkti, Marketingu)
  │            │              │             │                  │
 Operacionet  Kontrolli fin.  Mbështetje TI  Analistë krediti   Analist ALM
 (zyra mbështetëse, Kontabiliteti  Zhvillues     Administrimi i kredive
 pagesat, KYC, Raportimi rregull.  integrimesh  Arkëtimi
 qendra e thirrjeve, Ligjore · BNJ ·
 degët)       Prokurimi
```

## Pavarësia dhe ndarja e detyrave

* **Auditimi i brendshëm** raporton funksionalisht te Komiteti i Auditimit dhe administrativisht te CEO.
* **CRO, CCO dhe Zyrtari për PPP** kanë qasje të drejtpërdrejtë te Komiteti i Rrezikut dhe te Bordi. Shpërblimi i tyre nuk lidhet me objektivat e biznesit; modeli u jep roleve të kontrollit përqindje më të ulët bonusi.
* **Analiza dhe miratimi i kredive** (Shefi i Kreditimit) janë të ndara nga **shitjet** (zyrtarët e marrëdhënieve dhe kanali i tregtarëve). Administrimi dhe disbursimi i kredive janë të ndara nga miratimi.
* **Zyra e përparme e thesarit** është e ndarë nga **shlyerja në zyrën mbështetëse** (Operacionet) dhe nga **matja e rrezikut** (CRO).
* **CISO** është i pavarur nga CIO; kjo rekomandohet, me një vijë raportimi me pika te CRO.
* **Arkëtarët:** të paktën dy për degë, për kontroll të dyfishtë të parave dhe të trezorit.

**Pika referuese:** një burim dytësor raporton se PriBank kishte **176 punonjës** në 2025, vitin e saj të katërt, me rreth 156 mln € asete totale. Kjo nuk është verifikuar. Numri i punonjësve në rastin bazë duhet të pajtohet me numrin e audituar të PriBank pasi të shkarkohen raportet e saj.

**30, 40 dhe 50 përdoruesit e brendshëm të CBS janë vende licence, jo punonjës.** Modeli i mban si tregues të veçantë dhe i krahason me FTE si kontroll.
