# Murrokset: päätösten taustat ja seuraukset

`DecisionNetwork` adapts the incoming/outgoing relation browser and interpretation / comparison / data views from [TTT's pressure map](https://github.com/tilastomuuttujat/TTT/blob/e9b1c03c67fe7f122574da96ee2276b093c018dc/atlas/murros/arviointikartta-paine.html) to React. It does not execute the original HTML, call Supabase, or import its heuristic pressure/evidence scores.

## Data and attribution

- Source: `tilastomuuttujat/TTT`, `atlas/murrosatlas.json`, pinned commit `e9b1c03c67fe7f122574da96ee2276b093c018dc`.
- Snapshot: `src/data/murros-network.json`, 340 nodes and 642 directed relations. Node text, source references, relation types, rationales and confidence labels come from that source; they have not been independently verified.
- `source.blobSha` records the original Git blob. `source.url` links to the precise version.
- Snapshot edge IDs (`ttt-r1`, etc.) follow the order of the source `relations` array. They are local identifiers within a snapshot, not stable upstream relation IDs.
- Original node dates are retained, including cases where a card uses an enactment year and the decision timeline uses an implementation year. Future/scenario nodes are labelled separately.

## Decision crosswalk

`decision-network-model.ts` contains explicit mappings for 63 of the 116 decisions to TTT node IDs. Mappings distinguish a decision counterpart from broader context and carry a textual explanation. Broad context does not transfer all of a phenomenon's relations to the individual law. The remaining 53 decisions show an empty state; titles and dates never generate fallback connections.

The browser follows one-hop directed edges and lets readers recenter on a neighbour. It never completes a chain with unconnected nodes. "Consequences" describes outgoing source relations, which may include association, parallel development, scenarios or unverified causal claims.

## Evidence and interpretation

Confidence is explicitly attributed to TTT. A source's "vahva" label is not independent validation of an effect. The source snapshot has no separate research citations per edge, so the UI says that effect evidence remains unverified and links to the source record instead of inventing citations. Decision citations remain separate. Laboratory links provide observational context, not automatic causal confirmation.

## Refresh and verify

```sh
python scripts/data/import-murros-network.py <40-character-TTT-commit-sha>
npx vitest run src/components/murrokset/decision-network.test.tsx
npx tsc --noEmit
npx vite build -c scripts/standalone/vite.config.ts
```

Review mappings, node sources and changed relations after refresh. The importer validates unique node IDs and edge endpoints before replacing the snapshot. Tests also verify the decision crosswalk and incoming/outgoing navigation.

The browser is loaded lazily from `Murrokset`; its JSON is bundled for both the app and standalone exports. It needs no additional runtime data files or database credentials.

## Systeeminen aikajana

`AnchorTimeline` yhdistää seitsemän toimituksellista ankkuriryhmää ja saman kiinnitetyn
TTT-relaatioaineiston. Kokonaiskuva näyttää vain eri ankkureihin kuuluvien lähdekorttien
väliset suorat relaatiot. Ankkurin valinta näyttää sen korttien suorat taustat ja
seuraukset; kahden askeleen tarkastelu kulkee lähdeverkkoa suunnatusti taakse- ja/tai
eteenpäin. Ankkurijäsenyys ei muodosta uutta relaatiota eikä oikeuta oikaisemaan polkua
ryhmän eri korttien välillä. Syklit eivät kasvata hakua loputtomasti.

Vaaka-asema määräytyy kortin `yearStart`-kentästä, ei ankkurin toimituksellisen aikavälin
keskipisteestä. Pystyrivit ovat ryhmittelyä; samanaikaisten korttien alarivit estävät
päällekkäisyyksiä eivätkä esitä vaikutusjärjestystä. Vuosiluvuttomat kortit ja niiden
relaatiot säilyvät tekstimuodossa. Skenaariokortit erotetaan katkoviivalla ja tekstillä.

Nuolenkärki on aina lähderelaation `to`-päässä myös silloin, kun vuosiluvut kulkevat
ajassa taaksepäin. Väri kokoaa relaatiotyyppejä olemassa oleviin kaariryhmiin; paksuus,
pisteen koko ja rivijärjestys eivät mittaa vaikutusta. Luvut kuvaavat relaatioiden tai
yksilöllisten tausta-/seurauskorttien määriä lähdeaineistossa, eivät todistettua voimaa.
Kahden askeleen polku ei ole validoitu välillinen vaikutus. Yhteyksien tekstiluettelo
sisältää alkuperäiset tunnisteet ja suorat päätepisteet tarkistusta varten.

Tarkista muutoksissa lähdesuunnan säilyminen, syklit, yhden/kahden askeleen rajaus,
vuosien leikkaamattomuus, puuttuvien vuosien käsittely, nuolten näppäimistökäyttö,
vaaka- ja pystyvierityksessä näkyvät riviotsikot/vuosiviivain sekä siirtyminen juuri
valittuun lähdekorttiin Taustat ja seuraukset -näkymässä.

## Murrosmaisema: saman aikajanan tiivistelmä

Maisema käyttää samoja `ANCHORS`-ryhmiä, `anchorLinks()`-relaatioita ja
`anchorTimeline()`-polkuhakua kuin systeeminen aikajana. Kokonaiskuva tiivistää
seitsemän ankkuria aikaväliensä keskipisteisiin ja niputtaa saman lähtö- ja
kohdeankkurin suorat lähderelaatiot. Jokainen nippu säilyttää kaikki alkuperäiset
relaatiotunnisteet, päätekortit ja suunnat. Ryhmän eri korttien välille ei muodosteta
uutta polkua. Yhteydettömälle ankkurille ei päätellä kaarta.

Ankkurin avaaminen tuo samaan näkymään sen yksittäiset lähdekortit oikeille
alkamisvuosilleen. Kortit ryhmitellään taustoihin, ankkurin omiin kortteihin,
molemminsuuntaisiin yhteyksiin ja seurauksiin. Pystysijainti palvelee luettavuutta;
se ei ole vaikutuksen suunnan tai voimakkuuden asteikko. Vuosiluvuttomat kortit ja
relaatiot säilyvät tekstiluettelossa. Skenaariokortit merkitään, mutta aineistoon ei
lisätä laskennallisia tulevaisuusjatkeita.

Teemalinssit muuttavat vain olemassa olevan verkoston korostusta. Teemat saadaan
päätösaineiston eksplisiittisistä teemoista ja `decisionMappings`-vastineista.
Yhdistelmäteema voi kuulua useaan linssiin. Kytkemättömän lähdekortin teemaa ei
päätellä otsikosta. Poista teemakorostus palauttaa saman kokonaiskuvan; se ei muuta
lähderelaatioiden tai ankkurien määrää. Aiemmat arvioluokkien numeeriset pisteet,
niistä tasoitetut käyrät, hajontanauhat ja skenaariotavoitteet on poistettu.

## Yhteiset murroskohtien katkoviivat

Murrosmaiseman seitsemän ankkuria sijoittuvat omille riveilleen samalle vuosiasteikolle.
Vasemmalla pysyvät nimet tukevat vaakavieritystä. `TimelineMilestones` piirtää
murrosmaisemaan, avattuun korttiaikajanaan ja täyteen systeemiseen aikajanaan samat
viivat vuosille 1918, 1939, 1991, 2008 ja 2020. Vuodet viittaavat olemassa olevien
`TURNS`-kriisijaksojen alkuun. Nimi, koko jakson aikaväli ja selitys avautuvat
hiirellä, Enterillä tai välilyönnillä. Kuvaajan ulkopuoliset vuodet jätetään piirtämättä.

Kultaiset katkoviivat erottuvat himmeästä vuosiruudukosta ja jatkuvat kaikkien rivien
läpi samalla x-koordinaatilla. Otsikot porrastetaan erillisille riveille tilan mukaan.
Viivat ovat toimituksellisia ajallisia kiinnekohtia; ne eivät lisää relaatioita tai
osoita tapahtuman vaikuttaneen kaikkiin ankkureihin. Lähteeseen kirjatut vaikutusväitteet
säilyvät erillisinä suunnattuina nuolina.

## Seitsemän kokonaista kaarikuviota allekkain

`Ankkurit` näyttää oletuksena seitsemän erillistä kaarikuvaajaa järjestyksessä 1–7.
Jokaisessa on yksi korostettu ankkuri, kuusi himmeää vertailuankkuria, yläpuolella
juuri tämän ankkurin yhteydet muihin ankkureihin ja alapuolella sen muut lähdekorttiyhteydet.
Kyse on kokonaisten kaarikuvioiden pinoamisesta, ei vain ankkuripisteiden porrastamisesta.

Kaikki kuvaajat käyttävät samaa kaikkien ankkurien aineistosta laskettua vuosiasteikkoa.
Näkyvien paneelien valinta ei muuta asteikkoa. Vaakavieritys synkronoidaan paneelien
välillä ja murroskohtien katkoviivat osuvat samaan x-koordinaattiin jokaisessa kuviossa.
Yhteinen relaatio voi näkyä kummankin osapuolen paneelissa; se on sama lähderelaatio,
ei kaksi erillistä vaikutusta. Tyhjennä poistaa kaikki paneelit ilman oletusvalintaa.
