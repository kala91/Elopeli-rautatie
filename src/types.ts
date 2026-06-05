/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Player {
  id: string;
  name: string;
  role: string;         // e.g. "Hovimestari", "Laivainsinööri"
  secret: string;       // e.g. "Varasti timantin tunteja aiemmin", "Kantaa alien-alkiota"
  isDead?: boolean;     // Can be killed by other players in the dramatic arc
  deathScene?: number;  // The scene where they were reported dead/captured
}

export interface PlayerTask {
  characterName: string;
  socialActionCategory: string;   // e.g., "Kysyvä", "Toteava", "Selvittävä", "Tavoitteleva"
  concreteActionCategory: string; // e.g., "Monologi", "Matkiminen", "Dialogi", "Fyysinen ele", "Siirtyminen", "Esineen kanssa toimiminen"
  targetCharacter: string;        // Name of player target, or "Kaikki"
  instructionPrefix: string;      // 🎬 Exposition phase of instruction
  dialogueLines: string[];        // 🗣️ Specific speech prompts / lines as an array
  instructionPostfix: string;     // ✨ Emotion/gesture tail of instruction
  gamePurpose: string;            // Why they are doing this (for context)
}

export interface Scene {
  sceneNumber: number;
  sceneTitle: string;
  narrativeIntroduction: string;  // Simple narrative intro by Gemini
  dramaticArcPhase: string;       // e.g., "Esittely", "Konfliktin herääminen", "Käännekohta/Kliimaksi", "Kuulustelu", "Ratkaisu"
  playerTasks: PlayerTask[];
  humanGmNotesFeedback?: string;  // Notes provided by human GM after this scene
}

export interface GameConfig {
  theme: string;                // Premise: e.g. "Kartanon Murhamysteeri"
  initialIdea: string;          // Human GM's prompt / pitch for the game
  totalScenes: number;          // Typically 3 to 7 scenes (default 5), or -1 for infinite (päättymätön)
  players: Player[];
  generationMode?: "library" | "adaptive" | "full";
  overallOutline?: string;      // Rough roadmap/plot idea generated to keep sequential adaptive mode aligned
}

export interface PlayerScore {
  characterName: string;
  category: string;       // Custom generated award category based on theme (e.g. "Puheliain hahmo", "Eniten uhkaavia tilanteita")
  scoreValue: number;     // Funny numerical points value, e.g., 95 or 120
  reasoning: string;      // A short explanation of why they got this award in Finnish
}

export interface GameState {
  config: GameConfig;
  currentScene: Scene | null;
  history: Scene[];
  isStarted: boolean;
  isFinished: boolean;
  winnerOutcome?: string;       // Narrative explanation of how the story concluded
  scores?: PlayerScore[];       // Dynamic themed scores/awards for players
}
