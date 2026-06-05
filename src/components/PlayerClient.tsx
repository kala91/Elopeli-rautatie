import React, { useState, useEffect } from "react";
import { Compass, Shield, Check, RefreshCw, User, HelpCircle } from "lucide-react";

interface ActiveGamePayload {
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

export function PlayerClient() {
  const [activeGame, setActiveGame] = useState<ActiveGamePayload | null>(null);
  const [selectedCharacterName, setSelectedCharacterName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore previous character choice from localStorage if available
  useEffect(() => {
    const savedChar = localStorage.getItem("rautatie_player_character");
    if (savedChar) {
      setSelectedCharacterName(savedChar);
    }
  }, []);

  // Poll the active game from the server
  useEffect(() => {
    let active = true;

    const fetchGame = async () => {
      try {
        const res = await fetch("/api/active-game");
        if (!res.ok) throw new Error("Palvelinvirhe pelitietojen haussa.");
        const data = await res.json();
        
        if (active) {
          setActiveGame(data.activeGame || null);
          setError(null);
        }
      } catch (err: any) {
        console.error("Failed to poll active game", err);
        if (active) {
          setError("Yhteys palvelimeen katkesi. Yritetään uudelleen...");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchGame();
    const interval = setInterval(fetchGame, 2000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleSelectCharacter = (name: string) => {
    setSelectedCharacterName(name);
    localStorage.setItem("rautatie_player_character", name);
  };

  const handleDeselectCharacter = () => {
    setSelectedCharacterName("");
    localStorage.removeItem("rautatie_player_character");
  };

  const handleToggleReady = async () => {
    if (!activeGame || !selectedCharacterName) return;

    const currentReady = !!activeGame.readiness?.[selectedCharacterName];
    const nextReady = !currentReady;

    try {
      const res = await fetch("/api/player-ready", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: activeGame.roomCode,
          characterName: selectedCharacterName,
          ready: nextReady
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveGame(data.activeGame);
      }
    } catch (e) {
      console.error("Failed to toggle readiness", e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="space-y-4 text-center">
          <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto" />
          <p className="text-sm font-mono text-zinc-400">Ladataan pelaajaliittymää...</p>
        </div>
      </div>
    );
  }

  // State: No active game running on the server
  if (!activeGame) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center font-sans relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(24,24,27,0.8),rgba(9,9,11,1))] pointer-events-none z-0"></div>
        
        <div className="max-w-sm space-y-6 z-10 relative">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
            <Compass className="w-8 h-8 animate-pulse-slow" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-lg font-mono font-black tracking-widest text-white uppercase">
              ODOTETAAN PELIÄ...
            </h1>
            <p className="text-zinc-400 text-xs leading-relaxed normal-case font-sans">
              Peliä ei ole vielä käynnistetty pelinjohtajan koneella. Kun GM käynnistää skenaarion valkokankaalla, nähdään hahmovalinnat tässä automaattisesti!
            </p>
          </div>

          <div className="inline-block py-2 px-4 rounded bg-zinc-900/50 border border-zinc-800/40 text-[11px] font-mono text-amber-500/80">
            ☕ Ota mukava asento ja odota hetki...
          </div>
        </div>
      </div>
    );
  }

  // Filter players list to find chosen or dead ones
  const isSelectedDead = activeGame.players.find(p => p.name === selectedCharacterName)?.isDead;
  const matchedTask = activeGame.playerTasks.find(t => t.characterName === selectedCharacterName);
  const isCharacterReady = !!activeGame.readiness?.[selectedCharacterName];

  // State: Game is active but player hasn't chose their character yet
  if (!selectedCharacterName || !activeGame.players.some(p => p.name === selectedCharacterName)) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-5 font-sans relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(24,24,27,0.8),rgba(9,9,11,1))] pointer-events-none z-0"></div>

        <div className="max-w-md w-full mx-auto space-y-6 z-10 relative py-4">
          <header className="text-center space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-red-500 font-bold uppercase block">
              LIITTYNYT HUONEESEEN: {activeGame.roomCode}
            </span>
            <h1 className="text-xl font-mono font-black text-white uppercase">VALITSE HAHMOSI</h1>
            <p className="text-zinc-400 text-[11px]">Valitse oma roolihahmosi listasta aloittaaksesi pelaamisen:</p>
          </header>

          {error && (
            <div className="p-3 rounded bg-red-950/20 border border-red-900/30 text-xs text-red-400 font-mono">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-3">
            {activeGame.players.map((player) => {
              const isOtherReady = !!activeGame.readiness?.[player.name];
              return (
                <button
                  key={player.id}
                  onClick={() => handleSelectCharacter(player.name)}
                  className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer bg-zinc-900/80 hover:bg-zinc-900 ${
                    player.isDead 
                      ? "border-red-950/60 opacity-60 bg-red-950/10" 
                      : "border-zinc-800 hover:border-zinc-700 active:scale-98"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold text-white font-sans`}>{player.name}</span>
                      {player.isDead && (
                        <span className="text-[9px] bg-red-900/40 text-red-150 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Menehtynyt 💀</span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono tracking-wider">{player.role}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isOtherReady && (
                      <span className="text-[9px] bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 px-1.5 py-0.5 rounded font-mono uppercase">Valmis ✓</span>
                    )}
                    <span className="p-1 px-2.5 rounded bg-zinc-950 border border-zinc-850 font-mono text-[10px] text-zinc-400">
                      Valitse →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <span className="text-[10px] font-mono text-zinc-600 block">
              Aktiivinen kohtaus: {activeGame.sceneTitle}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // State: Character chosen! Display current roleplay instructions
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(24,24,27,0.8),rgba(9,9,11,1))] pointer-events-none z-0"></div>

      <div className="max-w-md w-full mx-auto p-4 flex-grow flex flex-col space-y-4 z-10 relative">
        
        {/* Mobile Header bar */}
        <header className="flex items-center justify-between p-3.5 bg-zinc-900/70 border border-zinc-850 rounded-xl">
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono text-red-400 tracking-widest font-bold uppercase block -mb-0.5">HUONE: {activeGame.roomCode}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black font-mono text-white tracking-tight uppercase">{selectedCharacterName}</span>
              {isSelectedDead && <span className="text-[9px] bg-red-950 p-0.5 px-1 rounded text-red-400 border border-red-900/30 uppercase">Kuollut ☠️</span>}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono block -mt-0.5">
              {activeGame.players.find(p => p.name === selectedCharacterName)?.role}
            </span>
          </div>

          <button
            onClick={handleDeselectCharacter}
            className="text-[10px] bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 px-2.5 py-1.5 rounded-lg font-mono transition uppercase cursor-pointer"
          >
            Vaihda hahmoa
          </button>
        </header>

        {error && (
          <div className="p-3 text-center rounded-xl bg-orange-950/20 border border-orange-900/30 text-[11px] text-orange-400 font-mono animate-pulse">
            ⚠️ {error}
          </div>
        )}

        {/* Scene Context banner */}
        <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-900 space-y-1 text-center">
          <span className="text-[9px] font-mono text-zinc-500 tracking-wider font-bold uppercase block mb-0.5">MENEILLÄÄN OLEVA KOHTAUS:</span>
          <h2 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-tight">{activeGame.sceneTitle}</h2>
          <p className="text-[11px] text-zinc-450 italic line-clamp-2 leading-relaxed font-sans mt-1">
            "{activeGame.narrativeIntroduction}"
          </p>
        </div>

        {/* Core Rooliohje instructions */}
        <div className="flex-grow flex flex-col justify-between space-y-5">
          <div className="space-y-4 pt-1">
            {matchedTask ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 text-[10px] text-zinc-400 font-mono border-b border-zinc-900">
                  <span className="uppercase tracking-widest font-bold">ROOLIOHJEESI KOHTAUKSEEN:</span>
                  <span className="text-zinc-600">🎯 Kohde: {matchedTask.targetCharacter || "Kaikki"}</span>
                </div>

                {/* 1. Instruction Prefix (Action setup) */}
                {matchedTask.instructionPrefix && (
                  <div className="text-sm text-zinc-100 pl-3 border-l-2 border-red-500/40 bg-zinc-900/10 py-1 font-sans leading-relaxed">
                    <strong className="text-[9px] font-mono tracking-wider text-red-400 uppercase block mb-0.5">🎬 TOIMINTA TAI ASENTO:</strong>
                    {matchedTask.instructionPrefix}
                  </div>
                )}

                {/* 2. Dialogue Lines */}
                {matchedTask.dialogueLines && matchedTask.dialogueLines.length > 0 && (
                  <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl space-y-3">
                    <span className="text-[9px] font-mono text-zinc-400 tracking-wider uppercase block">🗣️ REPLIIKIT / TEOT:</span>
                    <div className="space-y-2.5">
                      {matchedTask.dialogueLines.map((line, idx) => (
                        <div key={idx} className="flex items-start gap-2 border-b border-zinc-900 last:border-0 pb-2 last:pb-0">
                          <span className="text-red-500 text-[10px] mt-1 select-none font-bold">▶</span>
                          <p className="text-white text-base font-bold leading-relaxed whitespace-pre-line font-sans">
                            {line}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Postfix */}
                {matchedTask.instructionPostfix && (
                  <div className="text-xs text-zinc-300 bg-zinc-950 p-3 rounded-lg border border-zinc-900/60 font-sans italic leading-relaxed">
                    <strong className="text-[8.5px] font-mono tracking-wider text-zinc-400 uppercase block mb-0.5 not-italic">
                      ✨ TUNNELMA / ELEET:
                    </strong>
                    {matchedTask.instructionPostfix}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center bg-zinc-950 border border-zinc-900 rounded-xl space-y-2">
                <HelpCircle className="w-8 h-8 text-zinc-700 mx-auto animate-pulse-slow" />
                <p className="text-xs font-mono text-zinc-400 uppercase">EI AKTIIVISTA TEHTÄVÄÄ</p>
                <p className="text-[11px] text-zinc-500 normal-case">
                  Hahmollasi ei ole erityistehtävää tai toimintaohjeita tässä kohtauksessa. Seuraa aktiivisesti muiden peliä!
                </p>
              </div>
            )}
          </div>

          {/* Big "Ja sitten..." readiness command button */}
          <div className="pt-4 pb-2">
            <button
              onClick={handleToggleReady}
              className={`w-full p-4 rounded-2xl border font-bold text-sm tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2.5 select-none active:scale-95 shadow-lg ${
                isCharacterReady
                  ? "bg-emerald-650 hover:bg-emerald-600 border-emerald-500 text-white shadow-emerald-950/20"
                  : "bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-200 shadow-zinc-950/40 cursor-pointer"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                isCharacterReady 
                  ? "bg-white border-white text-emerald-600" 
                  : "border-zinc-650 font-bold text-[10px] text-zinc-400"
              }`}>
                {isCharacterReady ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : "✓"}
              </div>

              <span>
                {isCharacterReady ? "Valmiina siirtoon! ⏱" : "Ja sitten..."}
              </span>
            </button>
            <span className="text-[9px] font-mono text-zinc-500 block text-center mt-2.5">
              {isCharacterReady 
                ? "Ilmoitettu pelille, että tarinatilanteesi on suoritettu."
                : "Klikkaa tästä, kun olet noudattanut rooliasetustasi!"
              }
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
