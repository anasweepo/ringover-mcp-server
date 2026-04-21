# ringover-mcp-server

Serveur MCP pour l’intégration avec l’API Ringover, permettant d’accéder et d’exploiter différentes ressources via des endpoints structurés. Conçu pour faciliter l’interconnexion avec des outils et services tiers, il offre une base fiable pour la consultation et la manipulation des données Ringover dans divers contextes d’usage.


Bundle **MCPB** (Claude Desktop Extension) pour l'API Ringover. Une fois installé, Claude peut interroger vos utilisateurs, équipes, conversations, appels, transcriptions, résumés IA et moments clés Ringover via le protocole MCP.

Le token API Ringover est saisi **une seule fois** dans l'UI de Claude Desktop au moment de l'installation (champ sensible, stocké localement).

## Installation (utilisateur final)

1. Télécharger `ringover-mcp.mcpb` depuis la page Releases.
2. Double-cliquer le fichier, ou dans Claude Desktop : **Settings → Extensions → Install from file…**
3. Coller votre **Ringover API Key** dans le champ demandé (Dashboard Ringover → Développeurs → API).
4. Cliquer **Install**. L'extension apparaît activée, les outils sont immédiatement disponibles.

Aucune installation Node, `npx`, ni configuration manuelle de `claude_desktop_config.json` n'est requise.

## Outils exposés

| Outil | Description |
| --- | --- |
| `get_users` | Liste les utilisateurs Ringover |
| `get_teams` | Liste les équipes |
| `get_conversations` | Liste les conversations |
| `get_calls` | Appels récents (filtrable par plage de dates) |
| `get_transcription` | Transcription d'un appel (par UUID) |
| `get_summary` | Résumé IA d'un appel |
| `get_moments` | Moments clés d'un appel |

## Build du `.mcpb` (mainteneurs)

Prérequis : Node.js ≥ 18.

```bash
# 1. Installer les dépendances dans server/ (elles DOIVENT être bundlées)
cd server
npm install --omit=dev
cd ..

# 2. Packager l'extension
npx @anthropic-ai/mcpb pack
```

Le fichier `ringover-mcp.mcpb` est généré à la racine. C'est un simple zip contenant :

```
ringover-mcp.mcpb
├── manifest.json
├── README.md
└── server/
    ├── index.js
    ├── package.json
    └── node_modules/        (dépendances bundlées)
```

## Structure du bundle

- `manifest.json` — métadonnées MCPB + `user_config.ringover_api_key` (sensitive) injecté en tant que variable d'environnement `RINGOVER_API_KEY`.
- `server/index.js` — serveur MCP Node sur transport `stdio`.
- `server/node_modules/` — `@modelcontextprotocol/sdk` et `zod` bundlés.

## Sécurité

- Le token Ringover ne transite **jamais** via le protocole MCP : il est passé au processus serveur en variable d'environnement locale, au démarrage.
- Le champ est marqué `sensitive: true` dans le manifest → masqué dans l'UI et stocké dans le trousseau OS (Keychain / Credential Manager / libsecret).

## Tester en local avant packaging

```bash
cd server
RINGOVER_API_KEY=xxxxx node index.js
```

Le processus doit afficher `✅ Ringover MCP Server démarré` sur stderr.

## Licence

MIT
