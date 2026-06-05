import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Initialize environment variables from .env
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to get or lazily initialize the Google GenAI SDK client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY is not configured. Please add your Gemini API Key in Settings > Secrets.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// 1. Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Storage for the single active game running on this server
interface ServerGameState {
  roomCode: string;
  sceneNumber: number;
  sceneTitle: string;
  narrativeIntroduction: string;
  players: Array<{ id: string; name: string; role: string; isDead?: boolean }>;
  playerTasks: Array<{
    characterName: string;
    socialActionCategory: string;
    concreteActionCategory: string;
    targetCharacter: string;
    instructionPrefix: string;
    dialogueLines: string[];
    instructionPostfix: string;
  }>;
  readiness: Record<string, boolean>;
}

let activeGame: ServerGameState | null = null;

// Endpoint for the host application to sync current scene and player details
app.post("/api/sync-game", (req, res) => {
  const { roomCode, sceneNumber, sceneTitle, narrativeIntroduction, players, playerTasks, gameActive } = req.body;
  
  if (gameActive === false) {
    activeGame = null;
    return res.json({ status: "cleared", activeGame: null });
  }

  if (!roomCode) {
    return res.status(400).json({ error: "Huonekoodi vaaditaan synkronointiin." });
  }

  // If new game, or different scene, or different room code: reset readiness
  if (!activeGame || activeGame.roomCode !== roomCode || activeGame.sceneNumber !== sceneNumber) {
    activeGame = {
      roomCode,
      sceneNumber,
      sceneTitle,
      narrativeIntroduction,
      players: players || [],
      playerTasks: playerTasks || [],
      readiness: {}
    };
  } else {
    // Just update the players/tasks dynamically (e.g. if someone dies or is added)
    activeGame.players = players || [];
    activeGame.playerTasks = playerTasks || [];
    activeGame.sceneTitle = sceneTitle;
    activeGame.narrativeIntroduction = narrativeIntroduction;
  }

  res.json({ status: "ok", activeGame });
});

// Endpoint for player clients or host to query the active game state
app.get("/api/active-game", (req, res) => {
  res.json({ activeGame });
});

// Endpoint for players to change their readiness status ("Ja sitten...")
app.post("/api/player-ready", (req, res) => {
  const { roomCode, characterName, ready } = req.body;

  if (!activeGame || activeGame.roomCode !== roomCode) {
    return res.status(404).json({ error: "Epäaktiivinen tai virheellinen huonekoodi." });
  }

  activeGame.readiness = activeGame.readiness || {};
  activeGame.readiness[characterName] = !!ready;

  res.json({ status: "ok", activeGame });
});

// 2. Archetype Generator
// Generates character roles and secrets based on theme and players
app.post("/api/generate-archetypes", async (req, res) => {
  try {
    const { theme, initialIdea, playerNames } = req.body;
    
    if (!theme || !playerNames || !Array.isArray(playerNames) || playerNames.length === 0) {
      return res.status(400).json({ error: "Teema ja vähintään yksi pelaajan nimi vaaditaan." });
    }

    const ai = getGeminiClient();
    
    const userPrompt = `Luo roolit ja mehukkaat, toisiinsa kietoutuvat salaisuudet seuraaville pelaajille.
Pelin teema: "${theme}"
Alustus/Idea: "${initialIdea || 'Ei erityistä alustusta'}"
Pelaajat: ${playerNames.join(", ")}

Säännöt hahmonluontiin:
- Roolin tulee olla ytimekäs (esim. "Hovimestari", "Laivainsinööri", "Turvamies").
- Salaisuuden tai motiivin tulee olla toiminnallinen ja kytkeytyä muihin pelaajiin (esim. joku on rikollinen/vakooja, joku kantaa pelastuksen avainta, joku epäilee toista, jollakin on murhamotiivi).
- Salaisuudet luovat sosiaalista jännitettä, jotta niistä syntyy larpattavaa peliliikettä ja epäilyksiä.
- Luo myös karkea, jännittävä dramaattinen juonikaava tai roadmap (overallOutline) suomeksi, joka ohjaa tarinaa jos peliä pelataan kohta kerrallaan. Sen tulisi antaa 2-3 lauseella yleiskuva siitä, miten jännitys kohoaa kohti kliimaksia (esim. "Tarkoituksena on löytää kadonnut mikrofilmi ennen kuin myrkky uuvuttaa ryhmän, jolloin syyllisen hermo pettää ja loppuselvitys pakottaa hänet paljastumaan.").`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: "Olet roolipelien suunnittelija. Luot hahmojen rooleja, salaisuuksia sekä karkean taktiikkakaavan roolipeliin. Palauta luodut hahmot ja juonikaava täsmälleen annetussa JSON-formaatissa.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            archetypes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Pelaajan alkuperäinen nimi" },
                  role: { type: Type.STRING, description: "Hahmon ammatti tai rooli" },
                  secret: { type: Type.STRING, description: "Hahmon salainen motiivi tai salaisuus pelissä" }
                },
                required: ["name", "role", "secret"]
              }
            },
            overallOutline: {
              type: Type.STRING,
              description: "Skenaarion karkea juonikaavio tai roadmap (2-3 lausetta suomeksi) joka näyttää miten tarina etenee kohti loppukliimaksia."
            }
          },
          required: ["archetypes", "overallOutline"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || '{"archetypes": [], "overallOutline": ""}');
    res.json({ 
      archetypes: parsedData.archetypes || [], 
      overallOutline: parsedData.overallOutline || "" 
    });

  } catch (error: any) {
    console.error("Archetype generation error:", error);
    res.status(500).json({ 
      error: error.message || "Tapahtui virhe hahmojen generoinnissa." 
    });
  }
});

// 3. Full Scenario Generator (Generates all scenes at once for a beautifully planned dramatic arc!)
app.post("/api/generate-full-scenario", async (req, res) => {
  try {
    const { config } = req.body;

    if (!config || !config.theme || !config.players) {
      return res.status(400).json({ error: "Pelin asetukset puuttuvat." });
    }

    const ai = getGeminiClient();
    const totalScenes = config.totalScenes || 5;

    const systemInstruction = `Olet rautaisen junailtu ("railroaded") roolipelinjohtaja ja tarinan orkestroija.
Tehtäväsi on suunnitella ja luoda KAIKKI ${totalScenes} kohtausta kerrallaan tiukaksi, lineaariseksi ja henkeäsalpaavaksi draamalliseksi kokonaisuudeksi (skenaarioksi).

Koska luot koko skenaarion ja kaikki kohtaukset kerralla, voit suunnitella draaman kaaren nousun, käänteet ja konfliktit paljon paremmin ja synkronoida pelaajien tehtävät täydellisesti!

Dramaattinen kaari ja rytmitys (${totalScenes} kohtausta):
1. ALUSTUS (Exposition / Setup - Kohtaus 1): Esitellään roolisuhteet, viritellään varovaisia sosiaalisia kontakteja ja motiiveja. Pelaajille annetaan keveitä, itsenäisiä ele- tai selvitystehtäviä.
2. KOUKKU (Inciting Incident / Hook - Kohtaus 2): Ensimmäiset epäilykset heräävät ja salaisuuksien verho alkaa hienovaraisesti raottua. Sosiaalinen kitka herää.
3. KONFLIKTIN RAKENTAMINEN (Rising Action / Complications - Kohtaukset keskellä, esim 3): Sosiaalinen paine syvenee, salaisuudet alkavat vuotaa tietyille liittolaisille tai kiristystilanteet alkavat.
4. KLIIMAKSI (Climax / Turning Point - Kohtaus ${totalScenes - 1}): Tapahtuu välitön, konkreettinen ja pysäyttävä tapaus (esim. murha tapahtuu, myrkky alkaa vaikuttaa, esine katoaa, sabotaasi iskee).
   * Rooliasettelu kliimaksissa: Anna vain yhdelle tai kahdelle sopivalle hahmolle suora konkreettinen teko-ohje (suorita isku). Ohjaa muille hahmoille tila tarkkailla, havaita tai vahtia – tämä luo täydellisen emergentin epäilyn ilmapiirin.
5. RATKEAMINEN (Resolution / Falling Action & Showdown - Viimeinen kohtaus ${totalScenes}): Loppuselvitys tai tiukka loppukuulustelu. Pelaajat saavat kukin taktilliset ohjeet joko paljastaa totuutensa, yrittää lavastaa muut, tai syyttää salaisuuksien perusteella muita.

Säännöt ja sosiaalinen pelidynamiikka:
1. Pelaajien roolit ja vuorovaikutus: Jokaiselle pelaajalle on annettava selkeä, ymmärrettävä ja suoritettava mikro-tehtävä jokaisessa kohtauksessa.
2. Pelirytmi ja hiljaisuus: Kaikkien ei tule puhua tai toimia suuren intensiteetin aloitteentekijöinä samanaikaisesti. Anna osalle pelaajista tarkkailevia, hiljaisia ja kuuntelevia ohjeita (kuten 'kuuntele muiden puhetta ja osoita epäluulosi vain elein' tai 'ylläpidä jännitteistä hiljaisuutta'), jotta puhetila ei tukkiudu.
3. Vuoropuhelun kohdistaminen ja reaktiiviset ketjut: Kun ohjaat Pelaajaa A (toimija) kysymään tai osoittamaan teon Pelaajalle B (kohde / targetCharacter), varmista poikkeuksetta, että Pelaajalla B on omissa ohjeissaan vastaava suora reaktio- tai vastaukseen liittyvä ohjeistus siitä, miten hänen tulee vastata tai reagoida oman hahmonsa/salaisuutensa perusteella. Tämä synnyttää aitoja, kiinteitä keskusteluja ristiinpuhumisen sijaan.
4. Tehtävärakenteen pilkkominen: Jaottele jokainen pelaajaohje kolmeen selkeään tasoon:
   - Aloitusohje (instructionPrefix): Toimintakehys ja asento, jolla tilanne aloitetaan.
   - Puhesisältö (dialogueLines): Mitä hahmo tarkalleen sanoo tai ottaa puheeksi.
   - Pääte-ele (instructionPostfix): Mihin asenteeseen tai fyysiseen eleeseen vuoro päätetään.`;

    const userPrompt = `Luo peliin täydellinen ${totalScenes} kohtauksen skenaario (kaikki kohtaukset kerralla!).

Pelin perustiedot:
Teema: "${config.theme}"
Idea/Premissi: "${config.initialIdea}"
Pelaajahahmot (nimi, rooli, salaisuus):
${config.players.map((p: any) => `- ${p.name} (Rooli: ${p.role}, Salaisuus: ${p.secret})`).join("\n")}

Luo nyt kaikki ${totalScenes} kohtausta ja palauta ne täsmällisessä JSON-muodossa.`;

    const playerTaskSchema = {
      type: Type.OBJECT,
      properties: {
        characterName: { type: Type.STRING, description: "Pelaajan tarkka nimi" },
        socialActionCategory: { 
          type: Type.STRING, 
          description: "Minkä tyyppinen sosiaalinen asenne otetaan: 'Kysyvä', 'Toteava', 'Selvittävä', 'Tavoitteleva' tai 'Tarkkaileva'" 
        },
        concreteActionCategory: { 
          type: Type.STRING, 
          description: "Miten se tehdään konkreettisesti: 'Monologi', 'Matkiminen', 'Dialogi', 'Fyysinen ele', 'Siirtyminen', 'Esineen kanssa toimiminen', 'Hiljainen jännite', 'Seuraaminen/Varjostus', 'Kuuntelu'" 
        },
        targetCharacter: { 
          type: Type.STRING, 
          description: "Pelaajanimi johon teko kohdistuu, tai 'Kaikki'" 
        },
        instructionPrefix: { 
          type: Type.STRING, 
          description: "Toimintaytaso & asento-ohjeistus, jolla tilanne käynnistetään (esim. 'Kysy kaavamaisia treffikysymyksiä hymyillen mutta haastavasti:')" 
        },
        dialogueLines: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Sähäkät matkan varrella sanottavat repliikit ilman ranskalaista viivaa alussa (esim. ['mikä on intohimosi elämässä?', 'miksi naiset yleensä jättävät sinut?'])" 
        },
        instructionPostfix: { 
          type: Type.STRING, 
          description: "Tyyliohje, fyysinen ele tai lyhyt sanaton asenne reuna-ehdoksi (esim. 'Naurahda vaisusti itsellesi ja katso häntä silmiin herpautumatta.')" 
        },
        gamePurpose: { 
          type: Type.STRING, 
          description: "Miksi tämä ohje annetaan, mikä on draamallinen tavoite taustalla." 
        }
      },
      required: ["characterName", "socialActionCategory", "concreteActionCategory", "targetCharacter", "instructionPrefix", "dialogueLines", "instructionPostfix", "gamePurpose"]
    };

    const sceneSchema = {
      type: Type.OBJECT,
      properties: {
        sceneNumber: { type: Type.INTEGER },
        sceneTitle: { type: Type.STRING },
        narrativeIntroduction: { type: Type.STRING, description: "Lyhyt ja ytimekäs pelinjohtajan juonellinen alustus (1-3 lausetta) luettavaksi ääneen." },
        dramaticArcPhase: { 
          type: Type.STRING, 
          description: "Dramaturgian teoreettinen vaihe: 'Alustus' (Exposition), 'Koukku' (Inciting Incident), 'Konfliktin rakentaminen' (Rising Action), 'Kliimaksi' (Climax), tai 'Ratkeaminen' (Resolution)" 
        },
        playerTasks: {
          type: Type.ARRAY,
          items: playerTaskSchema,
          description: "Tehtävä JOKAISELLE pelissä mukana olevalle hahmolle."
        }
      },
      required: ["sceneNumber", "sceneTitle", "narrativeIntroduction", "dramaticArcPhase", "playerTasks"]
    };

    const scenarioSchema = {
      type: Type.OBJECT,
      properties: {
        scenes: {
          type: Type.ARRAY,
          items: sceneSchema,
          description: "Taulukko, joka sisältää kaikki skenaarion kohtaukset järjestyksessä (yhteensä" + totalScenes + " kappaletta)."
        }
      },
      required: ["scenes"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: scenarioSchema
      }
    });

    const parsedData = JSON.parse(response.text || '{"scenes": []}');
    res.json({ scenes: parsedData.scenes });

  } catch (error: any) {
    console.error("Scenario generation error:", error);
    res.status(500).json({ 
      error: error.message || "Tapahtui virhe skenaarion generoinnissa." 
    });
  }
});

// 4. Next Scene Generator (Full linear game conductor)
app.post("/api/generate-next-scene", async (req, res) => {
  try {
    const { config, history, currentSceneNumber, humanGmNotes } = req.body;

    if (!config || !config.theme || !config.players) {
      return res.status(400).json({ error: "Pelin asetukset puuttuvat." });
    }

    const ai = getGeminiClient();

    // Setup history notes
    let historyPrompt = "";
    if (history && history.length > 0) {
      historyPrompt = history.map((scene: any) => {
        return `Kohtaus ${scene.sceneNumber}: "${scene.sceneTitle}" (${scene.dramaticArcPhase})
- Alustus: ${scene.narrativeIntroduction}
- Pelaajien toimintaohjeet:
${scene.playerTasks.map((t: any) => `   * ${t.characterName} (Katetoria: ${t.concreteActionCategory}):
     Ohjeistus: ${t.instructionPrefix}
     Repliikit: ${(t.dialogueLines || []).map((l: string) => `"${l}"`).join(", ")}
     Lopetusere: ${t.instructionPostfix}`).join("\n")}
- PJ:n huomiot ja tapahtumat realielämässä: ${scene.humanGmNotesFeedback || "Ei huomioita"}`;
      }).join("\n\n");
    } else {
      historyPrompt = "Peli on vasta alkamassa. Ei aiempaa historiaa.";
    }

    const totalScenes = config.totalScenes || 5;
    const isInfinite = totalScenes === -1;

    const systemInstruction = `Olet rautaisen junailtu ("railroaded") roolipelinjohtaja ja tarinan orkestroija.
Tehtäväsi on ohjata pelaajaryhmää lineaarisen ja tiukan draamallisen kaaren halki. Pelissä on ${isInfinite ? 'päättymätön ja jatkuva' : 'yhteensä ' + totalScenes} kohtausta.
Sinun tulee luoda KOHTAUS numero ${currentSceneNumber}.

Dramaturginen kaari ja rytmitys:
${isInfinite 
  ? `- Koska kyseessä on PÄÄTTYMÄTÖN pelitila, älä päätä peliä vielä tai tee lopullista ratkaisua. Jatka koukkujen syventämistä, jännitteiden kasvattamista ja uusien salaisuuksien / epäilyjen vuotamista. Pyri pitämään pelaajat aktiivisessa konfliktissa, annettujen karkeiden juonikaavioiden hengessä.`
  : `- Vaihe ${currentSceneNumber}/${totalScenes}.
- Jos ${currentSceneNumber} === 1: ALUSTUS (Exposition / Setup). Esitellään roolisuhteet, viritellään varovaisia sosiaalisia kontakteja ja motiiveja. Pelaajille annetaan keveitä, itsenäisiä ele- tai selvitystehtäviä.
- Jos ${currentSceneNumber} on keskivaiheilla (esim 2 tai 3) ja ${totalScenes} > 3: KONFLIKTIN RAKENTAMINEN (Rising Action / Complications). Sosiaalinen paine syvenee, salaisuudet alkavat vuotaa tietyille liittolaisille tai kiristystilanteet alkavat.
- Jos tämä on KLIIMAKSI (kohtaus ${Math.max(2, totalScenes - 1)} tai ${totalScenes - 1}): TAPAHTUU ISO KONKREETTINEN VÄLITÖN TAPAHTUMA (esim. murha tapahtuu, myrkky alkaa vaikuttaa, esine katoaa, sabotaasi iskee).
  * Rooliasettelu kliimaksissa: Anna vain yhdelle tai kahdelle sopivalle hahmolle suora konkreettinen teko-ohje (suorita isku). Ohjaa muille hahmoille tila tarkkailla, havaita tai vahtia – tämä luo täydellisen emergentin epäilyn ilmapiirin.
- Jos tämä on RATKEAMINEN (Resolution / Falling Action & Showdown - Viimeinen kohtaus ${totalScenes}): Loppuselvitys tai tiukka loppukuulustelu. Pelaajat saavat kukin taktilliset ohjeet joko paljastaa totuutensa, yrittää lavastaa muut, tai syyttää salaisuuksien perusteella muita.`
}

Säännöt ja sosiaalinen pelidynamiikka:
1. Pelaajien roolit ja vuorovaikutus: Jokaiselle pelaajalle on annettava selkeä, ymmärrettävä ja suoritettava mikro-tehtävä tässä kohtauksessa.
2. Pelirytmi ja hiljaisuus: Kaikkien ei tule puhua tai toimia suuren intensiteetin aloitteentekijöinä samanaikaisesti. Anna osalle pelaajista tarkkailevia, hiljaisia ja kuuntelevia ohjeita (kuten 'kuuntele muiden puhetta ja osoita epäluulosi vain elein' tai 'ylläpidä jännitteistä hiljaisuutta'), jotta puhetila ei tukkiudu.
3. Vuoropuhelun kohdistaminen ja reaktiiviset ketjut: Nykyinen Pelaaja A (toimija) kysyy tai tekee teon Pelaajalle B (targetCharacter). Varmista, että Pelaajalla B on omassa ohjeistuksessaan reaktiivinen ohje tähän.
4. Ota ehdottomasti huomioon pelaajien elossaolo: Jos pelaaja on kuollut (isDead), anna hänelle siihen liittyvä sopiva kuolin- tai aave-rooli (esim. 'Esitä kuollutta maassa', tai 'Toimi haamuna ja kuiskaa yksi sana epäillylle'). Älä anna kuolleelle hahmolle normaaleja aktiivisia puhe- tai etsintätehtäviä.
5. Tehtävärakenteen pilkkominen: Jaottele jokainen pelaajaohje kolmeen selkeään tasoon:
   - Aloitusohje (instructionPrefix): Toimintakehys ja asento, jolla tilanne aloitetaan.
   - Puhesisältö (dialogueLines): Mitä hahmo tarkalleen sanoo tai ottaa puheeksi.
   - Pääte-ele (instructionPostfix): Mihin asenteeseen tai fyysiseen eleeseen vuoro päätetään.`;

    const userPrompt = `Luo peliin seuraava kohtaus (Kohtaus ${currentSceneNumber}${isInfinite ? ' / Päättymätön' : ' / ' + totalScenes}) huomioiden pelin asetukset, tähänastinen pelihistoria ja pelinjohtajan tuoreet reaaliaikaiset huomiot.

Pelin perustiedot:
Teema: "${config.theme}"
Idea/Premissi: "${config.initialIdea}"
${config.overallOutline ? `Skenaarion suunniteltu karkea juonikaavio / roadmap: "${config.overallOutline}"` : ''}
Pelaajahahmot (nimi, rooli, salaisuus, onko kuollut):
${config.players.map((p: any) => `- ${p.name} (Rooli: ${p.role}, Salaisuus: ${p.secret}, Kuollut: ${p.isDead ? 'Kyllä' : 'Ei'})`).join("\n")}

Pelitilanteen reaaliaikaiset PJ-huomiot tältä hetkeltä:
"${humanGmNotes || 'Ei uusia huomioita ihmis-pelinjohtajalta.'}"

Tähänastinen pelihistoria:
${historyPrompt}

Luo nyt KOHTAUS ${currentSceneNumber} ja palauta se täsmällisessä JSON-muodossa.`;

    const playerTaskSchema = {
      type: Type.OBJECT,
      properties: {
        characterName: { type: Type.STRING, description: "Pelaajan tarkka nimi" },
        socialActionCategory: { 
          type: Type.STRING, 
          description: "Minkä tyyppinen sosiaalinen asenne otetaan: 'Kysyvä', 'Toteava', 'Selvittävä', 'Tavoitteleva' tai 'Tarkkaileva'" 
        },
        concreteActionCategory: { 
          type: Type.STRING, 
          description: "Miten se tehdään konkreettisesti: 'Monologi', 'Matkiminen', 'Dialogi', 'Fyysinen ele', 'Siirtyminen', 'Esineen kanssa toimiminen', 'Hiljainen jännite', 'Seuraaminen/Varjostus', 'Kuuntelu'" 
        },
        targetCharacter: { 
          type: Type.STRING, 
          description: "Pelaajanimi johon teko kohdistuu, tai 'Kaikki'" 
        },
        instructionPrefix: { 
          type: Type.STRING, 
          description: "Toimintaytaso & asento-ohjeistus, jolla tilanne käynnistetään (esim. 'Kysy kaavamaisia treffikysymyksiä hymyillen mutta haastavasti:')" 
        },
        dialogueLines: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Sähäkät matkan varrella sanottavat repliikit ilman ranskalaista viivaa alussa (esim. ['mikä on intohimosi elämässä?', 'miksi naiset yleensä jättävät sinut?'])" 
        },
        instructionPostfix: { 
          type: Type.STRING, 
          description: "Tyyliohje, fyysinen ele tai lyhyt sanaton asenne reuna-ehdoksi (esim. 'Naurahda vaisusti itsellesi ja katso häntä silmiin herpautumatta.')" 
        },
        gamePurpose: { 
          type: Type.STRING, 
          description: "Miksi tämä ohje annetaan, mikä on draamallinen tavoite taustalla." 
        }
      },
      required: ["characterName", "socialActionCategory", "concreteActionCategory", "targetCharacter", "instructionPrefix", "dialogueLines", "instructionPostfix", "gamePurpose"]
    };

    const sceneSchema = {
      type: Type.OBJECT,
      properties: {
        sceneNumber: { type: Type.INTEGER },
        sceneTitle: { type: Type.STRING },
        narrativeIntroduction: { type: Type.STRING, description: "Lyhyt ja ytimekäs pelinjohtajan juonellinen alustus (1-3 lausetta) luettavaksi ääneen." },
        dramaticArcPhase: { 
          type: Type.STRING, 
          description: "Dramaturgian teoreettinen vaihe: 'Alustus' (Exposition), 'Koukku' (Inciting Incident), 'Konfliktin rakentaminen' (Rising Action), 'Kliimaksi' (Climax), tai 'Ratkeaminen' (Resolution)" 
        },
        playerTasks: {
          type: Type.ARRAY,
          items: playerTaskSchema,
          description: "Tehtävä JOKAISELLE pelissä mukana olevalle hahmolle."
        }
      },
      required: ["sceneNumber", "sceneTitle", "narrativeIntroduction", "dramaticArcPhase", "playerTasks"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: sceneSchema
      }
    });

    const parsedScene = JSON.parse(response.text || "{}");
    res.json({ scene: parsedScene });

  } catch (error: any) {
    console.error("Scene generation error:", error);
    res.status(500).json({ 
      error: error.message || "Tapahtui virhe uuden kohtauksen generoinnissa." 
    });
  }
});

// 4. End Game Story Wrap Up
app.post("/api/generate-epilogue", async (req, res) => {
  try {
    const { config, history, humanGmNotes } = req.body;

    if (!config || !config.players) {
      return res.status(400).json({ error: "Pelin tiedot puuttuvat." });
    }

    const ai = getGeminiClient();

    let historyPrompt = history.map((scene: any) => {
      return `Kohtaus ${scene.sceneNumber}: "${scene.sceneTitle}"
- Alustus: ${scene.narrativeIntroduction}
- PJ:n huomiot lopputuloksesta: ${scene.humanGmNotesFeedback || "Ei huomioita"}`;
    }).join("\n\n");

    const userPrompt = `Kirjoita upea loppuepilogi / loppuratkaisu pelillemme sekä hauskat, skenaariokohtaiset pisteytykset/arvonimet kullekin pelaajalle tarinan perusteella!
Pelin teema: "${config.theme}"
Idea/Premissi: "${config.initialIdea}"
Pelaajahahmot:
${config.players.map((p: any) => `- ${p.name} (Rooli: ${p.role}, Salaisuus: ${p.secret}, Kuollut: ${p.isDead ? 'Kyllä' : 'Ei'})`).join("\n")}

Reaaliaikaiset viimeisen kohtauksen tapahtumat ja loppuhuomiot ihmis-pelinjohtajalta:
"${humanGmNotes || 'Ei uusia loppuhuomioita.'}"

Pelin kulku tähän saakka:
${historyPrompt}

Säännöt loppuratkaisun ja pisteytyksen luomiselle:
1. Kirjoita 2-3 erittäin iskevää ja dramaattista kappaletta suomeksi (epilogue-kenttä), jotka vetävät yhteen kuka selvisi voittajana, kuka paljastui tai epäonnistui, miten mysteeri/konflikti ratkesi, ja mikä oli kunkin hahmon lopullinen kohtalo tarinan kannalta.
2. Luo KAIKILLE pelaajille (characterName) henkilökohtaiset hauskat pisteytykset/arvonimet (scores-taulukko). Kunkin kohdalla keksit pelin teemaan ja tyyliin sopivan kategorian/arvonimen (esm. "Lipevin selittelijä", "Sankari haudan takaa", "Traagisin uhri", "Juonikkain varjo", "Katseiden väistelijä") sekä leikkimielisen numeraalisen pistearvon (scoreValue) ja lyhyen perustelun suomeksi (reasoning).
3. Palauta tulos täsmällisenä JSON-objektina.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: "Olet arvostettu tarinankertoja ja roolipelien kirjoittaja. Luot upean loppuepilogin sekä jokaiselle pelaajalle hauskan teemallisen loppupisteytyksen perusteluineen suomeksi.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            epilogue: { type: Type.STRING, description: "Pelin lopullinen tarinallinen yhteenveto ja loppuratkaisu" },
            scores: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  characterName: { type: Type.STRING, description: "Pelaajan nimi" },
                  category: { type: Type.STRING, description: "Teemaan ja pelitapahtumiin sopiva hauska arvonimi / kategoria" },
                  scoreValue: { type: Type.INTEGER, description: "Leikkimieliset numeraaliset pisteet (esim. 50-1000)" },
                  reasoning: { type: Type.STRING, description: "Lyhyt ja hauska perustelu, miksi pelaaja sai tämän arvonimen/pisteet" }
                },
                required: ["characterName", "category", "scoreValue", "reasoning"]
              }
            }
          },
          required: ["epilogue", "scores"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);

  } catch (error: any) {
    console.error("Epilogue generation error:", error);
    res.status(500).json({ 
      error: error.message || "Tapahtui virhe loppuepilogin generoinnissa." 
    });
  }
});


// Serve static files in production / development setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend assets from /dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Rautatie Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
