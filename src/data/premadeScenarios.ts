import { GameConfig, Scene } from "../types";

export interface SavedScenario {
  id: string;
  title: string;
  description: string;
  config: GameConfig;
  scenes: Scene[];
  isPremade?: boolean;
  epilogueText?: string;
  judgmentText?: string;
}

// 2-Player (Duo) Showcase Scenario: "Speed Dating - Ohjaajan Valinta"
const PREMADE_SPEED_DATING_SCENARIO: SavedScenario = {
  id: "premade-speeddating-2p",
  title: "Speed Dating - Ohjaajan Valinta (2 pelaajaa, 10 kohtausta)",
  description: "Reality-sarjan kuvauksissa sattuu moka: päähenkilölle ei ole paria. Ohjaaja astuu kameran eteen pelastaakseen ohjelman.",
  isPremade: true,
  epilogueText: "Kameroiden punaiset valot sammuvat ja studiohiljaisuus rikkoutuu miksaajan syvään huokaisuun. Speed Dating -sarja sai kaikkien aikojen hämmentävimmän materiaalin, mutta kun mikrofonit riisutaan, Sofia ja Leo katsovat toisiaan täysin ilman linssejä tai muistikirjoja. Oli kyseessä sitten loistava show tai todellinen tunne, ohjaaja ja osallistuja poistuvat paikalta yhdessä käsi kädessä – jättäen tuotantotiimin täydellisen hämmennyksen valtaan.",
  judgmentText: "Harvinaislaatuisen pitkä ja kauniisti kehittyvä 10-kohtauksinen kokemus osoitti, kuinka herkkää kemiaa ja upeaa rytmitystä kahden pelaajan välille voi syntyä ilman jatkuvaa ylidraamaa.",
  config: {
    theme: "Reality-TV Speed Dating",
    initialIdea: "Speed dating -sarjan 'Rakkautta Ruudussa' kuvaukset käyntiin. Paria ei löytyy, ja hätääntynyt ohjaaja pelastaa tilanteen tekemällä jotain odottamatonta.",
    totalScenes: 10,
    players: [
      { id: "p1", name: "Sofia", role: "Match-hakija", secret: "Epäilee kaikkea pelkäksi julkisuustempuksi eikä luota kymmenen kohtaamisen aikana ohjaajan motiiveihin, mutta huomaa ihastuvansa tämän haavoittuvuuteen." },
      { id: "p2", name: "Leo", role: "Ohjaaja", secret: "Kameroiden takana hänen uransa on katkolla. Hän teeskentelee aluksi itsevarmalta ohjaajalta pelastaakseen budjetin, mutta huomaa unohtavansa koko ohjelman Sofian silmien edessä." }
    ]
  },
  scenes: [
    {
      sceneNumber: 1,
      sceneTitle: "1. Kamerat käyntiin",
      narrativeIntroduction: "Kuvaukset alkavat nuhruisessa studiokahvilassa. Sofia istuu valokeilassa. Leo seisoo vielä kameran takana sekuntikello kädessään antaen merkkejä.",
      dramaticArcPhase: "Esittely",
      playerTasks: [
        {
          characterName: "Sofia",
          socialActionCategory: "Toteava",
          concreteActionCategory: "Monologi",
          targetCharacter: "Kaikki",
          instructionPrefix: "Katso suoraan kuvitteelliseen kameraan (tai vähän sen ohi). Pyri lukemaan seuraavat repliikit samalla, kun Leo antaa ohjeita:",
          dialogueLines: [
            "Heei, mä oon Sofia ja oon tullut etsiin siis...",
            "Etsin semmosta rehellistä ja luonnollista kumppania..."
          ],
          instructionPostfix: "Korjaile asentoasi ja odota ohjeita.",
          gamePurpose: "Sofia luo reality-ohjelman alkujännityksen ja tuo esiin oman kyynisen asenteensa."
        },
        {
          characterName: "Leo",
          socialActionCategory: "Tavoitteleva",
          concreteActionCategory: "Fyysinen ele",
          targetCharacter: "Sofia",
          instructionPrefix: "Seiso kameran takana. Keskeytä ja opasta Sofiaa suuri eleisesti:",
          dialogueLines: [
            "Hymyä sofia hymyä, tämä menee valtakunnan verkkoon!",
            "rennompi asento RENNOMPI ASENTO. ja pää enemmän.. noin."
          ],
          instructionPostfix: "Puhise, ja peitä kasvojasi kädellä. Tarkkaile kelloa.",
          gamePurpose: "Leo yrittää pitää yllä tyylipuhdasta ohjaajan roolia stressin keskellä."
        }
      ]
    },
    {
      sceneNumber: 2,
      sceneTitle: "2. Suora ohjeistus",
      narrativeIntroduction: "Aika kuluu, eikä varattua treffikumppania näy missään. Leo saa korvanappiinsa viestin tuottajalta ja alkaa selvästi panikoida.",
      dramaticArcPhase: "Esittely",
      playerTasks: [
        {
          characterName: "Sofia",
          socialActionCategory: "Kysyvä",
          concreteActionCategory: "Dialogi",
          targetCharacter: "Leo",
          instructionPrefix: "Katso suoraan Leoon lavasteiden taakse. Kysy hieman ironisesti ja haastavasti:",
          dialogueLines: [
            "Onko se täydellinen unelmamies juuttunut sateeseen, vai miksi me täällä odotellaan?"
          ],
          instructionPostfix: "Rumputa sormillasi hitaasti pöydän pintaa ja virnistä haastavasti.",
          gamePurpose: "Sofia nauttii tuotannon pienestä kaaoksesta ja asettaa ohjaajan tiukille."
        },
        {
          characterName: "Leo",
          socialActionCategory: "Toteava",
          concreteActionCategory: "Siirtyminen",
          targetCharacter: "Sofia",
          instructionPrefix: "Astu ripeästi varjoista suoraan valokeilaan Sofian viereen. Korjaa hienovaraisesti hänen kuvitteellista mikrofoniaan ja totea kuiskaten:",
          dialogueLines: [
            "Kuvausryhmä odottaa meiltä nyt dynaamista asennetta. Hoidetaan tämä."
          ],
          instructionPostfix: "Pyyhi hiki otsaltasi ja katso hätääntyneenä ympärillesi.",
          gamePurpose: "Leo pyrkii hallitsemaan tilannetta fyysisellä läsnäololla ennen kuin tekee kovan päätöksen."
        }
      ]
    },
    {
      sceneNumber: 3,
      sceneTitle: "3. Hätäinen loikkaus",
      narrativeIntroduction: "Leo repii korvanappinsa korvastaan, vetää syvään henkeä ja istuu vastakkaiselle tuolille, johon deitin oli määrä tulla.",
      dramaticArcPhase: "Esittely",
      playerTasks: [
        {
          characterName: "Sofia",
          socialActionCategory: "Selvittävä",
          concreteActionCategory: "Fyysinen ele",
          targetCharacter: "Leo",
          instructionPrefix: "Tuijota Leoa herkeämättä. Kysy suoraan kuvitteellisten kameroiden käydessä:",
          dialogueLines: [
            "Aiotko sinä, herra ohjaaja, muka olla minun treffikumppanini?"
          ],
          instructionPostfix: "Nosta kulmakarvaasi ja hymähdä epäuskoisesti.",
          gamePurpose: "Sofia haluaa haastaa Leon täysin epäuskottavasta reality-ratkaisusta."
        },
        {
          characterName: "Leo",
          socialActionCategory: "Tavoitteleva",
          concreteActionCategory: "Dialogi",
          targetCharacter: "Sofia",
          instructionPrefix: "Astu rohkeasti valokeilaan ja istu vastapäätä Sofiaa:",
          dialogueLines: [
            "Miksi ei? Minähän tiedän tarkalleen mitä loistavat treffit vaativat. Aloitetaan."
          ],
          instructionPostfix: "Lyö kätesi yhteen aloitusklaffin merkiksi.",
          gamePurpose: "Leo yrittää näytellä unelmatreffikumppania pelastaakseen show'n, vaikka sisällä kiehuu."
        }
      ]
    },
    {
      sceneNumber: 4,
      sceneTitle: "4. Ensimmäinen deittikysymys",
      narrativeIntroduction: "Aito keskustelu alkaa. Katon ripustettu mikrofoni poimii jokaisen henkäyksen. Ilma on sähköinen mutta oudon absurdi.",
      dramaticArcPhase: "Esittely",
      playerTasks: [
        {
          characterName: "Sofia",
          socialActionCategory: "Tavoitteleva",
          concreteActionCategory: "Dialogi",
          targetCharacter: "Leo",
          instructionPrefix: "Kysy kaavamaisia treffikysymyksiä hymyillen mutta haastavasti:",
          dialogueLines: [
            "Mikä on intohimosi elämässä?",
            "Miksi naiset yleensä jättävät sinut?"
          ],
          instructionPostfix: "Siemaile kuvitteellista lasiasi rauhallisesti kysymyksen jälkeen.",
          gamePurpose: "Sofia testaa, osaako ohjaaja vastata omiin naurettaviin käsikirjoituksiinsa."
        },
        {
          characterName: "Leo",
          socialActionCategory: "Toteava",
          concreteActionCategory: "Monologi",
          targetCharacter: "Kaikki",
          instructionPrefix: "Vastaa Sofian kysymyksiin hieman liiankin rehellisesti:",
          dialogueLines: [
            "Intohimoni on tarkkailla muiden ihmisten tarinoita herkeämättä varjoista.",
            "...ehkä koska oma elämäni on liian sekaisin."
          ],
          instructionPostfix: "Naurahda vaisusti itsellesi.",
          gamePurpose: "Leo alkaa lipsunutta käsikirjoitetusta 'hurmuri'-roolistaan aitoon haavoittuvuuteen."
        }
      ]
    },
    {
      sceneNumber: 5,
      sceneTitle: "5. Käsikirjoituksen hylkäys",
      narrativeIntroduction: "Yhtäkkiä takahuoneesta kuuluu kova kolautus, mutta kamerat käyvät yhä. Kumpikaan ei käänny katsomaan sitä. Syntyy pitkä, piinaava ja kiusallinen hiljaisuus – Leo on ihastunut eikä keksi sanottavaa, Sofia odottaa ohjausta.",
      dramaticArcPhase: "Esittely",
      playerTasks: [
        {
          characterName: "Sofia",
          socialActionCategory: "Toteava",
          concreteActionCategory: "Monologi",
          targetCharacter: "Kaikki",
          instructionPrefix: "Puhu hiljaa ja huomaamattomasti itsellesi. Tsemppaa itseäsi muistuttamalla, että tämä on vain reality-sarja:",
          dialogueLines: [
            "Muista, Sofia. Tämä on pelkkää viihdettä.",
            "Pysy tyynenä. Tämä menee pian ohi."
          ],
          instructionPostfix: "Puhalla ilmaa ulos keuhkoistasi ja tuijota Leoa herkeämättä.",
          gamePurpose: "Sofia tsemppaa itseään muistuttamalla että tämä on vain realitysarja raivaten paniikkia pois."
        },
        {
          characterName: "Leo",
          socialActionCategory: "Toteava",
          concreteActionCategory: "Matkiminen",
          targetCharacter: "Sofia",
          instructionPrefix: "Matki täysin Sofian kehonasentoa ja hengitystä pöydässä. Olet täysin herpaantunut ja sanaton hänen edessään:",
          dialogueLines: [],
          instructionPostfix: "Tarkkaile Sofiaa herkeämättä hämmentyneenä ja kiihtyneenä.",
          gamePurpose: "Leo on täysin lumoutunut ja sanaton, matkien kumppaninsa eleitä ja painottaen kiusallista hiljaisuutta."
        }
      ]
    },
    {
      sceneNumber: 6,
      sceneTitle: "6. Palavin sydämin",
      narrativeIntroduction: "Studion taustavalo himmenee herkemmäksi siniseksi automaattisesti ohjelman puolesta. Sekä Leo että Sofia ovat uppoutuneet täysin erillisiin asioihin, kumpikin omaan hämmentävään monologiinsa samanaikaisesti huomaamatta toistaan.",
      dramaticArcPhase: "Käännekohta/Kliimaksi",
      playerTasks: [
        {
          characterName: "Sofia",
          socialActionCategory: "Toteava",
          concreteActionCategory: "Monologi",
          targetCharacter: "Kaikki",
          instructionPrefix: "Puhu huomaamattomasti itsellesi tsemppausta ja muistuta raameista ääneen katsomatta suoraan Leoon:",
          dialogueLines: [
            "Suojamuurit ovat helpompia kuin pettymykset.",
            "Mutta tämä on ensimmäinen kerta, kun joku katsoo minua tässä studiossa ilman valmiita suuntaviivoja..."
          ],
          instructionPostfix: "Huokaise syvään ja laske katseesi pöytään.",
          gamePurpose: "Sofia avautuu ja paljastaa oman haavoittuvuutensa – deitti etenee herkkään vaiheeseen."
        },
        {
          characterName: "Leo",
          socialActionCategory: "Toteava",
          concreteActionCategory: "Monologi",
          targetCharacter: "Kaikki",
          instructionPrefix: "Leveä hämmennys valtaa kasvosi. Kuulet toisesta korvanapistasi tuottajan vaativan ääntä. Puhu monologi katsojille tai suoraan ilmaan huutaen korvanapille:",
          dialogueLines: [
            "Kyllä tiedän, 'mitään ei tapahdu', mutta katsokaa häntä...",
            "Minulla ei ole mitään sanottavaa, koska kaikki mitä kirjoitin, tuntuu täysin feikiltä...",
            "Nyt riittää."
          ],
          instructionPostfix: "Ota toinenkin korvanappi pois korvastasi ja heitä se sivuun.",
          gamePurpose: "Leo ottaa valtavan riskin, tekee dynaamisen monologin varassa tilityksen takahuoneen kuiskuttajille ja riisuu taustakoneiston."
        }
      ]
    },
    {
      sceneNumber: 7,
      sceneTitle: "7. Hiljaisuuden kuiskaus",
      narrativeIntroduction: "Kaikki taustamelu tuntuu katoavan. Studiomanageri viittoo hermostuneesti varjoissa, mutta parivaljakko ei välitä.",
      dramaticArcPhase: "Käännekohta/Kliimaksi",
      playerTasks: [
        {
          characterName: "Sofia",
          socialActionCategory: "Tavoitteleva",
          concreteActionCategory: "Fyysinen ele",
          targetCharacter: "Leo",
          instructionPrefix: "Kurkota kätesi pöydän yli ja kosketa lyhyesti Leon kättä tai pöytäpintaa hänen lähellään. Sano hyvin hiljaa:",
          dialogueLines: [
            "Älä katso enää monitoriin tai taaksesi. Katso minua."
          ],
          instructionPostfix: "Pidä kätesi paikallaan ja odota rauhassa.",
          gamePurpose: "Sofia vahvistaa sähköisen fyysisen yhteyden ja katkaisee Leon tarpeen kontrolloida ympäristöä."
        },
        {
          characterName: "Leo",
          socialActionCategory: "Toteava",
          concreteActionCategory: "Matkiminen",
          targetCharacter: "Sofia",
          instructionPrefix: "Ota täsmälleen sama kädenasento ja rauhallinen hengitystahti kuin Sofialla. Totea matalla äänellä:",
          dialogueLines: [
            "Täällä on kymmeniä ihmisiä ympärillä, mutta tuntuu kuin olisimme täysin kahdestaan."
          ],
          instructionPostfix: "Nojaa eteenpäin ja katso häntä silmiin.",
          gamePurpose: "Leo laskee ammatillisen kontrollinsa ja heittäytyy matkimisen ja aistinvaraisen läsnäolon tasolle."
        }
      ]
    },
    {
      sceneNumber: 8,
      sceneTitle: "8. Korvanapin huuto",
      narrativeIntroduction: "Leon korvakuulokkeesta kuuluu vaimeaa huutoa studiopäälliköltä: 'Leo mitä sä teet! Tämä on suora lähetys!'",
      dramaticArcPhase: "Ratkaisu",
      playerTasks: [
        {
          characterName: "Sofia",
          socialActionCategory: "Kysyvä",
          concreteActionCategory: "Siirtyminen",
          targetCharacter: "Leo",
          instructionPrefix: "Nouse hitaasti seisomaan tuoliltasi, astu askel taaksepäin ja kysy epäilevän vakavasti:",
          dialogueLines: [
            "Mitä ne sinulle sanovat korvaan? Onko tämä sittenkin vain hieno roolisuoritus katselulukuja varten?"
          ],
          instructionPostfix: "Aseta kätesi rinnallesi suojaksi ja odota.",
          gamePurpose: "Sofia säikähtää mahdollista huijausta ja vetäytyy takaisin puolustusasemiin."
        },
        {
          characterName: "Leo",
          socialActionCategory: "Tavoitteleva",
          concreteActionCategory: "Esineen kanssa toimiminen",
          targetCharacter: "Sofia",
          instructionPrefix: "Nouse myös ylös. Ota kuvitteellinen korvanappi päästäsi ja viskaa se raskaasti pöydälle. Sano painokkaasti ja kovaäänisesti:",
          dialogueLines: [
            "Se oli tuottaja. Ja minä juuri irtisanouduin tästä p**kasta. Uskotko nyt?"
          ],
          instructionPostfix: "Levitä kätesi sivuille osoittaaksesi rehellisyytesi.",
          gamePurpose: "Leo suorittaa upean fyysisen irtioton reality-rakenteista vahvistaakseen vilpittömyytensä."
        }
      ]
    },
    {
      sceneNumber: 9,
      sceneTitle: "9. Uskalluksen hetki",
      narrativeIntroduction: "Studiohenkilökunta tajuaa, että tapahtumasta tulee eeppistä tv-materiaalia, ja vetäytyy taustalle. Valot kirkastuvat neutraaleiksi.",
      dramaticArcPhase: "Ratkaisu",
      playerTasks: [
        {
          characterName: "Sofia",
          socialActionCategory: "Toteava",
          concreteActionCategory: "Dialogi",
          targetCharacter: "Leo",
          instructionPrefix: "Astu hitaasti takaisin pöydän viereen Leoa kohti. Sano lempeästi hymyillen:",
          dialogueLines: [
            "Sinä olet täysin hullu, Leo. Mutta ehkä se on juuri sitä, mitä tulin täältä etsimään."
          ],
          instructionPostfix: "Nojaa kevyesti pöydän reunaan ja katso häntä ihaillen.",
          gamePurpose: "Sofia hyväksyy Leon riskinoton ja antaa itselleen luvan uskoa toiseen ihmiseen."
        },
        {
          characterName: "Leo",
          socialActionCategory: "Selvittävä",
          concreteActionCategory: "Dialogi",
          targetCharacter: "Sofia",
          instructionPrefix: "Ota Sofiaa hitaasti ja lempeästi kuvitteellisesti kädestä. Kysy hymyillen:",
          dialogueLines: [
            "Lähdetäänkö täältä pois ennen kuin he ehtivät editoida tästä jotain typerää?"
          ],
          instructionPostfix: "Katso ympärillesi studiossa ilkikurisesti.",
          gamePurpose: "Leo ehdottaa lopullista pakoa tuotannon rajoista dynaamisena ratkaisuna."
        }
      ]
    },
    {
      sceneNumber: 10,
      sceneTitle: "10. Viimeinen otto",
      narrativeIntroduction: "Kaksikko poistuu studiovalojen loisteesta jättäen kupit ja mikrofonit pöydälle. Kamerat sammuvat. Esitys on päättynyt.",
      dramaticArcPhase: "Ratkaisu",
      playerTasks: [
        {
          characterName: "Sofia",
          socialActionCategory: "Toteava",
          concreteActionCategory: "Monologi",
          targetCharacter: "Kaikki",
          instructionPrefix: "Astu kokonaan sivuun tyhjältä pelialueelta valokeilan ulkopuolelle. Sano viimeisenä kommenttina suoraan katsojille:",
          dialogueLines: [
            "Rakkautta ei ehkä löydy ruudun takaa... mutta joskus sen löytää sieltä, mistä vähiten odottaa."
          ],
          instructionPostfix: "Hymyile lämpimästi ja kävele sivuun.",
          gamePurpose: "Sofia lausuu oman tyylipuhtaan ja kauniin loppu-epilogiheittonsa tarinalle."
        },
        {
          characterName: "Leo",
          socialActionCategory: "Toteava",
          concreteActionCategory: "Siirtyminen",
          targetCharacter: "Kaikki",
          instructionPrefix: "Kävele eteenpäin, käänny katsomaan tyhjää studiota viimeisen kerran ja sano ohjaajana:",
          dialogueLines: [
            "Tämä oli paras ohjaustyöni koskaan. Se oli siinä – purkissa!"
          ],
          instructionPostfix: "Nyökkää päättäväisesti ja kävele Sofian perään.",
          gamePurpose: "Leo saattaa ohjaajan identiteettinsä päätökseen upealla, vapauttavalla loppukommentilla."
        }
      ]
    }
  ]
};

export const PREMADE_SCENARIOS: SavedScenario[] = [
  PREMADE_SPEED_DATING_SCENARIO
];

/**
 * Helper to get custom saved scenarios from localStorage
 */
export function getSavedScenarios(): SavedScenario[] {
  try {
    const saved = localStorage.getItem("rautatie_saved_scenarios");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load saved scenarios", e);
  }
  return [];
}

/**
 * Helper to save a custom scenario to localStorage
 */
export function saveScenarioToLibrary(scenario: SavedScenario) {
  try {
    const saved = getSavedScenarios();
    // Prevent duplicates by checking ID or title
    const filtered = saved.filter(s => s.id !== scenario.id && s.title !== scenario.title);
    const updated = [...filtered, scenario];
    localStorage.setItem("rautatie_saved_scenarios", JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save scenario to library", e);
  }
}

/**
 * Helper to delete a custom scenario from localStorage
 */
export function deleteScenarioFromLibrary(id: string) {
  try {
    const saved = getSavedScenarios();
    const updated = saved.filter(s => s.id !== id);
    localStorage.setItem("rautatie_saved_scenarios", JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to delete scenario from library", e);
  }
}
