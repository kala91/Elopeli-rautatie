import React, { useState } from "react";
import { Player, PlayerTask } from "../types";
import { MessageSquare, ArrowRight, Eye, EyeOff, Skull, Compass, ShieldAlert, Sparkles, HelpCircle, Shield, UserCheck } from "lucide-react";

interface PlayerTaskGridProps {
  players: Player[];
  tasks: PlayerTask[];
  isGmView: boolean; // if true, secrets are always visible
  readiness?: Record<string, boolean>;
}

export function PlayerTaskGrid({ players, tasks, isGmView, readiness = {} }: PlayerTaskGridProps) {
  // Hot-seat or privacy mode state
  const [privacyMode, setPrivacyMode] = useState(false);

  // Store individual card toggles: map of player id -> hidden state
  const [revealedSecrets, setRevealedSecrets] = useState<{ [playerId: string]: boolean }>({});
  const [revealedTasks, setRevealedTasks] = useState<{ [playerId: string]: boolean }>({});

  const toggleRevealSecret = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealedSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRevealTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getSocialBadgeColor = (category: string) => {
    switch (category) {
      case "Kysyvä": return "border-blue-500/30 text-blue-400 bg-blue-950/20";
      case "Toteava": return "border-cyan-500/30 text-cyan-400 bg-cyan-950/20";
      case "Selvittävä": return "border-purple-500/30 text-purple-400 bg-purple-950/20";
      case "Tavoitteleva": return "border-amber-500/30 text-amber-400 bg-amber-950/20";
      case "Hiljainen":
      case "Tarkkaileva": return "border-emerald-500/30 text-emerald-400 bg-emerald-950/20";
      default: return "border-zinc-750 text-zinc-400 bg-zinc-850";
    }
  };

  const getConcreteIndicator = (category: string) => {
    switch (category) {
      case "Monologi": return "💬 Monologi";
      case "Matkiminen": return "🎭 Matkiminen";
      case "Dialogi": return "🗣️ Dialogi";
      case "Fyysinen ele": return "🕺 Fyysinen ele";
      case "Siirtyminen": return "🚶 Siirtyminen";
      case "Esineen kanssa toimiminen": return "📦 Esineen kanssa toimiminen";
      case "Hiljainen jännite": return "🤫 Hiljainen jännite";
      case "Seuraaminen":
      case "Seuraaminen/Varjostus":
      case "Varjostus/Seuraaminen": return "👥 Seuraaminen / Varjostus";
      case "Kuuntelu": return "👂 Kuuntelu";
      default: return "⚡ Toiminta";
    }
  };

  // Determine dynamic grid class based on count of active players
  const activePlayersCount = players.length;
  let gridContainerClass = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4";
  let outerWidthClass = "max-w-full";

  if (activePlayersCount === 1) {
    gridContainerClass = "grid grid-cols-1 gap-4 max-w-2xl mx-auto w-full";
    outerWidthClass = "max-w-2xl mx-auto";
  } else if (activePlayersCount === 2) {
    gridContainerClass = "grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto w-full";
    outerWidthClass = "max-w-5xl mx-auto";
  } else if (activePlayersCount === 3) {
    gridContainerClass = "grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto w-full";
    outerWidthClass = "max-w-6xl mx-auto";
  }

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      
      {/* Header with Hot-seat toggle (Aktiiviset ohjeet sub-header removed to de-clutter) */}
      {!isGmView && (
        <div className="flex justify-end pb-1.5">
          <button
            type="button"
            onClick={() => setPrivacyMode(!privacyMode)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-2 transition duration-300 cursor-pointer ${
              privacyMode 
                ? "bg-purple-950/30 border-purple-500/40 text-purple-300 shadow-md shadow-purple-950/20" 
                : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
            }`}
          >
            <Shield className={`w-3.5 h-3.5 ${privacyMode ? "text-purple-400" : "text-zinc-600"}`} />
            <span>Yksityinen Hot-Seat -tila:</span>
            <strong className="uppercase">{privacyMode ? "PÄÄLLÄ 🔓" : "POIS 🔒"}</strong>
          </button>
        </div>
      )}

      {/* Grid of Players */}
      <div className={gridContainerClass}>
        {players.map((player) => {
          const task = tasks.find(t => t.characterName.toLowerCase() === player.name.toLowerCase());
          const isDead = player.isDead;
          
          // Secret configuration: if GMin view, always reveal.
          // In privacyMode, default to hidden. If not, default to visible.
          const defaultSecretVisible = !privacyMode; 
          const defaultTaskVisible = !privacyMode;

          const isSecretRevealed = isGmView || 
            (revealedSecrets[player.id] !== undefined ? revealedSecrets[player.id] : defaultSecretVisible);
          
          const isTaskRevealed = isDead || isGmView || 
            (revealedTasks[player.id] !== undefined ? revealedTasks[player.id] : defaultTaskVisible);

          return (
            <div 
              key={player.id} 
              className={`relative rounded-xl border p-5 flex flex-col justify-between transition-all duration-300 shadow-xl overflow-hidden ${
                isDead 
                  ? "border-zinc-900 bg-zinc-950/50 text-zinc-600 opacity-60" 
                  : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60"
              } ${activePlayersCount <= 2 ? "min-h-[280px]" : "min-h-[230px]"}`}
            >
              
              {/* Card top edge background flair */}
              {!isDead && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/60 via-amber-500/50 to-purple-500/40"></div>
              )}

              {/* Player / Character Info Header with Same-line name + title */}
              <div className="space-y-2.5 relative pb-2.5 border-b border-zinc-800/60 shrink-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-grow">
                    <h4 className="text-lg sm:text-xl font-black text-white font-mono uppercase flex flex-wrap items-center gap-2 leading-tight">
                      {isDead && <Skull className="w-4 h-4 text-zinc-650 shrink-0 self-center" />}
                      <span>{player.name}</span>
                      <span className="text-xs font-bold text-red-400 font-sans tracking-wide">
                        — {player.role}
                      </span>
                      {readiness[player.name] && (
                        <span className="text-[9px] bg-emerald-950/50 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0 animate-pulse">
                          Valmis ✓
                        </span>
                      )}
                    </h4>
                  </div>

                  {/* Toggle View Secret Motivation */}
                  {!isDead && !isGmView && (
                    <button
                      type="button"
                      onClick={(e) => toggleRevealSecret(player.id, e)}
                      className={`p-1 px-2.5 rounded border text-[10px] font-mono transition flex items-center gap-1 shrink-0 cursor-pointer ${
                        isSecretRevealed 
                          ? "bg-amber-950/30 border-amber-500/30 text-amber-300 hover:border-amber-400" 
                          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700"
                      }`}
                      title={isSecretRevealed ? "Piilota salaisuus" : "Paljasta salaisuus"}
                    >
                      {isSecretRevealed ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-zinc-500" />}
                      <span>{isSecretRevealed ? "Motiivi piiloon" : "Motiivi 👁️"}</span>
                    </button>
                  )}
                </div>

                {/* Secret Motivation display */}
                {isDead ? (
                  <div className="text-[11px] text-zinc-500 italic bg-zinc-950/40 rounded p-1.5 border border-zinc-900/60">
                    Sankari on poistunut näyttämöltä.
                  </div>
                ) : isSecretRevealed ? (
                  <div className="text-[11.5px] text-white font-sans bg-zinc-950 border border-zinc-800 rounded p-2.5 leading-relaxed shadow-sm">
                    <strong className="text-[9px] font-mono uppercase text-zinc-400 block mb-1 tracking-wider font-extrabold">Henkilökohtainen Motiivisi:</strong>
                    {player.secret}
                  </div>
                ) : (
                  <div 
                    onClick={(e) => toggleRevealSecret(player.id, e)}
                    className="text-[10px] text-zinc-500 italic py-2 text-center font-mono rounded bg-zinc-950/40 select-none border border-zinc-900/40 cursor-pointer hover:bg-zinc-950/60 hover:text-zinc-400 transition"
                  >
                    Motiivi piilotettu – klikkaa nähdäksesi
                  </div>
                )}
              </div>

              {/* Task Section */}
              <div className="flex-grow flex flex-col justify-between pt-3 space-y-4">
                {isDead ? (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-3 text-xs italic font-mono space-y-1.5 text-zinc-650">
                    <Skull className="w-12 h-12 text-zinc-800" />
                    <div>
                      Hahmo eliminoitu pelistä.<br />
                      Toimi loppupelin pelkkänä aaveena tai neuvonantajana kuiskaten toisen pelaajan korvaan.
                    </div>
                  </div>
                ) : task ? (
                  <>
                    <div className="space-y-2">
                      {/* Action taxonomic badges with wrapping and scale support */}
                      <div className="flex flex-wrap gap-1.5 items-center justify-between w-full">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-mono uppercase font-black tracking-wider whitespace-nowrap shrink-0 ${getSocialBadgeColor(task.socialActionCategory)}`}>
                            {task.socialActionCategory}
                          </span>
                          <span className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-400 text-[9px] font-mono uppercase font-bold whitespace-nowrap shrink-0">
                            {getConcreteIndicator(task.concreteActionCategory)}
                          </span>
                        </div>

                        {/* Task specific privacy reveal button */}
                        {!isGmView && (
                          <button
                            type="button"
                            onClick={(e) => toggleRevealTask(player.id, e)}
                            className="text-[9px] font-mono uppercase border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-red-400 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer transition"
                          >
                            {isTaskRevealed ? <EyeOff className="w-3 h-3 text-red-400" /> : <Eye className="w-3 h-3 text-zinc-500" />}
                            <span>{isTaskRevealed ? "Piilota" : "Tehtävä"}</span>
                          </button>
                        )}
                      </div>

                      {task.targetCharacter && task.targetCharacter !== "Kaikki" && (
                        <div className="inline-flex px-2 py-0.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-100 text-[10px] font-mono uppercase font-bold items-center gap-1">
                          🎯 Kohde: {task.targetCharacter}
                        </div>
                      )}
                    </div>

                    {/* Instruction Prompt itself */}
                    {isTaskRevealed ? (
                      <div className={`space-y-3.5 py-3.5 bg-zinc-950 p-4 rounded-xl border border-zinc-800 leading-relaxed`}>
                        <div className="flex items-center justify-between pb-1.5 border-b border-zinc-900">
                          <strong className="text-[10px] font-mono uppercase text-zinc-400 font-bold tracking-widest block">TÄMÄN HETKEN ROOLIOHJEESI:</strong>
                          {privacyMode && (
                            <span className="text-[9px] bg-red-950/40 border border-red-900/40 text-red-400 px-1.5 py-0.5 rounded font-mono uppercase">Salattu muilta 🔒</span>
                          )}
                        </div>
                        
                        <div className="space-y-3.5">
                          {/* 1. Descriptive prefix (how and what) - clean, dark neutral with high contrast white text */}
                          {task.instructionPrefix && (
                            <div className="text-[13px] sm:text-sm text-white font-medium font-sans border-l-2 border-zinc-500 pl-4 py-1.5 leading-relaxed bg-zinc-900/10 rounded-r">
                              <strong className="text-[9px] font-mono uppercase text-zinc-400 tracking-wider block mb-0.5 animate-pulse">🎬 TOIMINTAYMPÄRISTÖ & OHJEISTUS:</strong>
                              {task.instructionPrefix}
                            </div>
                          )}

                          {/* 2. Structured actions or spoken dialogue lines - deep black panel with bright white text */}
                          {task.dialogueLines && task.dialogueLines.length > 0 && (
                            <div className="space-y-2.5 bg-zinc-950 p-3.5 rounded-lg border border-zinc-850">
                              <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold tracking-wider block mb-1.5">🗣️ PUHUTTAVAT REPLIIKIT TAI TEOT:</span>
                              {task.dialogueLines.map((bullet, idx) => (
                                <div key={idx} className="flex items-start gap-2.5 border-b border-zinc-900 pb-2 last:border-0 last:pb-0">
                                  <span className="text-zinc-500 text-[10px] mt-1.5 select-none font-bold">▶</span>
                                  <p className={`text-white font-sans font-bold leading-relaxed whitespace-pre-line ${
                                    activePlayersCount <= 2 
                                      ? "text-base sm:text-lg md:text-xl tracking-tight" 
                                      : "text-xs sm:text-sm md:text-base"
                                  }`}>
                                    {bullet}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 3. Ending/postfix emotional or gesture tails - clean mono/serif style on dark bg */}
                          {task.instructionPostfix && (
                            <div className="text-[13px] sm:text-sm text-zinc-300 font-sans italic pt-3 pb-2 border-t border-zinc-900 w-full leading-relaxed bg-zinc-950 p-3 rounded-lg border border-zinc-850">
                              <strong className="text-[9px] font-mono uppercase text-zinc-400 tracking-wider block mb-1 not-italic">
                                ✨ TUNNELMA & ELEEN LAATU:
                              </strong>
                              {task.instructionPostfix}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={(e) => toggleRevealTask(player.id, e)}
                        className="flex-grow flex flex-col items-center justify-center p-6 border border-zinc-800/80 rounded bg-zinc-950/80 cursor-pointer hover:bg-zinc-950/95 transition text-zinc-300 font-mono text-xs space-y-2 select-none"
                      >
                        <Shield className="w-6 h-6 text-zinc-650 animate-pulse" />
                        <span className="font-bold text-zinc-200 uppercase text-[10.5px]">Rooliprompti Piilotettu</span>
                        <span className="text-[10px] text-zinc-500">Klikkaa tästä nähdäksesi oman vuorosi ohjeet</span>
                      </div>
                    )}

                    {/* Background game purpose clue for the player */}
                    {isSecretRevealed && isTaskRevealed && (
                      <div className="text-[10px] text-zinc-500 italic pt-1.5 border-t border-zinc-850/60 flex items-center gap-1 shrink-0">
                        <span className="font-mono text-[8px] font-black text-zinc-600 uppercase shrink-0">GM-Intressi:</span>
                        <span className="line-clamp-1 text-[10px]" title={task.gamePurpose}>{task.gamePurpose}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-grow flex items-center justify-center text-zinc-500 font-mono text-xs italic text-center">
                    Tekoäly ei asettanut ohjetta tässä skenaariossa.
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
