import React, { useState, useEffect } from "react";
import { GameConfig, Scene, Player, GameState, PlayerScore } from "./types";
import { GameSetup } from "./components/GameSetup";
import { SceneNarrative } from "./components/SceneNarrative";
import { PlayerTaskGrid } from "./components/PlayerTaskGrid";
import { GmPanel } from "./components/GmPanel";
import { DramaturgicalLog } from "./components/DramaturgicalLog";
import { EpilogueView } from "./components/EpilogueView";
import { PlayerClient } from "./components/PlayerClient";
import { SavedScenario, saveScenarioToLibrary } from "./data/premadeScenarios";
import { Film, Skull, Eye, EyeOff, AlertTriangle, RefreshCw, Compass, ArrowRight, Download, Upload, QrCode } from "lucide-react";

// List of fun, thematic loading quotes to alternate during AI generation
const LOADING_QUOTES = [
  "Lasketaan draaman kaarta ja konfliktipistettä...",
  "Haudotaan seuraavan kohtauksen salaisuuksia...",
  "Piirretään tylyä, junailtua tarinanhahmoa...",
  "Koordinoidaan pelaajien jännitteitä keskenään...",
  "Viritytään ihmis-pelinjohtajan huomioihin...",
  "Valmistellaan dramaturgista kliimaksia...",
  "Kiinnitetään kohtalon raiteita kasaan..."
];

export default function App() {
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [history, setHistory] = useState<Scene[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  // Game control states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGmView, setIsGmView] = useState(true); // default to true so GM sees their panel at the start
  const [showGmControls, setShowGmControls] = useState(false); // Collapsed by default to keep the projected screen clean!
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [epilogueText, setEpilogueText] = useState("");
  const [judgmentText, setJudgmentText] = useState("");
  const [premadeEpilogueText, setPremadeEpilogueText] = useState("");
  const [premadeJudgmentText, setPremadeJudgmentText] = useState("");
  const [allScenes, setAllScenes] = useState<Scene[]>([]);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [savedNotice, setSavedNotice] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveScenarioName, setSaveScenarioName] = useState("");
  
  // Fun rotating loading quote index
  const [loadingQuoteIdx, setLoadingQuoteIdx] = useState(0);

  // Player Client & Room Synchronized States
  const [isPlayerClient, setIsPlayerClient] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [readiness, setReadiness] = useState<Record<string, boolean>>({});
  const [showQrModal, setShowQrModal] = useState(false);

  // Parse URL parameters to check if client is joining as a phone/mobile player
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("join") === "true" || params.has("room") || params.has("playerClient")) {
      setIsPlayerClient(true);
    }
  }, []);

  // Generate or restore game room Code
  useEffect(() => {
    const saved = localStorage.getItem("rautatie_game_state");
    let codeToUse = "";
    if (saved) {
      try {
        const stateObj = JSON.parse(saved);
        if (stateObj.roomCode) {
          codeToUse = stateObj.roomCode;
        }
      } catch (e) {}
    }
    
    if (!codeToUse) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
      for (let i = 0; i < 4; i++) {
        codeToUse += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    setRoomCode(codeToUse);
  }, []);

  // Sync game state to server whenever changed
  useEffect(() => {
    if (isStarted && config && currentScene && roomCode) {
      const syncActiveGame = () => {
        fetch("/api/sync-game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomCode,
            sceneNumber: currentScene.sceneNumber,
            sceneTitle: currentScene.sceneTitle,
            narrativeIntroduction: currentScene.narrativeIntroduction,
            players: config.players,
            playerTasks: currentScene.playerTasks,
            gameActive: true
          })
        }).catch(err => console.error("Could not sync active game state to backend:", err));
      };

      syncActiveGame();
      const intervalId = setInterval(syncActiveGame, 3000);
      return () => clearInterval(intervalId);
    } else if (!isStarted) {
      fetch("/api/sync-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameActive: false })
      }).catch(err => console.error("Could not clear active game state:", err));
    }
  }, [isStarted, config, currentScene, roomCode]);

  // Poll player readiness states and auto-advance when all living characters are ready
  useEffect(() => {
    if (!isStarted || isFinished || isGenerating) return;

    const pollReadiness = async () => {
      try {
        const res = await fetch("/api/active-game");
        if (res.ok) {
          const data = await res.json();
          if (data.activeGame && data.activeGame.readiness) {
            setReadiness(data.activeGame.readiness);

            // Double check if all players that are alive have completed their task
            const livingPlayers = config?.players.filter(p => !p.isDead) || [];
            if (livingPlayers.length > 0) {
              const allReady = livingPlayers.every(p => data.activeGame.readiness[p.name]);
              if (allReady && !isGenerating) {
                // Auto transition! Add brief pause for UX
                handleGenerateNextScene("Kaikki pelaajat suorittivat tehtävänsä ja klikkasivat 'Ja sitten...'");
              }
            }
          }
        }
      } catch (e) {
        console.error("Readiness poll failed:", e);
      }
    };

    const intervalId = setInterval(pollReadiness, 2000);
    return () => clearInterval(intervalId);
  }, [isStarted, isFinished, isGenerating, config, currentScene, history]);

  // Rotate loading quotes when generation is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingQuoteIdx((prev) => (prev + 1) % LOADING_QUOTES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Load game state from localStorage on mount (for persistent in-person play resilience!)
  useEffect(() => {
    const saved = localStorage.getItem("rautatie_game_state");
    if (saved) {
      try {
        const stateObj = JSON.parse(saved);
        if (stateObj.config && stateObj.isStarted) {
          setConfig(stateObj.config);
          setCurrentScene(stateObj.currentScene);
          setHistory(stateObj.history || []);
          setIsStarted(stateObj.isStarted);
          setIsFinished(stateObj.isFinished || false);
          setEpilogueText(stateObj.epilogueText || "");
          setJudgmentText(stateObj.judgmentText || "");
          setPremadeEpilogueText(stateObj.premadeEpilogueText || "");
          setPremadeJudgmentText(stateObj.premadeJudgmentText || "");
          setAllScenes(stateObj.allScenes || []);
          setScores(stateObj.scores || []);
          if (stateObj.roomCode) {
            setRoomCode(stateObj.roomCode);
          }
        }
      } catch (e) {
        console.error("Local storage restoration failed", e);
      }
    }
  }, []);

  // Sync game state to localStorage
  const syncStorage = (
    cfg: GameConfig | null, 
    curS: Scene | null, 
    hist: Scene[], 
    started: boolean, 
    finished: boolean,
    epText = "",
    jdText = "",
    scns: Scene[] = [],
    preEpText = "",
    preJdText = "",
    scrList: PlayerScore[] = []
  ) => {
    if (started) {
      localStorage.setItem("rautatie_game_state", JSON.stringify({
        config: cfg,
        currentScene: curS,
        history: hist,
        isStarted: started,
        isFinished: finished,
        epilogueText: epText,
        judgmentText: jdText,
        allScenes: scns,
        premadeEpilogueText: preEpText,
        premadeJudgmentText: preJdText,
        scores: scrList,
        roomCode: roomCode
      }));
    } else {
      localStorage.removeItem("rautatie_game_state");
    }
  };

  const handleStartGame = async (selectedConfig: GameConfig) => {
    setIsGenerating(true);
    setError(null);
    setConfig(selectedConfig);
    setPremadeEpilogueText("");
    setPremadeJudgmentText("");

    try {
      // Generate the entire scenario (all scenes) at once
      const res = await fetch("/api/generate-full-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: selectedConfig
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Koko skenaarion alustaminen kerralla tekoälyltä epäonnistui.");
      }

      const data = await res.json();
      if (!data.scenes || data.scenes.length === 0) {
        throw new Error("Tekoäly ei palauttanut yhtään kohtausta skenaariossa.");
      }

      const generatedScenes = data.scenes;
      setAllScenes(generatedScenes);

      // Start with the first generated scene (Scene 1)
      const firstScene = generatedScenes[0];
      setCurrentScene(firstScene);
      setIsStarted(true);
      setHistory([]);
      setIsFinished(false);

      syncStorage(selectedConfig, firstScene, [], true, false, "", "", generatedScenes, "", "");

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Yhteysvirhe tekoälypalveluun. Varmista, että GEMINI_API_KEY on konfiguroitu oikein.");
      setConfig(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartScenario = (scenario: SavedScenario) => {
    setError(null);
    setConfig(scenario.config);
    setAllScenes(scenario.scenes);
    
    const firstScene = scenario.scenes[0];
    setCurrentScene(firstScene);
    setIsStarted(true);
    setHistory([]);
    setIsFinished(false);
    setEpilogueText("");
    setJudgmentText("");
    setScores([]);
    setPremadeEpilogueText(scenario.epilogueText || "");
    setPremadeJudgmentText(scenario.judgmentText || "");
    
    syncStorage(scenario.config, firstScene, [], true, false, "", "", scenario.scenes, scenario.epilogueText || "", scenario.judgmentText || "", []);
  };

  const handleSaveScenarioToLibrary = () => {
    if (!config || !allScenes || allScenes.length === 0) return;
    setSaveScenarioName(`${config.theme} (${config.players.length} pelaajaa)`);
    setShowSaveModal(true);
  };

  const handleConfirmSaveScenario = () => {
    if (!config || !allScenes || allScenes.length === 0) return;
    
    const finalTitle = saveScenarioName.trim() || `${config.theme} (${config.players.length} pelaajaa)`;
    
    const newScenario: SavedScenario = {
      id: `custom-${Date.now()}`,
      title: finalTitle,
      description: config.initialIdea || "Manuaalisesti tallennettu peli",
      config: config,
      scenes: allScenes
    };
    
    saveScenarioToLibrary(newScenario);
    setShowSaveModal(false);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
    }, 3000);
  };

  const handleDownloadBackupJson = () => {
    try {
      const backupData = {
        config,
        history,
        currentScene,
        allScenes,
        epilogueText,
        scores,
        isStarted,
        isFinished,
        premadeEpilogueText,
        premadeJudgmentText,
        timestamp: new Date().toISOString()
      };
      
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      const filename = `rautatie-peli-${config?.theme?.toLowerCase().replace(/[^a-z0-9]/g, "-") || "varmuuskopio"}.json`;
      downloadAnchor.setAttribute("download", filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error("Backup download failed", e);
      alert("Virhe ladattaessa varmuuskopiota.");
    }
  };

  const handleImportBackupJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.config) {
          setConfig(data.config);
          setHistory(data.history || []);
          setCurrentScene(data.currentScene || null);
          setAllScenes(data.allScenes || []);
          setEpilogueText(data.epilogueText || "");
          setScores(data.scores || []);
          setPremadeEpilogueText(data.premadeEpilogueText || "");
          setPremadeJudgmentText(data.premadeJudgmentText || "");
          setIsStarted(data.isStarted !== undefined ? data.isStarted : true);
          setIsFinished(data.isFinished || false);
          setError(null);
          
          localStorage.setItem("rautatie_game_state", JSON.stringify(data));
          alert("✓ Varmuuskopiotiedosto tuotu ja synkronoitu onnistuneesti! Voit jatkaa peliä tästä hetkestä.");
        } else {
          alert("Virhe: Tiedostossa ei ole valideja Rautatie-pelin konfiguraatioita.");
        }
      } catch (err) {
        console.error("JSON parse failed", err);
        alert("Virhe luettaessa tiedostoa. Varmista, että se on oikeaa JSON-muotoa.");
      }
    };
    reader.readAsText(file);
  };

  const handleUpdatePlayersInConfig = (updatedPlayers: Player[]) => {
    if (!config) return;
    const updatedConfig = { ...config, players: updatedPlayers };
    setConfig(updatedConfig);
    syncStorage(updatedConfig, currentScene, history, isStarted, isFinished, epilogueText, judgmentText, allScenes, premadeEpilogueText, premadeJudgmentText, scores);
  };

  const handleGenerateNextScene = async (humanNotes: string) => {
    if (!config || !currentScene) return;

    setIsGenerating(true);
    setError(null);

    // Save notes of current scene into history stack
    const sceneToArchive = {
      ...currentScene,
      humanGmNotesFeedback: humanNotes || undefined
    };
    const updatedHistory = [...history, sceneToArchive];
    setHistory(updatedHistory);

    const nextSceneNum = currentScene.sceneNumber + 1;
    const isOverLimit = nextSceneNum > config.totalScenes;

    try {
      if (isOverLimit) {
        // If we already have a pre-saved epilogue (for premade offline scenarios), use that instead of calling AI!
        const finalEpilogue = premadeEpilogueText || epilogueText;
        if (finalEpilogue) {
          setEpilogueText(finalEpilogue);
          setScores([]);
          setIsFinished(true);
          syncStorage(config, currentScene, updatedHistory, true, true, finalEpilogue, "", allScenes, premadeEpilogueText, premadeJudgmentText, []);
          setIsGenerating(false);
          return;
        }

        // Otherwise generate via Gemini for custom live AI games
        const res = await fetch("/api/generate-epilogue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config: config,
            history: updatedHistory,
            humanGmNotes: humanNotes
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Epilogin muodostaminen epäonnistui.");
        }

        const data = await res.json();
        setEpilogueText(data.epilogue);
        setScores(data.scores || []);
        setIsFinished(true);

        syncStorage(config, currentScene, updatedHistory, true, true, data.epilogue, "", allScenes, "", "", data.scores || []);

      } else {
        // Move to the next pre-generated scene instantly!
        const nextScene = allScenes[nextSceneNum - 1];
        if (!nextScene) {
          throw new Error(`Ennalta luotua kohtausta numero ${nextSceneNum} ei löytynyt.`);
        }
        
        setCurrentScene(nextScene);
        syncStorage(config, nextScene, updatedHistory, true, false, epilogueText, judgmentText, allScenes, premadeEpilogueText, premadeJudgmentText, scores);
      }

    } catch (err: any) {
      console.error(err);
      setError(`Rautatien siirrossa sattui virhe: ${err.message || 'Tekoälyyhteys katkesi.'}`);
      // Revert history back so GM can re-try safely
      setHistory(history);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetGame = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    setConfig(null);
    setCurrentScene(null);
    setHistory([]);
    setAllScenes([]);
    setIsStarted(false);
    setIsFinished(false);
    setEpilogueText("");
    setJudgmentText("");
    setScores([]);
    setPremadeEpilogueText("");
    setPremadeJudgmentText("");
    setError(null);
    setShowResetConfirm(false);
    syncStorage(null, null, [], false, false, "", "", [], "", "", []);
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
  };

  if (isPlayerClient) {
    return <PlayerClient />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-gray-100 flex flex-col font-sans transition-colors duration-500 relative">
      
      {/* Background static fog/vibe */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(24,24,27,0.8),rgba(9,9,11,1))] pointer-events-none z-0"></div>

      {/* Atmospheric Full screen loader */}
      {isGenerating && (
        <div className="fixed inset-0 bg-zinc-950/90 flex flex-col items-center justify-center z-50 p-6 backdrop-blur-sm animate-fade-in uppercase">
          <div className="space-y-6 text-center max-w-sm">
            {/* Spinning visual compass */}
            <div className="relative w-20 h-20 mx-auto">
              {/* Outer ticking border */}
              <div className="absolute inset-0 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin"></div>
              {/* Spinning compass center */}
              <div className="absolute inset-2 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <Compass className="w-8 h-8 text-red-500 animate-pulse-slow" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-mono tracking-widest font-extrabold text-white">
                ORCHESTRATING SCENE...
              </h2>
              <p className="text-xs text-zinc-500 font-mono tracking-wide">
                Rautatie -tekoäly rakentaa sosiaalisia akseleita
              </p>
            </div>

            {/* Rotating text */}
            <div className="p-3 bg-zinc-900/60 border border-zinc-900 rounded-lg min-h-[50px] flex items-center justify-center">
              <span className="text-[11px] text-amber-400 font-mono italic animate-pulse">
                "{LOADING_QUOTES[loadingQuoteIdx]}"
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Primary Application Body */}
      <div className="relative z-10 flex-grow flex flex-col select-none md:select-text">
        
        {/* Navigation / Live App Top Bar */}
        <header className="border-b border-zinc-900 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-8 h-8 rounded-lg bg-red-650 flex items-center justify-center border border-red-500/20 shadow-md">
                <Film className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <span className="text-sm md:text-base font-mono font-black text-white tracking-tight uppercase leading-tight">
                  <span className="text-red-500">RAUTATIE</span> MOOTTORI
                </span>
                <span className="text-[10px] text-zinc-500 font-mono block -mt-1 hidden sm:block uppercase">
                  Hidden Role RPG Conductor
                </span>
              </div>
            </div>

            {/* Quick status details during play */}
            <div className="flex items-center gap-1.5 md:gap-3 font-mono text-xs">
              
              {/* Backups trigger buttons (Import / Export) on top bar */}
              <input
                id="backup-import-file-input"
                type="file"
                accept=".json"
                onChange={handleImportBackupJson}
                className="hidden"
              />
              
              <button
                type="button"
                onClick={() => document.getElementById("backup-import-file-input")?.click()}
                className="py-1.5 px-2 md:px-2 rounded-lg font-mono text-[10px] md:text-xs font-bold border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-emerald-400 cursor-pointer flex items-center gap-1 transition"
                title="Lataa / Tuo aiemmin ladattu peli JSON-tiedostosta"
              >
                <Upload className="w-3 h-3 text-zinc-500" />
                <span className="hidden lg:inline">Tuo peli</span>
              </button>

              {isStarted && config && (
                <>
                  <div className="flex items-center gap-1.5 md:gap-2.5 bg-zinc-900/90 border border-zinc-850 py-1.5 px-3 rounded-lg text-white font-mono text-[10px] md:text-xs">
                    <span className="text-zinc-500 uppercase tracking-widest font-black text-[9px]">HUONE:</span>
                    <strong className="text-amber-500 font-black tracking-widest text-sm uppercase">{roomCode}</strong>
                    
                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="ml-1 p-1 px-1.5 border border-red-500/30 text-red-400 hover:text-white rounded flex items-center gap-1 bg-red-950/20 cursor-pointer transition uppercase text-[9px] md:text-[10px] font-extrabold"
                      title="Näytä pelaajien liittymis QR-koodi"
                    >
                      <QrCode className="w-3 h-3 text-red-450" />
                      <span>Puhelinliitos</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadBackupJson}
                    className="py-1.5 px-2 md:px-2 rounded-lg font-mono text-[10px] md:text-xs font-bold border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-amber-400 cursor-pointer flex items-center gap-1 transition"
                    title="Lataa nykyinen peli JSON-varmuuskopiona tietokoneellesi"
                  >
                    <Download className="w-3 h-3 text-zinc-500" />
                    <span className="hidden lg:inline font-bold">Lataa JSON</span>
                  </button>

                  {/* Secondary settings toggle embedded in sticky header */}
                  <button
                    type="button"
                    onClick={() => setShowGmControls(!showGmControls)}
                    className={`py-1.5 px-2 md:px-3 rounded-lg font-mono text-[10px] md:text-xs font-extrabold border transition cursor-pointer select-none ${
                      showGmControls
                        ? "border-amber-500/30 bg-amber-950/20 text-amber-400"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200"
                    }`}
                    title={showGmControls ? "Piilota erikoishallinta" : "Erikoissäädöt & Raportointi"}
                  >
                    ⚙️ <span className="hidden md:inline">{showGmControls ? "Piilota hallinta" : "Säädöt"}</span>
                  </button>

                  {allScenes && allScenes.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSaveScenarioToLibrary}
                      className="px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-all flex items-center gap-1 cursor-pointer"
                      title="Tallenna skenaario valmiiden pelien kirjastoon"
                    >
                      💾 <span className="hidden lg:inline font-bold">Tallenna</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleResetGame}
                    className="px-2 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-950/60 border border-red-500/20 text-red-400 transition hover:text-red-350 cursor-pointer"
                  >
                    Keskeytä
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Global Toast Notification */}
        {savedNotice && (
          <div className="fixed top-18 right-6 z-50 bg-amber-950/90 border border-amber-500 text-amber-300 px-4 py-3 rounded-lg shadow-2xl font-mono text-xs flex items-center gap-2.5 animate-pulse-slow">
            <span>💾 <strong>SKENAARIO TALLENNETTU:</strong> Löytyy nyt valmiiden pelien hätävara-kirjastostasi!</span>
          </div>
        )}

        {/* Outer view router container */}
        <main className="flex-grow">
          {error && (
            <div className="max-w-xl mx-auto mt-6 p-4 bg-red-950/30 border border-red-500/30 text-red-300 rounded-lg text-xs md:text-sm font-mono flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <strong>TEKNINEN VIRHE:</strong> {error}
                <button
                  onClick={() => setError(null)}
                  className="mt-2 block px-3 py-1 bg-zinc-900 border border-zinc-800 text-white rounded text-[10px] hover:bg-zinc-800 transition uppercase"
                >
                  Sulje virheviesti
                </button>
              </div>
            </div>
          )}

          {!isStarted ? (
            // Phase 1: Game Settings Setup
            <div className="py-6 md:py-10">
              <GameSetup 
                onStartGame={handleStartGame} 
                onStartScenario={handleStartScenario} 
              />
            </div>
          ) : isFinished ? (
            // Phase 3: Epilogue and outcomes
            <div className="py-6 md:py-10">
              <EpilogueView
                config={config!}
                history={history}
                epilogueText={epilogueText}
                scores={scores}
                onResetGame={handleResetGame}
                onDownloadBackup={handleDownloadBackupJson}
              />
            </div>
          ) : (
            // Phase 2: Core gameplay view - expanded to maximum monitor width for in-room wall projection
            <div className="max-w-full px-4 md:px-8 xl:px-12 py-6 space-y-6 pb-32">
              
              {/* Scene Description Card */}
              {currentScene && (
                <SceneNarrative 
                  scene={currentScene} 
                  totalScenes={config!.totalScenes} 
                  onNextScene={() => handleGenerateNextScene("")}
                  isGenerating={isGenerating}
                />
              )}

              {/* Character Prompt Grid */}
              {currentScene && config && (
                <PlayerTaskGrid
                  players={config.players}
                  tasks={currentScene.playerTasks}
                  isGmView={isGmView}
                  readiness={readiness}
                />
              )}



              {/* Render the full Human GM detailed comment panel and casualties editor, if requested/expanded */}
              {currentScene && config && showGmControls && (
                <div className="animate-slide-down">
                  <GmPanel
                    players={config.players}
                    currentScene={currentScene}
                    isGmView={isGmView}
                    onToggleViewMode={() => setIsGmView(!isGmView)}
                    onUpdatePlayers={handleUpdatePlayersInConfig}
                    onGenerateNextScene={handleGenerateNextScene}
                    isGenerating={isGenerating}
                    sceneCountHistory={history.length}
                  />
                </div>
              )}

              {/* Previous Scenes Logs - Accordion */}
              {history.length > 0 && (
                <DramaturgicalLog history={history} />
              )}

            </div>
          )}
        </main>

        {/* Global Footer info */}
        <footer className="border-t border-zinc-900 py-4 bg-zinc-950/20 text-center font-mono text-[9px] text-zinc-600 z-10 shrink-0 select-none">
          RAUTATIE ENALTA-MÄÄRÄTTY HIDDEN ROLE PELIMOOTTORI © 2026
        </footer>

        {/* Custom state-based overlay confirm modal - avoids iframe window.confirm limits */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-55 p-4 backdrop-blur-md animate-fade-in uppercase font-mono">
            <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6 text-center leading-relaxed">
              <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto mb-2 animate-bounce">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-black text-white">Nollataanko pelin kulku?</h2>
                <p className="text-xs text-zinc-405 font-sans normal-case text-zinc-450">
                  Tämä päättää nykyisen tarinan raiteet ja ohjaa takaisin luonti-ikkunaan. Nykyisiä tietoja ei voi palauttaa.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="flex-1 py-3 px-4 bg-red-650 hover:bg-red-500 text-white rounded-lg font-bold text-xs tracking-wider transition uppercase cursor-pointer"
                >
                  Kyllä, nollaa peli
                </button>
                <button
                  type="button"
                  onClick={handleCancelReset}
                  className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-bold text-xs tracking-wider transition border border-zinc-750 uppercase cursor-pointer"
                >
                  Peruuta
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Scenario Dialog Modal - avoids iframe browser prompts */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-55 p-4 backdrop-blur-md animate-fade-in uppercase font-mono">
            <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6 text-center leading-relaxed">
              <div className="w-12 h-12 rounded-full bg-amber-950/20 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">💾</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-sm font-black text-white">TALLENNA SKENAARIO</h2>
                <p className="text-[10px] text-zinc-500 normal-case leading-relaxed">
                  Anna peli-istunnolle tunnistettava nimi, jotta voit käynnistää sen myöhemmin uudestaan suoraan hätävara-kirjastosta.
                </p>
              </div>
              <div className="space-y-1 text-left normal-case">
                <label className="text-[9px] font-mono uppercase text-zinc-400 block font-bold mb-1">Skenaariolle annettava nimi</label>
                <input
                  type="text"
                  value={saveScenarioName}
                  onChange={(e) => setSaveScenarioName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded p-3 text-sm focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="flex-grow py-2.5 rounded border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-450 hover:text-zinc-300 text-xs font-bold transition cursor-pointer"
                >
                  Peruuta
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSaveScenario}
                  className="flex-grow py-2.5 rounded bg-amber-600 hover:bg-amber-500 border border-amber-500/10 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-amber-950/30 font-mono"
                >
                  Tallenna kirjastoon
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Join Modal */}
        {showQrModal && (
          <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-55 p-4 backdrop-blur-md animate-fade-in uppercase font-mono">
            <div className="max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 text-center leading-relaxed">
              <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto">
                <QrCode className="w-5 h-5" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-sm font-black text-white">LIITY PUHELIMELLA MUKAAN</h2>
                <p className="text-[10px] text-zinc-400 normal-case leading-relaxed font-sans">
                  Skannaa alla oleva QR-koodi puhelimen kameralla liittyäksesi tähän peliin. Voit seurata rooliohjeita kännykältäsi ja kuitata ne valmiiksi.
                </p>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-3 rounded-xl inline-block mx-auto border border-zinc-700 shadow-xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=09090b&data=${encodeURIComponent(
                    window.location.protocol + "//" + window.location.host + "/?join=true"
                  )}`}
                  alt="QR-koodi"
                  className="w-[200px] h-[200px]"
                  title="Skannaa tämä liittyäksesi kännykällä"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase">HUONEKOODI:</div>
                <div className="text-xl font-black text-amber-500 tracking-widest">{roomCode}</div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 font-bold border border-zinc-700 text-xs text-white transition tracking-wide cursor-pointer uppercase"
                >
                  Sulje qr-koodi
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
