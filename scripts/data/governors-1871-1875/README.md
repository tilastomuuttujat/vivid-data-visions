# Nälkävuosien jälkeiset vuodet 1871–1875

Lähde: [Yleinen katsaus Suomen taloudelliseen tilaan vuosina 1871–1875 (1879)](https://otos.stat.fi/server/api/core/bitstreams/f391a505-9559-4464-bf71-80c6ae66b2cb/content). Vuosittaiset lääkärit, apteekit, rokonpanot ja hoidettujen määrät ovat painetuilla sivuilla 81–82; sato- ja kauppataulut sivuilla 104–107. Vuoden 1875 kokonaisuuden aiempi köyhäinhoitopoiminta on tallennettu lähdeavaimella `poorrelief_svt1879`.

Satotaulukossa on läänikohtaisia kysymysmerkkejä ja viivoja. Sen koko maan summia ei automaattisesti pidetä kattavina vaan kaikki 25 satolukua on tallennettu julkaisemattomina tarkistusta varten. Jauhamattoman viljan kauppa ja jauhojen kauppa ovat eri sarjoja eri yksiköillä. Molemmissa kokonaismäärät sisältävät osaluokat. Hoidettujen määrät eivät välttämättä ole yksilöityjä henkilöitä, ja sairaalaluokkien vertailu edeltävään julkaisuun vaatii tarkistusta.

Sarjoihin on tallennettu lähteen historiallinen alue, alkuperäiset yksiköt ja sivuviitteet. Ne eivät syötä automaattista yhdistelmäindeksiä. `python build.py` tuottaa deterministisen tietoaineiston ja toistettavan SQL-tuonnin; uusi sisältö vaatii uuden eräversion.
