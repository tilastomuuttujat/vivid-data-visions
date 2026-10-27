# Poiminta: köyhäinhoito 1901 ja tilastollinen vuosikirja 1904

Käyttäjän toimittamien alkuperäisten PDF-tiedostojen sivukuvista tarkistettuja havaintoja. `build.py` tuottaa erilliset lähdekohtaiset JSON-erät ja idempotentit tuontiskriptit `poor1901.sql` ja `yearbook1904.sql`. `verify-old.sql` tarkistaa aiempien kuuden tarkistustilassa olleen havainnon arvot ja merkitsee ne vahvistetuiksi; aiempaa sisältöä ei kopioida. Lähde-PDF:ien SHA-256 on erissä. Tuonnit ja vahvistus tehdään erillisinä transaktioina.

Köyhäinhoidon alueittaiset vuosisummat ovat lähteen omien huomautusten mukaan likimääräisiä ja koskevat nimettyjä suoria avunsaajia, eivät kaikkia köyhiä. Laitoksissa hoidettujen määrään sisältyy myös Sortavalan yksityiseen diakoniakotiin kaupungin kustannuksella sijoitettuja. Läänirajat ovat historiallisia. Vuosikirjan makasiinien fyysiset varat sisältyvät kirjanpitovarastoon. Havaintoja ei yhdistetä automaattisesti yhdistelmäindeksiin.
