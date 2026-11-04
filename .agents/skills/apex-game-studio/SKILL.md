---
name: apex-game-studio
description: Use for playable Apex Idle improvements involving race presentation, controls, progression, or game UX. Plan one playable slice, implement it in the web game, and verify it through the player's normal flow.
---

# Apex Game Studio

- Design: specify a player action, immediate feedback, and a visible acceptance check. Prefer one complete playable change per delivery.
- Engineering: read current GitHub files before editing because another collaborator ships to main. Keep simulation and save rules independent from Canvas presentation and UI.
- Art and UI: reuse geographic layouts, Canvas assets, and existing camera controls. Keep the racing surface clear and the interface usable with side panels open.
- Playtest: verify the normal browser flow, including both camera views and the existing save where applicable. Run focused regression checks. For production releases, verify the deployed commit and check the public site.
- Record what was tested and what still needs verification. Use the workflow with the available Codex tools.

Inspired by the vertical slice and playtest workflows in [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) and the in-editor verification approach of [UnrealClaude](https://github.com/Natfii/UnrealClaude).
