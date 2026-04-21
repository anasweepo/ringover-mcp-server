# Ringover MCP

Bundle **MCPB** (Claude Desktop Extension) pour l'API Ringover. Serveur MCP **pur Node stdio, headless** — aucune UI React, aucun serveur HTTP côté client.

Une fois installé, Claude peut interroger vos utilisateurs, équipes, conversations, appels, transcriptions, résumés IA et moments clés Ringover via le Model Context Protocol.

Le token API Ringover est saisi **une seule fois** dans l'UI de Claude Desktop au moment de l'installation (champ masqué, stocké localement dans le trousseau OS).

---

## Installation (utilisateur final)

1. Aller sur la page [Releases](https://github.com/anasweepo/ringover-mcp-server/releases) du repo.
2. Télécharger le fichier `ringover-mcp-vX.Y.Z.mcpb` attaché à la dernière release.
3. Double-cliquer le fichier, ou dans Claude Desktop : **Settings → Extensions → Install from file…**
4. Coller votre **Ringover API Key** dans le champ demandé (Dashboard Ringover → Développeurs → API).
5. Cliquer **Install**.

Aucune installation de Node, `npx`, ni édition manuelle de `claude_desktop_config.json` n'est requise.

> ⚠️ Ne téléchargez pas le `.mcpb` depuis le code source (`Code` → `Download ZIP`) : il n'y est pas. Le `.mcpb` est **uniquement** un asset de Release, généré par la CI sur chaque tag `v*`.

---

## Outils exposés (tous en lecture seule)

| Titre affiché dans Claude             | Description                                              |
| ------------------------------------- | -------------------------------------------------------- |
| **Annuaire** · Lister les utilisateurs | Utilisateurs de l'espace Ringover                        |
| **Annuaire** · Lister les équipes     | Équipes de l'espace Ringover                             |
| **Messagerie** · Lister les conversations | Conversations SMS / chat                              |
| **Appels** · Historique récent        | Appels récents, filtrable par plage ISO                  |
| **Appels** · Transcription            | Transcription texte d'un appel (Empower)                 |
| **Appels** · Résumé IA (Empower)      | Résumé IA d'un appel                                     |
| **Appels** · Moments clés (Empower)   | Moments clés détectés par l'IA                           |

Tous les outils sont annotés `readOnlyHint: true` au niveau protocole MCP — Claude sait qu'aucun ne modifie l'état Ringover.

---

## Architecture

```
ringover-mcp/
├── .github/workflows/release.yml   ← CI : build + publish .mcpb sur chaque tag v*
├── manifest.json                   ← metadata MCPB + user_config (token)
├── README.md
├── .gitignore                      ← *.mcpb, node_modules/, .env
├── .mcpbignore                     ← exclut les fichiers inutiles du bundle
└── server/
    ├── index.js                    ← serveur MCP Node stdio pur
    ├── package.json
    ├── package-lock.json
    └── node_modules/               ← dépendances bundlées dans le .mcpb
```

Le serveur est **pur stdio** : aucun port ouvert, aucun HTTP, aucune UI. Claude Desktop lance `node server/index.js` en sous-processus et dialogue via stdin/stdout (JSON-RPC).

---

## Publier une nouvelle version (mainteneur)

La CI construit et publie le `.mcpb` automatiquement sur chaque tag `v*`.

```bash
# 1. Bump la version dans manifest.json (doit correspondre exactement au tag)
#    ex: "version": "1.0.1"

git add manifest.json
git commit -m "chore: bump version to 1.0.1"

# 2. Créer et pousser le tag
git tag v1.0.1
git push origin main --tags
```

Le workflow `.github/workflows/release.yml` va alors :

1. `checkout` + `setup-node@20`
2. `npm ci --omit=dev` dans `server/` → installe **uniquement** les deps runtime
3. Vérifier que `manifest.json.version === tag` (sinon échec)
4. Valider le manifest (`mcpb validate`)
5. Smoke-test du serveur (démarrage Node + arrêt)
6. `mcpb pack` → `ringover-mcp-v1.0.1.mcpb`
7. Calculer le SHA-256
8. Créer la GitHub Release et y attacher le `.mcpb`

Aucun secret npm/registry n'est requis — tout se fait avec le `GITHUB_TOKEN` par défaut.

---

## Build local (optionnel, pour tester avant tag)

```bash
cd server
npm ci --omit=dev
cd ..
npx @anthropic-ai/mcpb validate manifest.json
npx @anthropic-ai/mcpb pack . ringover-mcp-local.mcpb
```

---

## Développement

```bash
cd server
npm install
RINGOVER_API_KEY=xxxxx node index.js
# → ✅ Ringover MCP Server démarré (sur stderr)
```

Le process reste ouvert en attente d'un client MCP sur stdio.

---

## Sécurité

- Le token Ringover ne transite **jamais** via le protocole MCP : il est injecté dans le process serveur comme variable d'environnement locale.
- Le champ est marqué `sensitive: true` → masqué dans l'UI et stocké dans le trousseau OS (Keychain / Credential Manager / libsecret).
- Tous les outils sont en **lecture seule** (GET uniquement sur l'API publique Ringover).

## Licence

MIT
