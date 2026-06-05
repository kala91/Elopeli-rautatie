import React, { useState } from "react";
import { GameConfig, Player } from "../types";
import { PREMADE_SCENARIOS, SavedScenario, getSavedScenarios, deleteScenarioFromLibrary } from "../data/premadeScenarios";
import { Sparkles, Trash2, Plus, ArrowRight, Shield, Compass, Swords, Radio, HelpCircle, Eye, EyeOff, BookOpen, Clock, Users } from "lucide-react";

interface GameSetupProps {
  onStartGame: (config: GameConfig) => void;
  onStartScenario: (scenario: SavedScenario) => void;
}

const THEME_PRESETS = [
  {
    id: "manor",
    title: "Kartanon Murhamysteeri",
    description: "Sateinen ilta viktoriaanisessa kartanossa. Isäntä löydetään kuolleena kirjastosta, ja kaikilla on jotain salattavaa.",
    initialIdea: "Isäntä lordi Harrington on murhattu tunti sitten. Myrkkyvaihtoehto tai tikari. Kaikki vieraat ja palvelijat ovat lukittuna salonkiin odottamassa poliisia.",
    icon: Compass,
    accent: "border-red-500/30 text-red-400 bg-red-950/25",
  },
  {
    id: "scifi",
    title: "Avaruusaluksen Sabotaasi",
    description: "Syvän avaruuden kaivosalus Andromeda. Reaktori ylikuumenee, tekoäly sekoilee ja miehistössä lymyää sabotööri.",
    initialIdea: "Tuntematon virus tai sabotaasi on rikkonut toisen happigeneraattorijohtimista. Matkalla kohti Siriusta miehistön keskinäinen luottamus rakoilee.",
    icon: Radio,
    accent: "border-cyan-500/30 text-cyan-400 bg-cyan-950/25",
  },
  {
    id: "fantasy",
    title: "Valtaistuinpeli Hovisalissa",
    description: "Kuninkaan viimeiset hetket vetävät ahneet säädyt ja ritarit taistelemaan vallasta. Kuka perii hovin?",
    initialIdea: "Vanha kuningas on halvaantunut ja makaa vuoteellaan. Varjohovi kokoontuu neuvonpitoon valitsemaan sijaishallisjaa. Koruja ja lupauksia vaihdetaan salaa kuiskaten.",
    icon: Swords,
    accent: "border-amber-500/30 text-amber-400 bg-amber-950/25",
  },
  {
    id: "spy",
    title: "Kylmän Sodan Vakoojat",
    description: "Jaetun Berliinin alle piilotettu bunkkeri vuonna 1983. CIA:n ja KGB:n agentit loukussa paljastuneessa tukikohdassa.",
    initialIdea: "Koodilaitteen koodikirja on kadonnut ja radioyhteys on poikki. Jokaisen täytyy todistaa uskollisuutensa tai eliminoida mooli ennen kuin bunkkerilukitus aukeaa.",
    icon: Shield,
    accent: "border-emerald-500/30 text-emerald-400 bg-emerald-950/25",
  }
];

export function GameSetup({ onStartGame, onStartScenario }: GameSetupProps) {
  const [setupTab, setSetupTab] = useState<"ai" | "library">("ai");
  const [customSaved, setCustomSaved] = useState<SavedScenario[]>(() => getSavedScenarios());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDeleteCustomScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      deleteScenarioFromLibrary(id);
      setCustomSaved(getSavedScenarios());
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => {
        setConfirmDeleteId(curr => curr === id ? null : curr);
      }, 4000);
    }
  };
  
  const [selectedPresetId, setSelectedPresetId] = useState<string>("manor");
  const [customTheme, setCustomTheme] = useState<string>("");
  const [initialIdea, setInitialIdea] = useState<string>(THEME_PRESETS[0].initialIdea);
  const [playerNames, setPlayerNames] = useState<string[]>([
    "Sofia", "Matias", "Antti", "Beata", "Cyril"
  ]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [totalScenes, setTotalScenes] = useState<number>(5);
  const [generationMode, setGenerationMode] = useState<"adaptive" | "full">("full");
  const [overallOutline, setOverallOutline] = useState<string>("");
  
  // Generated player roles & secrets
  const [players, setPlayers] = useState<Player[]>([]);
  const [isGeneratingRoles, setIsGeneratingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeThemeTitle = selectedPresetId === "custom" 
    ? customTheme || "Oma Custom-Teema" 
    : THEME_PRESETS.find(p => p.id === selectedPresetId)?.title || "Teema";

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    setError(null);
    if (presetId === "custom") {
      setInitialIdea("");
    } else {
      const preset = THEME_PRESETS.find(p => p.id === presetId);
      if (preset) {
        setInitialIdea(preset.initialIdea);
      }
    }
  };

  const handleAddPlayerName = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPlayerName.trim();
    if (!name) return;
    if (playerNames.includes(name)) {
      setError("Pelaajan nimi on jo lisätty.");
      return;
    }
    if (playerNames.length >= 10) {
      setError("Maksiväestö on 10 pelaajaa jotta prompit mahtuvat näytölle.");
      return;
    }
    setPlayerNames([...playerNames, name]);
    setNewPlayerName("");
    setError(null);
  };

  const handleRemovePlayerName = (indexToRemove: number) => {
    if (playerNames.length <= 1) {
      setError("Pelin kokeilemiseen tai esittelemiseen vaaditaan vähintään 1 pelaaja.");
      return;
    }
    setPlayerNames(playerNames.filter((_, idx) => idx !== indexToRemove));
    setError(null);
  };

  const handleGenerateRoles = async () => {
    setIsGeneratingRoles(true);
    setError(null);
    setPlayers([]);
    setOverallOutline("");
    
    const themeName = selectedPresetId === "custom" ? customTheme : THEME_PRESETS.find(p => p.id === selectedPresetId)?.title;
    
    if (!themeName || themeName.trim() === "") {
      setError("Kirjoita peliin teema tai valitse valmis pohja.");
      setIsGeneratingRoles(false);
      return;
    }

    try {
      const res = await fetch("/api/generate-archetypes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: themeName,
          initialIdea: initialIdea,
          playerNames: playerNames
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Roolien luonti epäonnistui.");
      }

      const data = await res.json();
      
      // Map server response to Player array
      const mappedPlayers: Player[] = data.archetypes.map((node: any, idx: number) => ({
        id: `p-${idx}-${Date.now()}`,
        name: node.name,
        role: node.role || "Osallistuja",
        secret: node.secret || "Kantaa salattua menneisyyttä"
      }));

      setPlayers(mappedPlayers);
      if (data.overallOutline) {
        setOverallOutline(data.overallOutline);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Tekoälypalveluun ei saatu yhteyttä. Tarkista API-avain.");
    } finally {
      setIsGeneratingRoles(false);
    }
  };

  const handleManualPlayerChange = (index: number, field: 'role' | 'secret', value: string) => {
    const updated = [...players];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setPlayers(updated);
  };

  const handleLaunchGame = () => {
    if (players.length === 0) {
      setError("Generoi ensin hahmojen roolit ja salaisuudet painamalla painiketta.");
      return;
    }
    
    const finalTheme = selectedPresetId === "custom" ? customTheme : THEME_PRESETS.find(p => p.id === selectedPresetId)?.title || "Mysteeri";
    
    onStartGame({
      theme: finalTheme,
      initialIdea: initialIdea,
      totalScenes: totalScenes,
      players: players,
      generationMode: generationMode,
      overallOutline: overallOutline
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in p-2 md:p-6 pb-20">
      
      {/* Intro Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-mono tracking-tight text-white font-bold uppercase border-b border-gray-800 pb-4">
          <span className="text-red-500">RAUTATIE</span> Draamamoottori
        </h1>
        <p className="text-gray-400 font-sans max-w-xl mx-auto text-sm md:text-base leading-relaxed">
          Lineaarinen ja ohjattu (railroaded) hidden role -sosiaalipeli. Tekoäly luo dramaturgisia mikroskenaarioita, joita pelaajat näyttelevät reaaliajassa samanaikaisesti.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-300 rounded-lg text-sm text-center font-mono">
          <strong>VIRHE:</strong> {error}
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex bg-zinc-900 p-1.5 rounded-xl border border-zinc-800/80 shadow-md">
        <button
          type="button"
          onClick={() => setSetupTab("ai")}
          className={`flex-grow py-3 px-4 text-center rounded-lg font-mono text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 transition duration-300 cursor-pointer ${
            setupTab === "ai"
              ? "bg-red-950/40 text-red-400 border border-red-500/30 shadow"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          Tekoäly-Skenaariokone (Live AI)
        </button>

        <button
          type="button"
          onClick={() => setSetupTab("library")}
          className={`flex-grow py-3 px-4 text-center rounded-lg font-mono text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 transition duration-300 cursor-pointer ${
            setupTab === "library"
              ? "bg-amber-950/40 text-amber-500 border border-amber-500/35 shadow"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-400" />
          Hätävara-kirjasto ({PREMADE_SCENARIOS.length + customSaved.length} peliä)
        </button>
      </div>

      {setupTab === "ai" ? (
        <>
          <div className="space-y-6">
          
          {/* Step 1: Theme selection & settings */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-xl space-y-6 shadow-xl leading-relaxed">
            <div className="flex items-center space-x-2 text-white font-semibold font-mono pb-2 border-b border-zinc-800">
              <span className="w-6 h-6 flex items-center justify-center bg-red-500/20 text-red-400 border border-red-500/40 rounded text-xs">1</span>
              <h3>VALITSE PELITEEMA JA PREMISSI</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {THEME_PRESETS.map((preset) => {
                const IconComp = preset.icon;
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`flex flex-col text-left p-3 rounded-lg border transition-all duration-300 relative overflow-hidden h-36 justify-between ${
                      isSelected 
                        ? `${preset.accent} border-current ring-1 ring-white/10` 
                        : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="text-xs font-mono uppercase font-semibold">Preset</span>
                      <IconComp className={`w-5 h-5 ${isSelected ? 'opacity-100' : 'opacity-40'}`} />
                    </div>
                    <div className="space-y-1 mt-auto">
                      <h4 className="font-mono text-sm font-bold text-white leading-tight">{preset.title}</h4>
                      <p className="text-[11px] leading-tight text-gray-400 opacity-90 line-clamp-2 md:line-clamp-3">{preset.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Theme toggle */}
            <button
              onClick={() => handleSelectPreset("custom")}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                selectedPresetId === "custom" 
                  ? "border-purple-500/50 bg-purple-950/20 text-purple-300 font-mono" 
                  : "border-zinc-800 bg-zinc-950/40 text-zinc-500 hover:text-zinc-400"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold">Luo täysin oma custom-teema...</span>
                <Sparkles className="w-4 h-4" />
              </div>
            </button>

            {/* Custom Input Fields */}
            {selectedPresetId === "custom" && (
              <div className="space-y-3 animate-fade-in">
                <label className="block text-xs font-mono font-bold text-gray-400 uppercase">Teeman Nimi</label>
                <input
                  type="text"
                  placeholder="Esim. Apokalyptinen majakka, Suo-olennon pito jne."
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded p-3 text-sm focus:outline-none focus:border-purple-500/60 font-sans"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold text-gray-400 uppercase">
                Tarkemmat PJ:n alustusnuotit (Premissi / Tilannekuvaus)
              </label>
              <textarea
                rows={3}
                placeholder="Kirjoita vapaa kuvaus siitä mistä lähdetään liikkeelle tai miten mysteeri alkaa..."
                value={initialIdea}
                onChange={(e) => setInitialIdea(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded p-3 text-sm focus:outline-none focus:border-red-500/60 font-sans leading-relaxed"
              />
            </div>
          </div>

          {/* Step 2: Generation Mode & Length Selection */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-xl space-y-6 shadow-xl leading-relaxed">
            <div className="flex items-center space-x-2 text-white font-semibold font-mono pb-2 border-b border-zinc-800">
              <span className="w-6 h-6 flex items-center justify-center bg-red-500/20 text-red-400 border border-red-500/40 rounded text-xs">2</span>
              <h3>TEKOÄLYN ROOLI JA PELIN KESTO</h3>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-mono font-bold text-gray-400 uppercase">Generointitapa & Pelityyli</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setGenerationMode("full");
                    if (totalScenes === -1) setTotalScenes(5);
                  }}
                  className={`p-4 rounded-lg border text-left transition duration-300 flex flex-col justify-between h-32 cursor-pointer ${
                    generationMode === "full"
                      ? "border-red-500/50 bg-red-950/20 text-red-400 ring-1 ring-red-500/20"
                      : "border-zinc-800 bg-zinc-950/40 text-gray-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-xs font-bold uppercase">Koko skenaario kerralla</span>
                    <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded uppercase font-bold">Nopea</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight mt-1">
                    Tekoäly suunnittelee koko draaman kaaren etukäteen. Erittäin nopea pelata ilman odotusaikoja kohtausten välillä.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setGenerationMode("adaptive")}
                  className={`p-4 rounded-lg border text-left transition duration-300 flex flex-col justify-between h-32 cursor-pointer ${
                    generationMode === "adaptive"
                      ? "border-purple-500/50 bg-purple-950/20 text-purple-400 ring-1 ring-purple-500/20"
                      : "border-zinc-800 bg-zinc-950/40 text-gray-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-xs font-bold uppercase">Yksi kohtaus kerrallaan (Mukautuva AI)</span>
                    <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded uppercase font-bold text-zinc-300">Dynaaminen</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight mt-1">
                    Tekoäly luo jokaisen uuden kohtauksen edellisten tapahtumien & pelijohtajan reaaliaikaisten huomioiden perusteella!
                  </p>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-mono font-bold text-gray-400 uppercase">Pelin Kesto (Draamakohtauksia)</label>
                {totalScenes === -1 && (
                  <span className="text-[10px] bg-purple-950 border border-purple-500/30 text-purple-400 px-1.5 py-0.5 rounded font-mono uppercase font-bold animate-pulse">Ääretön matka ♾️</span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {[3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTotalScenes(num)}
                    className={`flex-grow min-w-[50px] py-1.5 rounded text-xs font-mono font-semibold border transition cursor-pointer ${
                      totalScenes === num 
                        ? "border-red-500/50 bg-red-950/20 text-red-400 font-bold" 
                        : "border-zinc-800 bg-zinc-950/40 text-gray-400 hover:border-zinc-700"
                    }`}
                  >
                    {num} {num === 5 ? "(Vakio)" : ""}
                  </button>
                ))}
                
                {generationMode === "adaptive" && (
                  <button
                    type="button"
                    onClick={() => setTotalScenes(-1)}
                    className={`flex-grow min-w-[120px] py-1.5 rounded text-xs font-mono font-bold border transition cursor-pointer ${
                      totalScenes === -1
                        ? "border-purple-500 bg-purple-950/20 text-purple-455 font-black"
                        : "border-zinc-800 bg-zinc-950/40 text-gray-400 hover:border-zinc-700"
                    }`}
                  >
                    ♾️ Päättymätön pelitila
                  </button>
                )}
              </div>

              <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
                {totalScenes === -1
                  ? "Päättymättömässä tilassa kohtauksia luodaan dynaamisesti tarinan suosion ja pelinjohtajan ohjeistuksen mukaan, kunnes pelijohtaja päättää pelata viimeisen shown ja luo loppuepilogin painikkeesta."
                  : "Draaman kaari rakentuu siten, että kliimaksi sijoittuu toiseksi viimeiseen ja täydellinen ratkaiseva showdown viimeiseen kohtaukseen."}
              </p>
            </div>
          </div>

          {/* Step 3: Players and names */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-xl space-y-5 shadow-xl leading-relaxed animate-fade-in">
            <div className="flex items-center space-x-2 text-white font-semibold font-mono pb-2 border-b border-zinc-800">
              <span className="w-6 h-6 flex items-center justify-center bg-red-500/20 text-red-400 border border-red-500/40 rounded text-xs">3</span>
              <h3>PELAAJAT ({playerNames.length}/10)</h3>
            </div>

            <form onSubmit={handleAddPlayerName} className="flex gap-2">
              <input
                type="text"
                placeholder="Kirjoita pelaajan nimi tähän (esim. Leo)..."
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="flex-grow bg-zinc-950 border border-zinc-800 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-red-500/60 font-sans"
              />
              <button
                type="submit"
                className="px-3 bg-zinc-800 border border-zinc-700 text-white rounded hover:bg-zinc-700 transition cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>

            {/* List of current simple player names with badge */}
            <div className="flex flex-wrap gap-2">
              {playerNames.map((name, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center pl-3 pr-2 py-1 bg-zinc-950/60 border border-zinc-800 rounded-full text-xs text-zinc-300 font-medium"
                >
                  {name}
                  <button
                    type="button"
                    onClick={() => handleRemovePlayerName(idx)}
                    className="ml-2 text-gray-500 hover:text-red-400 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            {/* Button to let Gemini auto-generate deep roles/secrets */}
            <button
              type="button"
              onClick={handleGenerateRoles}
              disabled={isGeneratingRoles}
              className={`w-full py-3 px-4 rounded-lg font-mono text-xs uppercase font-bold tracking-wider border flex items-center justify-center gap-2 transition duration-300 cursor-pointer ${
                isGeneratingRoles 
                  ? "bg-zinc-950 border-zinc-800 text-zinc-500 cursor-not-allowed" 
                  : "bg-red-500/10 border-red-500/40 hover:bg-red-500/25 text-red-400 shadow-md shadow-red-950/20 pointer-events-auto"
              }`}
            >
              {isGeneratingRoles ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generoidaan Roolihahmoja...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Generoi Roolit & Motiivit Tekoälyllä
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step 4: View generated roles and edit them if needed */}
        {players.length > 0 && (
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-xl space-y-6 shadow-xl leading-relaxed animate-fade-in-up mt-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center space-x-2 text-white font-semibold font-mono">
                <span className="w-6 h-6 flex items-center justify-center bg-red-500/20 text-red-400 border border-red-500/40 rounded text-xs animate-pulse">4</span>
                <h3>ROOLIHAHMOT JA SALAISUUDET ({activeThemeTitle})</h3>
              </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">GMin Muokattavissa vapaasti</span>
              </div>

              <p className="text-gray-400 text-xs font-sans">
                Tekoäly loi teemaan sopivat juonikytkökset. Voit hienosäätää rooleja ja salaisuuksia ennen pelin julistamista alkaneeksi!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {players.map((p, idx) => (
                  <div key={p.id} className="bg-zinc-950/40 border border-zinc-800/80 rounded-lg p-4 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-200 font-mono flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                        {p.name}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-500 mb-1">Draamallinen Rooli / Virka</label>
                        <input
                          type="text"
                          value={p.role}
                          onChange={(e) => handleManualPlayerChange(idx, 'role', e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-zinc-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-500 mb-1">Motiivi tai Hidden Role -Salaisuus</label>
                        <textarea
                          rows={2}
                          value={p.secret}
                          onChange={(e) => handleManualPlayerChange(idx, 'secret', e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700 font-sans leading-relaxed resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleLaunchGame}
                  className="py-3 px-8 rounded-lg bg-red-650 hover:bg-red-500 text-white font-mono uppercase font-bold text-xs tracking-wider border border-red-500/20 flex items-center gap-2 transition duration-300 shadow-lg shadow-red-950/40 animate-pulse hover:animate-none cursor-pointer"
                >
                  Käynnistä Junailtu Rooli-ilmaisu!
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6 animate-fade-in pb-10">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h3 className="font-mono text-sm font-bold text-white uppercase flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              Skenaariot ja Käsikirjoitukset ({PREMADE_SCENARIOS.length + customSaved.length} kpl)
            </h3>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Valmis hätävarasessio sekunneissa</span>
          </div>

          <div className="p-4 bg-amber-950/20 border border-amber-500/35 text-amber-200 rounded-lg text-xs font-sans leading-relaxed">
            💡 <strong>Hätävara-Kirjasto:</strong> Täältä löydät pre-generoidut skenaariot valmiina heti pelattavaksi. Tämä ratkaisu toimii täysin itsenäisesti ilman tekoälyn reaaliaikaisia hakuja (erinomainen hätävara testatessa, jos tekoälypalvelussa on katkoksia tai haluat pelata valmiita skenaarioita heti).
            <span className="block mt-1 font-mono text-amber-450">Voit myös ladata AI:n luomia loistavia matkoja ja tallentaa niitä tänne hätävaraksi "Tallenna" -napilla yläkulmasta!</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[...PREMADE_SCENARIOS, ...customSaved].map((scenario) => (
              <div 
                key={scenario.id} 
                className={`border rounded-xl p-5 bg-zinc-900/60 transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                  scenario.isPremade 
                    ? "border-amber-500/20 hover:border-amber-500/30 shadow-inner" 
                    : "border-purple-500/20 hover:border-purple-500/30"
                }`}
              >
                <div className="space-y-3 max-w-2xl text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider font-bold ${
                      scenario.isPremade 
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                        : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    }`}>
                      {scenario.isPremade ? "Valmis Skenaario" : "Oma Tallennus"}
                    </span>
                    <h4 className="font-mono text-sm md:text-base font-black text-white leading-tight">
                      {scenario.title}
                    </h4>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed font-sans normal-case">
                    {scenario.description}
                  </p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-mono text-zinc-500 uppercase">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-zinc-600 inline" />
                      Pelaajia: <strong className="text-zinc-300">{scenario.config.players.length}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-600 inline" />
                      Kohtauksia: <strong className="text-zinc-300">{scenario.scenes.length}</strong>
                    </span>
                    <span className="text-zinc-300 truncate max-w-xs md:max-w-sm">
                      Kategoria: <strong>{scenario.config.theme}</strong>
                    </span>
                  </div>

                  {/* Show players roles preview */}
                  <div className="p-2 bg-zinc-950/40 rounded border border-zinc-850/60 text-[11px] font-mono">
                    <span className="text-[9px] text-zinc-500 uppercase block font-semibold mb-1">Mukaantulevat hahmot & virat:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {scenario.config.players.map((p, pIdx) => (
                        <span key={pIdx} className="bg-zinc-900 border border-zinc-850 text-zinc-300 px-2 py-0.5 rounded text-[10px]">
                          👤 {p.name} ({p.role})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Play Action and Delete Action */}
                <div className="flex items-center gap-2 sm:self-end md:self-auto shrink-0 justify-end">
                  {!scenario.isPremade && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCustomScenario(scenario.id, e)}
                      className="p-3 rounded-lg bg-zinc-950 border border-zinc-850 text-gray-500 hover:text-red-400 hover:border-red-500/20 transition cursor-pointer"
                      title="Poista skenaario kirjastosta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onStartScenario(scenario)}
                    className="py-3 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono uppercase font-bold text-xs tracking-wider border border-emerald-500/20 flex items-center gap-1.5 transition duration-300 shadow-md hover:scale-[1.02] cursor-pointer"
                  >
                    Käynnistä peli
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
