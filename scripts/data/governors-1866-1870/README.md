# Nälkävuodet: 1866–1870

Lähde: [Katsaus Suomen taloudelliseen tilaan vuosina 1866–1870 (1875)](https://otos.stat.fi/server/api/core/bitstreams/9524d9c0-8d11-4727-80c9-ebd345dd268c/content), taulut B, C ja U sekä leipätekstin metsä- ja rokotustiedot. Numeroita on tarkasteltu lähteen sivukuvista ja tekstintunnistuksesta. Sama lähde on jo rekisteröity köyhäinhoidon lähteeksi `poorrelief_svt1875`.

Poiminta käsittää koko maan viljalajeittain ilmoitetun sadon, jauhamattoman viljan tuonnin ja viennin, valitut sairaanhoitolaitokset, rokonpanot ja niiden suhteen syntyneisiin sekä kaksi metsätuotteiden vientimäärää. Lähteen kaksi metsäala-arviota tallennetaan julkaisemattomiksi, koska niiden tarkka ajankohta sekä vertailukelpoisuus vuoden 1865 kruununmetsäarvioon vaativat selvittämistä; vuosi 1870 on jakson pääte, ei mittausvuosi.

Tuonti ja vienti koskevat jauhamatonta viljaa eivätkä kuvaa kaikkea elintarviketuontia. Kokonaiserät sisältävät osiaan. Sairaalatilastossa hoidettujen mitta ei välttämättä tarkoita eri henkilöitä, ja viiva jätettiin puuttuvaksi. Rokonpanojen ja syntyneiden suhde ei ole syntymäkohortin rokotuskattavuus. Alueet ja historialliset mittayksiköt säilytetään; aineisto ei osallistu automaattiseen yhdistelmäindeksiin.

`python build.py` tuottaa lähdesidonnaisen `batch.json`-aineiston ja idempotentin SQL-tuonnin. Lähdelukujen päivitykselle on annettava uusi erätunnus.
