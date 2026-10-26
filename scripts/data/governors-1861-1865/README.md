# Kuvernöörien kertomukset 1861–1865: rajattu poiminta

Lähde on [vuonna 1868 julkaistu yhteenveto](https://otos.stat.fi/server/api/core/bitstreams/75024954-72e7-46d1-90fd-a72b5f731366/content). Tietokannassa on aiemmin samasta julkaisusta köyhäinhoidon poiminta (`poorrelief_svt1868`); tämä täydentää sitä terveydenhuollon, viljavarastojen ja metsien tiedoilla.

Vuotuiset lääkäri- ja rokonpanomäärät 1861–1865, 1865 kirjalliset viljavarastot, kruununmetsän arvioitu ala ja metsähallinnon henkilöstö sekä metsäntuotteiden vientiarvot poimittiin painetuilta sivuilta 7, 21 ja 22 (PDF-sivut 10, 24 ja 25). Lähdesivut katsottiin sivukuvista. Luvut säilyttävät lähteen aluerajauksen ja alkuperäiset yksiköt.

Varastot sisältävät mahdollisesti ulos lainattuja eriä, pinta-ala on vain kruununmetsille, ja vienti on markkamääräistä arvoa. Metsävienti yhteensä sisältää sen puuaineiden osan. Sarjoja ei lasketa automaattisesti yhdistelmäindeksiin, eikä niitä rinnasteta ilman käsitetarkistusta myöhempiin vuosihavaintoihin. Lähteen tekijöiden tulkinnat katovuosien syistä tai metsänhoidon vaikutuksista eivät ole erillisiä kausaalivaikutusarvioita.

`python build.py` tarkistaa aineiston muodon ja tuottaa idempotentin SQL-tuonnin; lähteen tai arvojen tarkentaminen edellyttää uuden erätunnuksen. Lähteen aiempi tietokantarekisteri säilytetään.
