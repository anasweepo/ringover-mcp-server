import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_KEY = process.env.RINGOVER_API_KEY;
const BASE = "https://public-api.ringover.com/v2";

if (!API_KEY) {
  console.error("❌ RINGOVER_API_KEY manquante. Ajoutez-la dans la config Claude Desktop.");
  process.exit(1);
}

const headers = {
  "Authorization": API_KEY,
  "Accept": "application/json"
};

const server = new McpServer({ name: "ringover", version: "1.0.0" });

// ─── Helpers ────────────────────────────────────────────────────────────────

async function apiGet(path) {
  const res = await fetch(`${BASE}${path}`, { headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function ok(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function err(e) {
  return { content: [{ type: "text", text: `Erreur: ${e.message}` }] };
}

// All Ringover tools below are GET-only → read-only at the MCP protocol level.
const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true
};

// ─── Annuaire (lecture seule) ───────────────────────────────────────────────

server.registerTool(
  "get_users",
  {
    title: "Annuaire · Lister les utilisateurs",
    description: "Liste les utilisateurs de votre espace Ringover.",
    inputSchema: {
      limit: z.number().optional().describe("Nombre max (défaut 25)")
    },
    annotations: { ...READ_ONLY, title: "Annuaire · Lister les utilisateurs" }
  },
  async ({ limit = 25 }) => {
    try { return ok(await apiGet(`/users?limit_count=${limit}`)); }
    catch (e) { return err(e); }
  }
);

server.registerTool(
  "get_teams",
  {
    title: "Annuaire · Lister les équipes",
    description: "Liste les équipes de votre espace Ringover.",
    inputSchema: {},
    annotations: { ...READ_ONLY, title: "Annuaire · Lister les équipes" }
  },
  async () => {
    try { return ok(await apiGet("/teams")); }
    catch (e) { return err(e); }
  }
);

// ─── Messagerie (lecture seule) ─────────────────────────────────────────────

server.registerTool(
  "get_conversations",
  {
    title: "Messagerie · Lister les conversations",
    description: "Liste les conversations (SMS / chat) Ringover.",
    inputSchema: {
      limit: z.number().optional().describe("Nombre max (défaut 20)")
    },
    annotations: { ...READ_ONLY, title: "Messagerie · Lister les conversations" }
  },
  async ({ limit = 20 }) => {
    try { return ok(await apiGet(`/conversations?limit_count=${limit}`)); }
    catch (e) { return err(e); }
  }
);

// ─── Appels & Empower IA (lecture seule) ────────────────────────────────────

server.registerTool(
  "get_calls",
  {
    title: "Appels · Historique récent",
    description: "Récupère les appels récents, filtrable par plage de dates ISO.",
    inputSchema: {
      limit: z.number().optional().describe("Nombre d'appels (défaut 20)"),
      start_date: z.string().optional().describe("Date début ISO ex: 2024-01-01T00:00:00Z"),
      end_date: z.string().optional().describe("Date fin ISO ex: 2024-12-31T23:59:59Z")
    },
    annotations: { ...READ_ONLY, title: "Appels · Historique récent" }
  },
  async ({ limit = 20, start_date, end_date }) => {
    try {
      let url = `/calls?limit_count=${limit}`;
      if (start_date) url += `&start_date=${encodeURIComponent(start_date)}`;
      if (end_date) url += `&end_date=${encodeURIComponent(end_date)}`;
      return ok(await apiGet(url));
    } catch (e) { return err(e); }
  }
);

server.registerTool(
  "get_transcription",
  {
    title: "Appels · Transcription",
    description: "Récupère la transcription texte d'un appel via son UUID.",
    inputSchema: {
      calluuid: z.string().describe("UUID de l'appel")
    },
    annotations: { ...READ_ONLY, title: "Appels · Transcription" }
  },
  async ({ calluuid }) => {
    try { return ok(await apiGet(`/public/empower/call/${calluuid}`)); }
    catch (e) { return err(e); }
  }
);

server.registerTool(
  "get_summary",
  {
    title: "Appels · Résumé IA (Empower)",
    description: "Récupère le résumé IA d'un appel via son UUID.",
    inputSchema: {
      calluuid: z.string().describe("UUID de l'appel")
    },
    annotations: { ...READ_ONLY, title: "Appels · Résumé IA (Empower)" }
  },
  async ({ calluuid }) => {
    try { return ok(await apiGet(`/public/empower/call/${calluuid}/summary`)); }
    catch (e) { return err(e); }
  }
);

server.registerTool(
  "get_moments",
  {
    title: "Appels · Moments clés (Empower)",
    description: "Récupère les moments clés détectés par l'IA dans un appel.",
    inputSchema: {
      calluuid: z.string().describe("UUID de l'appel")
    },
    annotations: { ...READ_ONLY, title: "Appels · Moments clés (Empower)" }
  },
  async ({ calluuid }) => {
    try { return ok(await apiGet(`/public/empower/call/${calluuid}/moments`)); }
    catch (e) { return err(e); }
  }
);

// ─── Démarrage ───────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("✅ Ringover MCP Server démarré");
