# Meta Context

## Purpose

This repository preserves the pregenerated / esikäsikirjoitettu version of the Elopeli Rautatie line.

The prototype is a railroaded hidden-role / social deduction LARP format where the AI generates a full scenario before play. During the game, players receive dramaturgical scene material and concrete social action prompts, but the underlying sequence is already generated.

## What It Proved

- Bulk generation can improve coherence compared with generating each player prompt one at a time during play.
- A full scenario generated in one pass helps the model preserve character relationships, scene arc, and dramaturgical escalation.
- The Rautatie / Railroad frame can produce playable embodied prompts instead of falling back into choose-your-own-story menus.
- A structured JSON-like scenario format, player prompt terminology, and taxonomy thinking can work together as a control surface for LLM-generated social play.

## Main Limitation

This branch improves coherence by fixing the generated dramatic sequence before play. That also means the game is less reactive: player choices and unexpected physical/social actions do not yet reshape the scenario during play.

## Main Finding

The major discovery is that pregeneration is not just a performance optimization. It changes the quality of the output. When the model sees the whole arc at once, it can generate more realistic, bounded, and internally coherent social material.

## Lineage

- Branch: core Elopeli Rautatie line.
- Earlier branch: `Elopeli Rautatie: Local`, which tested one-screen railroad generation with local Ollama.
- Related next branches:
  - `Elopeli Rautatie: Online Generation` for hosted/live generation comparison.
  - `Elopeli Threads` / `Elopeli: Säikeet` for private phone prompts and multi-character story threads.
- Conceptual predecessor: choose-your-own-story baseline tests, which showed what Elopeli should avoid.

## Current Status

- Source imported from a Google AI Studio export on 2026-06-05.
- This is likely the closest preserved branch to the latest demo that could be shown to real players.
- Repository is preserved as a historical/prototype artifact and candidate for future playable polish.
