import { randomUUID } from "node:crypto";

// ─── Testnutzer ────────────────────────────────────────────────────
// Passwort für alle Testnutzer: "test1234"

export const users = [
  {
    _id: "user-du",
    email: "du@stoa.test",
    name: "Du",
    avatarUrl: null,
    plan: "premium",
    password: "test1234",
    createdAt: "2026-01-15T09:00:00.000Z",
  },
  {
    _id: "user-anna",
    email: "anna@stoa.test",
    name: "Anna Lehmann",
    avatarUrl: null,
    plan: "free",
    password: "test1234",
    createdAt: "2026-02-03T14:20:00.000Z",
  },
  {
    _id: "user-marco",
    email: "marco@stoa.test",
    name: "Marco Keller",
    avatarUrl: null,
    plan: "free",
    password: "test1234",
    createdAt: "2026-03-11T11:45:00.000Z",
  },
  {
    _id: "user-sara",
    email: "sara@stoa.test",
    name: "Sara Roth",
    avatarUrl: null,
    plan: "premium",
    password: "test1234",
    createdAt: "2026-01-28T16:10:00.000Z",
  },
];

// ─── Sammlungen (mit eingebetteten Members und Pins) ───────────────
// Struktur folgt dem Document-Model: pins[] und members[] leben
// direkt im Collection-Dokument, wie im MongoDB-Entwurf besprochen.

export const collections = [
  {
    _id: "coll-japan",
    name: "Japan-Trip 2027",
    emoji: "🗺️",
    ownerId: "user-du",
    allowedTypes: ["link", "note", "photo"],
    visibility: "link",
    inviteToken: "invite-japan-a1b2",
    members: [
      { userId: "user-du", role: "owner" },
      { userId: "user-anna", role: "editor" },
      { userId: "user-marco", role: "viewer" },
    ],
    pins: [
      {
        id: "pin-001",
        type: "link",
        createdBy: "user-du",
        sortOrder: 1,
        tags: ["transport"],
        data: {
          url: "https://fly.io/blog/sqlite-internals/",
          title: "Tokyo → Kyoto Shinkansen guide",
          description:
            "Everything about the bullet train pass, reservations and scenic route tips.",
          imageUrl: null,
          siteName: "japan-guide.com",
          readingTimeMin: 6,
          parseStatus: "ok",
        },
        comments: [],
        createdAt: "2026-06-01T10:00:00.000Z",
      },
      {
        id: "pin-002",
        type: "photo",
        createdBy: "user-anna",
        sortOrder: 2,
        tags: ["sehenswuerdigkeit"],
        data: {
          fileKey: "seed/fuji.jpg",
          caption: "Fuji Aussichtspunkt – Chureito Pagoda, morgens um 6",
          width: 1920,
          height: 1080,
        },
        comments: [],
        createdAt: "2026-06-02T08:30:00.000Z",
      },
      {
        id: "pin-003",
        type: "note",
        createdBy: "user-du",
        sortOrder: 3,
        tags: [],
        data: {
          content:
            "JR Pass bestellen (21 Tage vorher!)\nAdapter Typ A/B\nSuica-Karte am Flughafen\nPocket WiFi reservieren\nReisepass: läuft 03/2028 ✓",
          color: "yellow",
        },
        comments: [
          {
            authorId: "user-anna",
            body: "Suica gibt es jetzt auch als App, brauchen wir die Karte noch?",
            at: "2026-06-03T12:00:00.000Z",
          },
        ],
        createdAt: "2026-06-02T15:00:00.000Z",
      },
      {
        id: "pin-004",
        type: "note",
        createdBy: "user-anna",
        sortOrder: 4,
        tags: ["budget"],
        data: {
          content:
            "Flug: ~600 €\nHotels: ~1200 € (14 Nächte)\nJR Pass: ~280 €\nEssen/Tag: ~40 €\nGesamt: ~2640 €",
          color: "blue",
        },
        comments: [],
        createdAt: "2026-06-05T09:15:00.000Z",
      },
      {
        id: "pin-005",
        type: "link",
        createdBy: "user-marco",
        sortOrder: 5,
        tags: ["essen"],
        data: {
          url: "https://example.com/best-ramen-tokyo-2026",
          title: "Best ramen in Tokyo 2026",
          description:
            "Updated list from a local food blogger with neighborhood maps.",
          imageUrl: null,
          siteName: "tokyoeats.blog",
          readingTimeMin: 9,
          parseStatus: "ok",
        },
        comments: [],
        createdAt: "2026-06-06T18:40:00.000Z",
      },
    ],
    createdAt: "2026-05-28T10:00:00.000Z",
    updatedAt: "2026-06-06T18:40:00.000Z",
  },
  {
    _id: "coll-dev",
    name: "Stoa Dev-Ressourcen",
    emoji: "💻",
    ownerId: "user-du",
    allowedTypes: ["link", "note"],
    visibility: "private",
    inviteToken: null,
    members: [{ userId: "user-du", role: "owner" }],
    pins: [
      {
        id: "pin-101",
        type: "link",
        createdBy: "user-du",
        sortOrder: 1,
        tags: ["angular"],
        data: {
          url: "https://angular.dev/guide/signals",
          title: "Angular Signals guide",
          description: "Official reactive primitives documentation.",
          imageUrl: null,
          siteName: "angular.dev",
          readingTimeMin: 12,
          parseStatus: "ok",
        },
        comments: [],
        createdAt: "2026-07-01T09:00:00.000Z",
      },
      {
        id: "pin-102",
        type: "note",
        createdBy: "user-du",
        sortOrder: 2,
        tags: ["ddd"],
        data: {
          content:
            "Domain-Regel: feature/ hat inject(), ui/ hat null. Selector-Präfix feature- / ui- konsequent durchziehen.",
          color: "yellow",
        },
        comments: [],
        createdAt: "2026-07-02T14:20:00.000Z",
      },
    ],
    createdAt: "2026-06-20T08:00:00.000Z",
    updatedAt: "2026-07-02T14:20:00.000Z",
  },
  {
    _id: "coll-rezepte",
    name: "Rezepte mit Sara",
    emoji: "🍳",
    ownerId: "user-du",
    allowedTypes: ["link", "note", "photo"],
    visibility: "link",
    inviteToken: "invite-rezepte-c3d4",
    members: [
      { userId: "user-du", role: "owner" },
      { userId: "user-sara", role: "editor" },
    ],
    pins: [
      {
        id: "pin-201",
        type: "link",
        createdBy: "user-sara",
        sortOrder: 1,
        tags: ["pasta"],
        data: {
          url: "https://example.com/carbonara-original",
          title: "Original Carbonara ohne Sahne",
          description: "Das römische Original mit Guanciale und Pecorino.",
          imageUrl: null,
          siteName: "italiancooking.blog",
          readingTimeMin: 4,
          parseStatus: "ok",
        },
        comments: [],
        createdAt: "2026-07-10T19:00:00.000Z",
      },
    ],
    createdAt: "2026-07-08T17:00:00.000Z",
    updatedAt: "2026-07-10T19:00:00.000Z",
  },
];

// ─── In-Memory Session- und Token-Stores ──────────────────────────
// Werden vom Server zur Laufzeit befüllt (kein Testdaten-Seed nötig,
// aber hier zentral definiert, damit server.mjs sie importieren kann).

export const sessions = new Map(); // sessionId -> userId
export const magicLinkTokens = new Map(); // token -> { email, expiresAt, used }

export const tags = [
  { id: "tag-transport", ownerId: "user-du", name: "transport" },
  { id: "tag-budget", ownerId: "user-du", name: "budget" },
  { id: "tag-angular", ownerId: "user-du", name: "angular" },
  { id: "tag-ddd", ownerId: "user-du", name: "ddd" },
  { id: "tag-pasta", ownerId: "user-du", name: "pasta" },
];

export function createSessionId() {
  return randomUUID();
}

export function createToken() {
  return randomUUID().replace(/-/g, "").slice(0, 24);
}
