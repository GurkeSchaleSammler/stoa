import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { randomUUID } from "node:crypto";

import {
  users,
  collections,
  sessions,
  magicLinkTokens,
  tags,
  createSessionId,
  createToken,
} from "./seed-data.mjs";

// ─── Stoa Mock Backend ─────────────────────────────────────────────
// Dokumentbasierter In-Memory-Store (kein echtes DB, kein Restart-
// Persistenz). Deckt Auth, Collections, Pins und Membership ab,
// damit das Angular-Frontend gegen echte Endpunkte entwickelt
// werden kann, bevor das Kotlin-Backend existiert.
//
// WICHTIG: Kein echtes Sicherheitsmodell. Passwörter im Klartext,
// Sessions ohne Ablauf, kein CSRF-Schutz. NUR für lokale Entwicklung.

const app = express();
const PORT = process.env.PORT || 4000;
const COOKIE_NAME = "stoa_session";

app.use(
  cors({
    origin: ["http://localhost:4200", "http://127.0.0.1:4200"], // Angular Dev-Server
    credentials: true,
  }),
);
app.use(
  "/api/uploads",
  express.raw({ type: ["image/*", "application/octet-stream"], limit: "20mb" }),
);
app.use(
  "/api/profile/import/pocket",
  express.raw({
    type: ["text/csv", "application/octet-stream"],
    limit: "10mb",
  }),
);
app.use(express.json());
app.use(cookieParser());

const uploads = new Map();
const sseClients = new Set();

// Kleine künstliche Latenz, damit Loading-States im Frontend
// sichtbar werden statt sofort durchzuschlagen.
app.use((req, res, next) => {
  setTimeout(next, 150 + Math.random() * 250);
});

// ─── Helpers ────────────────────────────────────────────────────

function publicUser(user) {
  const { password, _id, deletionScheduledAt, ...rest } = user;
  return { id: _id, ...rest };
}

function findUserByEmail(email) {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

function getCurrentUser(req) {
  const sessionId = req.cookies[COOKIE_NAME];
  if (!sessionId) return null;
  const userId = sessions.get(sessionId);
  if (!userId) return null;
  return users.find((u) => u._id === userId) ?? null;
}

function requireAuth(req, res, next) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: "Nicht angemeldet." });
  }
  req.currentUser = user;
  next();
}

function setSessionCookie(res, userId) {
  const sessionId = createSessionId();
  sessions.set(sessionId, userId);
  res.cookie(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // in Produktion: true (HTTPS)
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 Tage
  });
}

function findCollection(id) {
  return collections.find((c) => c._id === id);
}

function membershipOf(collection, userId) {
  return collection.members.find((m) => m.userId === userId) ?? null;
}

function canView(collection, userId) {
  if (collection.visibility === "link") return true;
  return !!membershipOf(collection, userId);
}

function canEdit(collection, userId) {
  const membership = membershipOf(collection, userId);
  return membership?.role === "owner" || membership?.role === "editor";
}

function publicMember(member) {
  const user = users.find((item) => item._id === member.userId);
  return {
    ...member,
    name: user?.name ?? "Unbekannt",
    email: user?.email ?? "",
    avatarUrl: user?.avatarUrl ?? null,
  };
}

function publicComment(comment) {
  return {
    ...comment,
    authorName:
      comment.authorName ??
      users.find((user) => user._id === comment.authorId)?.name ??
      "Unbekannt",
  };
}

function publicPin(collection, pin) {
  const createdBy = users.find((user) => user._id === pin.createdBy);
  return {
    ...pin,
    collectionId: collection._id,
    createdByName: createdBy?.name ?? "Unbekannt",
    comments: (pin.comments ?? []).map(publicComment),
  };
}

function collectionSummary(collection) {
  return {
    id: collection._id,
    name: collection.name,
    emoji: collection.emoji,
    allowedTypes: collection.allowedTypes,
    visibility: collection.visibility,
    pinCount: collection.pins.length,
    members: collection.members.map((member) => {
      const { email, avatarUrl, ...summary } = publicMember(member);
      return summary;
    }),
    updatedAt: collection.updatedAt,
  };
}

function collectionDetail(collection, userId) {
  return {
    ...collectionSummary(collection),
    ownerId: collection.ownerId,
    inviteToken: collection.inviteToken,
    currentUserRole: membershipOf(collection, userId)?.role ?? null,
  };
}

function inviteInfo(collection, req) {
  const token = collection.inviteToken;
  return {
    collectionId: collection._id,
    token: token ?? "",
    url: token
      ? `${req.protocol}://${req.get("host").replace(":4000", ":4200")}/join/${token}`
      : "",
    visibility: collection.visibility,
    collectionName: collection.name,
  };
}

function broadcast(type, payload) {
  const event = `data: ${JSON.stringify({ type, payload, at: new Date().toISOString() })}\n\n`;
  sseClients.forEach((client) => client.write(event));
}

// ════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════

// POST /api/auth/login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};
  const user = findUserByEmail(email ?? "");

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "E-Mail oder Passwort falsch." });
  }

  setSessionCookie(res, user._id);
  res.json({
    user: publicUser(user),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  });
});

// POST /api/auth/register
app.post("/api/auth/register", (req, res) => {
  const { email, name, password } = req.body ?? {};

  if (!email || !name || !password) {
    return res.status(400).json({ message: "Alle Felder sind erforderlich." });
  }
  if (findUserByEmail(email)) {
    return res.status(409).json({ message: "E-Mail bereits registriert." });
  }

  const newUser = {
    _id: `user-${randomUUID().slice(0, 8)}`,
    email,
    name,
    avatarUrl: null,
    plan: "free",
    password,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);

  setSessionCookie(res, newUser._id);
  res.status(201).json({
    user: publicUser(newUser),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  });
});

// POST /api/auth/magic-link
app.post("/api/auth/magic-link", (req, res) => {
  const { email } = req.body ?? {};

  if (!email) {
    return res.status(400).json({ message: "E-Mail ist erforderlich." });
  }

  const token = createToken();
  magicLinkTokens.set(token, {
    email,
    expiresAt: Date.now() + 1000 * 60 * 15, // 15 Minuten
    used: false,
  });

  // In echt: E-Mail versenden. Hier: Link in der Konsole ausgeben,
  // damit man ihn zum Testen direkt kopieren kann.
  const link = `http://localhost:4200/auth/verify?token=${token}`;
  console.log(`\n📧  Magic Link für ${email}:\n    ${link}\n`);

  res.json({
    message: "Magic Link wurde versendet (siehe Server-Konsole).",
    expiresInSeconds: 900,
  });
});

// POST /api/auth/verify
app.post("/api/auth/verify", (req, res) => {
  const { token } = req.body ?? {};
  const entry = magicLinkTokens.get(token);

  if (!entry) {
    return res.status(400).json({ message: "Ungültiger Link." });
  }
  if (entry.used) {
    return res
      .status(400)
      .json({ message: "Dieser Link wurde bereits verwendet." });
  }
  if (Date.now() > entry.expiresAt) {
    return res.status(400).json({ message: "Dieser Link ist abgelaufen." });
  }

  let user = findUserByEmail(entry.email);
  if (!user) {
    // Erstanmeldung per Magic Link -> Konto automatisch anlegen
    user = {
      _id: `user-${randomUUID().slice(0, 8)}`,
      email: entry.email,
      name: entry.email.split("@")[0],
      avatarUrl: null,
      plan: "free",
      password: null,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
  }

  entry.used = true;
  setSessionCookie(res, user._id);
  res.json({
    user: publicUser(user),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  });
});

// GET /api/auth/me
app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json(publicUser(req.currentUser));
});

// POST /api/auth/logout
app.post("/api/auth/logout", (req, res) => {
  const sessionId = req.cookies[COOKIE_NAME];
  if (sessionId) sessions.delete(sessionId);
  res.clearCookie(COOKIE_NAME);
  res.status(204).send();
});

// ════════════════════════════════════════════════════════════════
// COLLECTIONS
// ════════════════════════════════════════════════════════════════

// GET /api/collections  (?filter=all|personal|shared)
app.get("/api/collections", requireAuth, (req, res) => {
  const { filter = "all" } = req.query;
  const userId = req.currentUser._id;

  let result = collections.filter((c) => membershipOf(c, userId));

  if (filter === "personal") {
    result = result.filter((c) => c.members.length === 1);
  } else if (filter === "shared") {
    result = result.filter((c) => c.members.length > 1);
  }

  res.json(result.map(collectionSummary));
});

// GET /api/collections/:id
app.get("/api/collections/:id", requireAuth, (req, res) => {
  const collection = findCollection(req.params.id);
  if (!collection) return res.status(404).json({ message: "Nicht gefunden." });
  if (!canView(collection, req.currentUser._id)) {
    return res.status(403).json({ message: "Kein Zugriff." });
  }

  res.json(collectionDetail(collection, req.currentUser._id));
});

// POST /api/collections
app.post("/api/collections", requireAuth, (req, res) => {
  const { name, emoji, allowedTypes } = req.body ?? {};

  if (!name) {
    return res.status(400).json({ message: "Name ist erforderlich." });
  }

  const newCollection = {
    _id: `coll-${randomUUID().slice(0, 8)}`,
    name,
    emoji: emoji || "📌",
    ownerId: req.currentUser._id,
    allowedTypes: allowedTypes?.length
      ? allowedTypes
      : ["link", "note", "photo"],
    visibility: "private",
    inviteToken: null,
    members: [{ userId: req.currentUser._id, role: "owner" }],
    pins: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  collections.push(newCollection);
  broadcast("collection.created", { collectionId: newCollection._id });
  res.status(201).json(collectionDetail(newCollection, req.currentUser._id));
});

// PATCH /api/collections/:id  (Settings: Name, erlaubte Typen, Sichtbarkeit)
app.patch("/api/collections/:id", requireAuth, (req, res) => {
  const collection = findCollection(req.params.id);
  if (!collection) return res.status(404).json({ message: "Nicht gefunden." });
  if (!canEdit(collection, req.currentUser._id)) {
    return res.status(403).json({ message: "Keine Berechtigung." });
  }

  const { name, emoji, allowedTypes, visibility } = req.body ?? {};
  if (name !== undefined) collection.name = name;
  if (emoji !== undefined) collection.emoji = emoji;
  if (allowedTypes !== undefined) collection.allowedTypes = allowedTypes;
  if (visibility !== undefined) {
    collection.visibility = visibility;
    if (visibility === "link" && !collection.inviteToken) {
      collection.inviteToken = `invite-${randomUUID().slice(0, 8)}`;
    }
    if (visibility === "private") {
      collection.inviteToken = null;
    }
  }
  collection.updatedAt = new Date().toISOString();

  broadcast("collection.updated", { collectionId: collection._id });
  res.json(collectionDetail(collection, req.currentUser._id));
});

// DELETE /api/collections/:id
app.delete("/api/collections/:id", requireAuth, (req, res) => {
  const collection = findCollection(req.params.id);
  if (!collection) return res.status(404).json({ message: "Nicht gefunden." });
  if (membershipOf(collection, req.currentUser._id)?.role !== "owner") {
    return res.status(403).json({ message: "Nur der Owner darf löschen." });
  }

  const idx = collections.findIndex((c) => c._id === req.params.id);
  collections.splice(idx, 1);
  broadcast("collection.deleted", { collectionId: req.params.id });
  res.status(204).send();
});

// POST /api/collections/join/:token
app.post("/api/collections/join/:token", requireAuth, (req, res) => {
  const collection = collections.find(
    (c) => c.visibility === "link" && c.inviteToken === req.params.token,
  );
  if (!collection) {
    return res
      .status(404)
      .json({ message: "Einladung ungültig oder abgelaufen." });
  }

  if (!membershipOf(collection, req.currentUser._id)) {
    collection.members.push({ userId: req.currentUser._id, role: "viewer" });
    collection.updatedAt = new Date().toISOString();
  }

  res.json({ collectionId: collection._id });
});

// GET /api/invites/:token – öffentliche Metadaten, Auth bleibt für den Beitritt nötig
app.get("/api/invites/:token", requireAuth, (req, res) => {
  const collection = collections.find(
    (item) =>
      item.visibility === "link" && item.inviteToken === req.params.token,
  );
  if (!collection)
    return res
      .status(404)
      .json({ message: "Einladung ungültig oder abgelaufen." });

  if (membershipOf(collection, req.currentUser._id)) {
    return res.json({ ...inviteInfo(collection, req), alreadyMember: true });
  }
  res.json(inviteInfo(collection, req));
});

// GET/PATCH /api/collections/:id/invite
app.get("/api/collections/:id/invite", requireAuth, (req, res) => {
  const collection = findCollection(req.params.id);
  if (!collection) return res.status(404).json({ message: "Nicht gefunden." });
  if (!membershipOf(collection, req.currentUser._id)) {
    return res.status(403).json({ message: "Kein Zugriff." });
  }
  res.json(inviteInfo(collection, req));
});

app.patch("/api/collections/:id/invite", requireAuth, (req, res) => {
  const collection = findCollection(req.params.id);
  if (!collection) return res.status(404).json({ message: "Nicht gefunden." });
  if (membershipOf(collection, req.currentUser._id)?.role !== "owner") {
    return res
      .status(403)
      .json({ message: "Nur der Owner darf Einladungen verwalten." });
  }
  const visibility = req.body?.visibility;
  if (!["private", "link"].includes(visibility)) {
    return res.status(400).json({ message: "Ungültige Sichtbarkeit." });
  }
  collection.visibility = visibility;
  collection.inviteToken =
    visibility === "link"
      ? (collection.inviteToken ?? `invite-${randomUUID().slice(0, 8)}`)
      : null;
  collection.updatedAt = new Date().toISOString();
  res.json(inviteInfo(collection, req));
});

// ════════════════════════════════════════════════════════════════
// MEMBERSHIP
// ════════════════════════════════════════════════════════════════

// GET /api/collections/:id/members
app.get("/api/collections/:id/members", requireAuth, (req, res) => {
  const collection = findCollection(req.params.id);
  if (!collection) return res.status(404).json({ message: "Nicht gefunden." });
  if (!membershipOf(collection, req.currentUser._id)) {
    return res.status(403).json({ message: "Kein Zugriff." });
  }

  res.json(collection.members.map(publicMember));
});

// PATCH /api/collections/:id/members/:userId  ({ role })
app.patch("/api/collections/:id/members/:userId", requireAuth, (req, res) => {
  const collection = findCollection(req.params.id);
  if (!collection) return res.status(404).json({ message: "Nicht gefunden." });
  if (membershipOf(collection, req.currentUser._id)?.role !== "owner") {
    return res
      .status(403)
      .json({ message: "Nur der Owner darf Rollen ändern." });
  }

  const membership = membershipOf(collection, req.params.userId);
  if (!membership)
    return res.status(404).json({ message: "Mitglied nicht gefunden." });

  const nextRole = req.body?.role;
  if (!["owner", "editor", "viewer"].includes(nextRole)) {
    return res.status(400).json({ message: "Ungültige Rolle." });
  }
  const ownerCount = collection.members.filter(
    (member) => member.role === "owner",
  ).length;
  if (membership.role === "owner" && nextRole !== "owner" && ownerCount <= 1) {
    return res
      .status(409)
      .json({ message: "Mindestens ein Owner muss bleiben." });
  }
  membership.role = nextRole;
  collection.updatedAt = new Date().toISOString();
  broadcast("membership.updated", {
    collectionId: collection._id,
    userId: membership.userId,
  });
  res.json(publicMember(membership));
});

// DELETE /api/collections/:id/members/:userId
app.delete("/api/collections/:id/members/:userId", requireAuth, (req, res) => {
  const collection = findCollection(req.params.id);
  if (!collection) return res.status(404).json({ message: "Nicht gefunden." });
  if (membershipOf(collection, req.currentUser._id)?.role !== "owner") {
    return res.status(403).json({ message: "Nur der Owner darf entfernen." });
  }

  const target = membershipOf(collection, req.params.userId);
  if (!target)
    return res.status(404).json({ message: "Mitglied nicht gefunden." });
  const ownerCount = collection.members.filter(
    (member) => member.role === "owner",
  ).length;
  if (target.role === "owner" && ownerCount <= 1) {
    return res
      .status(409)
      .json({ message: "Mindestens ein Owner muss bleiben." });
  }
  collection.members = collection.members.filter(
    (m) => m.userId !== req.params.userId,
  );
  collection.updatedAt = new Date().toISOString();
  broadcast("membership.removed", {
    collectionId: collection._id,
    userId: target.userId,
  });
  res.status(204).send();
});

// ════════════════════════════════════════════════════════════════
// PINS
// ════════════════════════════════════════════════════════════════

// GET /api/collections/:id/pins
app.get("/api/collections/:id/pins", requireAuth, (req, res) => {
  const collection = findCollection(req.params.id);
  if (!collection) return res.status(404).json({ message: "Nicht gefunden." });
  if (!canView(collection, req.currentUser._id)) {
    return res.status(403).json({ message: "Kein Zugriff." });
  }
  res.json(collection.pins.map((pin) => publicPin(collection, pin)));
});

// POST /api/collections/:id/pins
app.post("/api/collections/:id/pins", requireAuth, (req, res) => {
  const collection = findCollection(req.params.id);
  if (!collection) return res.status(404).json({ message: "Nicht gefunden." });
  if (!canEdit(collection, req.currentUser._id)) {
    return res.status(403).json({ message: "Keine Schreibrechte." });
  }

  const { type, data, tags } = req.body ?? {};
  if (!collection.allowedTypes.includes(type)) {
    return res
      .status(400)
      .json({ message: `Typ "${type}" ist in dieser Sammlung nicht erlaubt.` });
  }
  if (!data || typeof data !== "object") {
    return res.status(400).json({ message: "Pin-Inhalt fehlt." });
  }

  const newPin = {
    id: `pin-${randomUUID().slice(0, 8)}`,
    type,
    createdBy: req.currentUser._id,
    sortOrder: collection.pins.length + 1,
    tags: tags ?? [],
    data,
    comments: [],
    createdAt: new Date().toISOString(),
  };
  collection.pins.push(newPin);
  collection.updatedAt = new Date().toISOString();

  broadcast("pin.created", { collectionId: collection._id, pinId: newPin.id });
  res.status(201).json(publicPin(collection, newPin));
});

// PATCH /api/collections/:id/pins/:pinId
app.patch("/api/collections/:id/pins/:pinId", requireAuth, (req, res) => {
  const collection = findCollection(req.params.id);
  if (!collection) return res.status(404).json({ message: "Nicht gefunden." });
  if (!canEdit(collection, req.currentUser._id)) {
    return res.status(403).json({ message: "Keine Schreibrechte." });
  }

  const pin = collection.pins.find((p) => p.id === req.params.pinId);
  if (!pin) return res.status(404).json({ message: "Pin nicht gefunden." });

  const { data, tags, sortOrder } = req.body ?? {};
  if (data !== undefined) pin.data = { ...pin.data, ...data };
  if (tags !== undefined) pin.tags = tags;
  if (sortOrder !== undefined) pin.sortOrder = sortOrder;
  collection.updatedAt = new Date().toISOString();

  broadcast("pin.updated", { collectionId: collection._id, pinId: pin.id });
  res.json(publicPin(collection, pin));
});

// DELETE /api/collections/:id/pins/:pinId
app.delete("/api/collections/:id/pins/:pinId", requireAuth, (req, res) => {
  const collection = findCollection(req.params.id);
  if (!collection) return res.status(404).json({ message: "Nicht gefunden." });
  if (!canEdit(collection, req.currentUser._id)) {
    return res.status(403).json({ message: "Keine Schreibrechte." });
  }

  collection.pins = collection.pins.filter((p) => p.id !== req.params.pinId);
  collection.updatedAt = new Date().toISOString();
  broadcast("pin.deleted", {
    collectionId: collection._id,
    pinId: req.params.pinId,
  });
  res.status(204).send();
});

// POST /api/collections/:id/pins/:pinId/comments
app.post(
  "/api/collections/:id/pins/:pinId/comments",
  requireAuth,
  (req, res) => {
    const collection = findCollection(req.params.id);
    if (!collection)
      return res.status(404).json({ message: "Nicht gefunden." });
    if (!canView(collection, req.currentUser._id)) {
      return res.status(403).json({ message: "Kein Zugriff." });
    }

    const pin = collection.pins.find((p) => p.id === req.params.pinId);
    if (!pin) return res.status(404).json({ message: "Pin nicht gefunden." });

    const body = (req.body?.body ?? "").toString().trim();
    if (!body)
      return res
        .status(400)
        .json({ message: "Kommentar darf nicht leer sein." });
    const comment = {
      authorId: req.currentUser._id,
      authorName: req.currentUser.name,
      body,
      at: new Date().toISOString(),
    };
    pin.comments.push(comment);
    broadcast("comment.created", {
      collectionId: collection._id,
      pinId: pin.id,
    });
    res.status(201).json(publicComment(comment));
  },
);

// GET /api/links/preview?url=...
app.get("/api/links/preview", requireAuth, (req, res) => {
  const rawUrl = (req.query.url ?? "").toString();
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return res
      .status(400)
      .json({ message: "Bitte eine vollständige URL eingeben." });
  }

  const host = parsed.hostname.replace(/^www\./, "");
  if (host.includes("paywall") || host.includes("invalid")) {
    return res
      .status(422)
      .json({ message: "Metadaten konnten nicht gelesen werden." });
  }
  const pathTitle = decodeURIComponent(parsed.pathname)
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/[-_]+/g, " ");
  const title = pathTitle
    ? pathTitle.replace(/\b\w/g, (letter) => letter.toUpperCase())
    : `Inhalt von ${host}`;

  res.json({
    url: parsed.toString(),
    title,
    description: `Vorschau für ${host} – im Mock-Backend automatisch erzeugt.`,
    imageUrl: null,
    siteName: host,
    readingTimeMin: Math.max(2, Math.min(14, title.length % 12)),
    parseStatus: "ok",
  });
});

// POST /api/uploads + GET /api/uploads/:fileKey
app.post("/api/uploads", requireAuth, (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ message: "Keine Bilddatei empfangen." });
  }
  const contentType = req.get("content-type") || "application/octet-stream";
  if (!contentType.startsWith("image/")) {
    return res.status(415).json({ message: "Nur Bilddateien sind erlaubt." });
  }
  const fileKey = `upload-${randomUUID().slice(0, 12)}`;
  uploads.set(fileKey, { body: req.body, contentType });
  res.status(201).json({
    fileKey,
    imageUrl: `${req.protocol}://${req.get("host")}/api/uploads/${fileKey}`,
    width: 1600,
    height: 1000,
    originalName: req.get("x-file-name") || "Foto",
  });
});

app.get("/api/uploads/:fileKey", (req, res) => {
  const upload = uploads.get(req.params.fileKey);
  if (!upload) return res.status(404).send("Nicht gefunden");
  res.type(upload.contentType).send(upload.body);
});

// ════════════════════════════════════════════════════════════════
// SEARCH (einfache sammlungsübergreifende Volltextsuche)
// ════════════════════════════════════════════════════════════════

// GET /api/search?q=...
app.get("/api/search", requireAuth, (req, res) => {
  const q = (req.query.q ?? "").toString().toLowerCase();
  const type = (req.query.type ?? "").toString();
  const tag = (req.query.tag ?? "").toString().toLowerCase();
  if (!q) return res.json([]);

  const userId = req.currentUser._id;
  const results = [];

  for (const collection of collections) {
    if (!membershipOf(collection, userId)) continue;

    for (const pin of collection.pins) {
      if (type && pin.type !== type) continue;
      if (tag && !pin.tags.some((item) => item.toLowerCase() === tag)) continue;
      const haystack =
        `${JSON.stringify(pin.data)} ${pin.tags.join(" ")}`.toLowerCase();
      if (haystack.includes(q)) {
        results.push({
          ...publicPin(collection, pin),
          collectionName: collection.name,
        });
      }
    }
  }

  res.json(results);
});

// ════════════════════════════════════════════════════════════════
// TAGS
// ════════════════════════════════════════════════════════════════

app.get("/api/tags", requireAuth, (req, res) => {
  const visible = new Map();
  tags
    .filter((tag) => tag.ownerId === req.currentUser._id)
    .forEach((tag) => visible.set(tag.name, tag));
  collections
    .filter((collection) => membershipOf(collection, req.currentUser._id))
    .forEach((collection) => {
      collection.pins.forEach((pin) =>
        pin.tags.forEach((name) => {
          if (!visible.has(name))
            visible.set(name, {
              id: `tag-${name}`,
              ownerId: req.currentUser._id,
              name,
            });
        }),
      );
    });
  res.json(
    [...visible.values()]
      .map(({ ownerId, ...tag }) => tag)
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
});

app.post("/api/tags", requireAuth, (req, res) => {
  const name = (req.body?.name ?? "").toString().trim().toLowerCase();
  if (!name)
    return res.status(400).json({ message: "Tag-Name ist erforderlich." });
  const existing = tags.find(
    (tag) => tag.ownerId === req.currentUser._id && tag.name === name,
  );
  if (existing)
    return res.status(409).json({ message: "Diesen Tag gibt es bereits." });
  const tag = {
    id: `tag-${randomUUID().slice(0, 8)}`,
    ownerId: req.currentUser._id,
    name,
  };
  tags.push(tag);
  res.status(201).json({ id: tag.id, name: tag.name });
});

app.delete("/api/tags/:id", requireAuth, (req, res) => {
  const index = tags.findIndex(
    (tag) => tag.id === req.params.id && tag.ownerId === req.currentUser._id,
  );
  const derivedName = req.params.id.startsWith("tag-")
    ? req.params.id.slice(4)
    : null;
  const tagName = index >= 0 ? tags[index].name : derivedName;
  if (!tagName) return res.status(404).json({ message: "Tag nicht gefunden." });
  if (index >= 0) tags.splice(index, 1);
  collections
    .filter((collection) => membershipOf(collection, req.currentUser._id))
    .forEach((collection) => {
      collection.pins.forEach((pin) => {
        pin.tags = pin.tags.filter((tag) => tag !== tagName);
      });
    });
  res.status(204).send();
});

// ════════════════════════════════════════════════════════════════
// PROFILE, IMPORT/EXPORT & BILLING
// ════════════════════════════════════════════════════════════════

app.patch("/api/profile", requireAuth, (req, res) => {
  const { name, avatarUrl } = req.body ?? {};
  if (name !== undefined && name.toString().trim().length < 2) {
    return res
      .status(400)
      .json({ message: "Name muss mindestens 2 Zeichen lang sein." });
  }
  if (name !== undefined) req.currentUser.name = name.toString().trim();
  if (avatarUrl !== undefined) req.currentUser.avatarUrl = avatarUrl || null;
  res.json(publicUser(req.currentUser));
});

app.delete("/api/profile", requireAuth, (req, res) => {
  req.currentUser.deletionScheduledAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const sessionId = req.cookies[COOKIE_NAME];
  if (sessionId) sessions.delete(sessionId);
  res.clearCookie(COOKIE_NAME);
  res.status(204).send();
});

app.get("/api/profile/export", requireAuth, (req, res) => {
  const format = (req.query.format ?? "json").toString();
  const ownedCollections = collections
    .filter((collection) => membershipOf(collection, req.currentUser._id))
    .map((collection) => ({
      ...collectionDetail(collection, req.currentUser._id),
      pins: collection.pins.map((pin) => publicPin(collection, pin)),
    }));
  if (format === "csv") {
    const rows = [["collection", "type", "title_or_content", "url", "tags"]];
    ownedCollections.forEach((collection) =>
      collection.pins.forEach((pin) => {
        const title =
          pin.type === "link"
            ? pin.data.title
            : pin.type === "note"
              ? pin.data.content
              : (pin.data.caption ?? "");
        const url = pin.type === "link" ? pin.data.url : "";
        rows.push([collection.name, pin.type, title, url, pin.tags.join("|")]);
      }),
    );
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="stoa-export.csv"',
    );
    return res.type("text/csv").send(csv);
  }
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="stoa-export.json"',
  );
  res.json({
    exportedAt: new Date().toISOString(),
    user: publicUser(req.currentUser),
    collections: ownedCollections,
  });
});

app.post("/api/profile/import/pocket", requireAuth, (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ message: "Keine CSV-Datei empfangen." });
  }
  const lines = req.body.toString("utf8").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2)
    return res.json({
      imported: 0,
      skipped: 0,
      errors: ["Die CSV enthält keine Einträge."],
    });
  const target = collections.find(
    (collection) =>
      membershipOf(collection, req.currentUser._id)?.role === "owner",
  );
  if (!target)
    return res
      .status(409)
      .json({ message: "Lege zuerst eine eigene Sammlung an." });
  let imported = 0;
  let skipped = 0;
  lines.slice(1).forEach((line) => {
    const columns = line
      .split(",")
      .map((value) => value.replace(/^"|"$/g, "").trim());
    const url = columns.find((value) => /^https?:\/\//i.test(value));
    if (
      !url ||
      target.pins.some((pin) => pin.type === "link" && pin.data.url === url)
    ) {
      skipped += 1;
      return;
    }
    target.pins.push({
      id: `pin-${randomUUID().slice(0, 8)}`,
      type: "link",
      createdBy: req.currentUser._id,
      sortOrder: target.pins.length + 1,
      tags: ["pocket-import"],
      comments: [],
      createdAt: new Date().toISOString(),
      data: {
        url,
        title: columns[0] || url,
        description: null,
        imageUrl: null,
        siteName: new URL(url).hostname,
        readingTimeMin: null,
        parseStatus: "ok",
      },
    });
    imported += 1;
  });
  target.updatedAt = new Date().toISOString();
  res.json({ imported, skipped, errors: [] });
});

app.get("/api/billing/portal-url", requireAuth, (req, res) => {
  res.json({ url: `${req.protocol}://${req.get("host")}/mock-billing-portal` });
});

app.get("/mock-billing-portal", (_req, res) => {
  res
    .type("html")
    .send(
      '<!doctype html><html lang="de"><meta charset="utf-8"><title>Stoa Billing Mock</title><body style="font:16px system-ui;padding:48px;background:#f2f1eb;color:#20221e"><h1>Stoa Billing Portal</h1><p>Dies ist die lokale Mock-Seite für die Abo-Verwaltung.</p></body></html>',
    );
});

// GET /api/stream (SSE)
app.get("/api/stream", requireAuth, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  sseClients.add(res);
  res.write(
    `data: ${JSON.stringify({ type: "connected", at: new Date().toISOString() })}\n\n`,
  );
  req.on("close", () => sseClients.delete(res));
});

// ════════════════════════════════════════════════════════════════

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    users: users.length,
    collections: collections.length,
  });
});

app.listen(PORT, () => {
  console.log(`\n🏛️  Stoa Mock-Backend läuft auf http://localhost:${PORT}`);
  console.log(`\nTestnutzer (Passwort jeweils "test1234"):`);
  users.forEach((u) => console.log(`  ${u.email}  (${u.name})`));
  console.log(`\nBeispiel-Login:`);
  console.log(
    `  curl -c cookies.txt -X POST http://localhost:${PORT}/api/auth/login \\`,
  );
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"email":"du@stoa.test","password":"test1234"}'\n`);
});
