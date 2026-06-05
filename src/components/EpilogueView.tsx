import React from "react";
import { GameConfig, Scene, PlayerScore } from "../types";
import { Trophy, RefreshCw, Swords, Award, Download, Star } from "lucide-react";

interface EpilogueViewProps {
  config: GameConfig;
  history: Scene[];
  epilogueText: string;
  scores?: PlayerScore[];
  onResetGame: () => void;
  onDownloadBackup: () => void;
}

export function EpilogueView({
  config,
  history,
  epilogueText,
  scores = [],
  onResetGame,
  onDownloadBackup
}: EpilogueViewProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in p-2 md:p-6 pb-20 leading-relaxed">
      
      {/* Epic Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-950/40 border border-red-500/30 text-red-500 rounded-full mb-2">
          <Award className="w-10 h-10 animate-pulse text-amber-500" />
        </div>
        <h1 className="text-3xl md:text-5xl font-mono tracking-tight text-white font-extrabold uppercase pb-2 border-b border-zinc-800">
          TARINAN EPILOGI & RATKAISU
        </h1>
        <p className="text-red-400 font-mono text-xs uppercase font-bold tracking-widest">
          {config.theme} • {history.length} KOHTAUSTA RATKAISTU OPISTOSSA
        </p>
      </div>

      {/* Main epilogue story card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-amber-500/5 to-transparent rounded-full pointer-events-none"></div>

        <div className="space-y-4">
          <h3 className="text-sm font-mono tracking-wider font-extrabold text-amber-500 uppercase flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Miten tilanne lopulta ratkesi?
          </h3>
          <div className="text-gray-100 text-sm md:text-base font-sans leading-relaxed whitespace-pre-wrap tracking-wide border-l-2 border-amber-500 pl-4 py-2 bg-zinc-950/20 rounded-r">
            {epilogueText || "Pelivalvoja kirjoittaa dramatisoitua kokonaiskuvaa..." }
          </div>
        </div>
      </div>

      {/* Dynamic Theme Scores (Awards) Section */}
      {scores && scores.length > 0 && (
        <div className="bg-zinc-900 border border-amber-500/10 rounded-xl p-6 space-y-4 shadow-xl">
          <div className="border-b border-zinc-800 pb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 animate-spin-slow" />
            <div>
              <h3 className="text-sm font-mono font-black uppercase text-amber-400 tracking-wider">
                Skenaariokohtaiset Palkinnot & Pisteytykset
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono">
                Tarinan tapahtumiin, teemaan ja salaisuuksiin sovitetut huumoriarvosanat
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scores.map((score, index) => (
              <div 
                key={index}
                className="p-4 rounded-lg bg-zinc-950 border border-zinc-800/80 hover:border-amber-500/20 transition-all flex flex-col justify-between space-y-2 relative"
              >
                {/* Score badge in the top right corner */}
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-amber-950 border border-amber-500/30 text-amber-400 font-serif text-[11px] font-black">
                  {score.scoreValue} p.
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-amber-500 tracking-wider font-extrabold block max-w-[80%]">
                    🏆 {score.category}
                  </span>
                  <h4 className="text-sm font-sans font-bold text-white uppercase tracking-tight">
                    {score.characterName}
                  </h4>
                </div>

                <div className="text-xs text-zinc-400 font-sans italic leading-relaxed pt-2 border-t border-zinc-900">
                  "{score.reasoning}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Characters list & their ultimate status */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-4 shadow-xl">
        <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-400 border-b border-zinc-800 pb-2 flex items-center gap-1.5">
          <Swords className="w-4 h-4 text-zinc-500" />
          Hahmojen alkuperäiset taka-ajatukset
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {config.players.map((p) => (
            <div key={p.id} className="p-4 bg-zinc-950/50 border border-zinc-850 rounded-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-900 mb-2">
                  <span className="text-xs font-mono font-extrabold text-white tracking-wide">{p.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold border ${
                    p.isDead 
                      ? "border-red-500/20 text-red-500 bg-red-950/20" 
                      : "border-zinc-800 text-zinc-400 bg-zinc-900"
                  }`}>
                    {p.isDead ? `Poistui näyttämöltä` : "Pääsi loppuun"}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 font-sans block">
                  Alkuperäinen rooli: <span className="text-gray-300 font-medium">{p.role}</span>
                </p>
              </div>

              <div className="mt-2 text-[11px] text-amber-300/80 font-sans leading-relaxed pt-1.5 border-t border-zinc-900">
                <span className="text-[9px] font-mono text-amber-600 uppercase font-bold block mb-0.5">Taka-ajatus / Salaisuus:</span>
                "{p.secret}"
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls: Save/JSON download and Restart */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-zinc-850">
        
        {/* Backup download action */}
        <button
          onClick={onDownloadBackup}
          className="w-full sm:w-auto py-3 px-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono uppercase font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition duration-300 shadow"
          title="Lataa koko pelidata tietokoneellesi JSON-varmuuskopiona tulevaisuutta varten"
        >
          <Download className="w-4 h-4 text-zinc-400" />
          Lataa peli JSON-muodossa
        </button>

        {/* Play again */}
        <button
          onClick={onResetGame}
          className="w-full sm:w-auto py-3 px-8 rounded-lg bg-red-650 hover:bg-red-500 border border-red-500/10 text-white font-mono uppercase font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition duration-300 shadow-xl shadow-red-950/30"
        >
          <RefreshCw className="w-4 h-4 text-white animate-spin-slow" />
          Aloita uusi peli!
        </button>
      </div>

    </div>
  );
}
