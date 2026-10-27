# Katsaus Suomen taloudelliseen tilaan 1896–1900

Lähde: [Tilastollinen päätoimisto, 1904](https://otos.stat.fi/items/b3314e89-09b9-48b5-9df8-6e20c38daffc). Käyttäjän toimittaman PDF:n SHA-256 ja tarkistetut sivunumerot tallennetaan erään. Poiminta sisältää makasiinien varastot, rokotukset, köyhäinhoidon avun muodot, alueosuudet ja talouden sekä yleisten sairaaloiden lasarettien hoidetut ja hoitopäivät.

Lähteen köyhäinhoidon avunsaajien vuosisumma muodostuu vuoden lopussa hoidettujen ja vuoden aikana kuolleiden summasta. Sitä ei pidä olettaa kaikkien vuoden aikana apua saaneiden lukumääräksi. Aineisto ei mittaa kaikkia köyhiä. Vanhan ikäjaon tasan 15-vuotiaiden käsittely on tarkistettava. Historialliset lääni- ja valtiorajat poikkeavat nykyisistä. Köyhäinhoidon menoista on jätetty erikseen mainittuja aikaisempien vuosien eriä pois, joten vertailukelpoisuus aiempiin kokonaiskuluihin edellyttää tarkistusta. Raha on nimellistä markkaa.

Makasiinien fyysinen viljamäärä sisältyy kirjanpidolliseen eikä niitä summata. Rokotusten osaryhmät sisältyvät kokonaisuuteen. Sairaalan hoidettuja koskevan lähteen laskentatapa ei välttämättä kuvaa erillisiä henkilöitä. Havaintoja ei sisällytetä automaattisesti yhdistelmäindeksiin.

`python build.py` tuottaa deterministisen batchin ja idempotentin SQL-tuonnin; muutoksille on käytettävä uutta erätunnusta.
