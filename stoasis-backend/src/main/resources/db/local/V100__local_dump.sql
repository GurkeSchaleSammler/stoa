-- Lokaler reproduzierbarer DB-Dump. Passwort aller Testnutzer: test1234.
-- {noop} ist ausschliesslich für das local-Profil; neu registrierte Passwörter werden BCrypt-gehasht.
INSERT INTO users (id, email, name, avatar_url, plan, password_hash, created_at) VALUES
('user-du', 'du@stoa.test', 'Du', NULL, 'free', '{noop}test1234', TIMESTAMP WITH TIME ZONE '2026-01-15 09:00:00+00'),
('user-anna', 'anna@stoa.test', 'Anna Lehmann', NULL, 'free', '{noop}test1234', TIMESTAMP WITH TIME ZONE '2026-02-03 14:20:00+00'),
('user-marco', 'marco@stoa.test', 'Marco Keller', NULL, 'free', '{noop}test1234', TIMESTAMP WITH TIME ZONE '2026-03-11 11:45:00+00'),
('user-sara', 'sara@stoa.test', 'Sara Roth', NULL, 'free', '{noop}test1234', TIMESTAMP WITH TIME ZONE '2026-01-28 16:10:00+00');

INSERT INTO collections (id, name, emoji, owner_id, visibility, invite_token, created_at, updated_at) VALUES
('coll-japan', 'Japan-Trip 2027', ':️', 'user-du', 'link', 'invite-japan-a1b2', TIMESTAMP WITH TIME ZONE '2026-05-28 10:00:00+00', TIMESTAMP WITH TIME ZONE '2026-06-06 18:40:00+00'),
('coll-dev', 'Stoasis Dev-Ressourcen', '__', 'user-du', 'private', NULL, TIMESTAMP WITH TIME ZONE '2026-06-20 08:00:00+00', TIMESTAMP WITH TIME ZONE '2026-07-02 14:20:00+00'),
('coll-rezepte', 'Rezepte mit Sara', '<>', 'user-du', 'link', 'invite-rezepte-c3d4', TIMESTAMP WITH TIME ZONE '2026-07-08 17:00:00+00', TIMESTAMP WITH TIME ZONE '2026-07-10 19:00:00+00');

INSERT INTO collection_allowed_types (collection_id, pin_type) VALUES
('coll-japan', 'link'), ('coll-japan', 'note'), ('coll-japan', 'photo'),
('coll-dev', 'link'), ('coll-dev', 'note'),
('coll-rezepte', 'link'), ('coll-rezepte', 'note'), ('coll-rezepte', 'photo');

INSERT INTO collection_members (collection_id, user_id, role) VALUES
('coll-japan', 'user-du', 'owner'), ('coll-japan', 'user-anna', 'editor'), ('coll-japan', 'user-marco', 'viewer'),
('coll-dev', 'user-du', 'owner'),
('coll-rezepte', 'user-du', 'owner'), ('coll-rezepte', 'user-sara', 'editor');

INSERT INTO pins (id, collection_id, type, created_by, sort_order, created_at, url, title, description, site_name, reading_time_min, parse_status) VALUES
('pin-001', 'coll-japan', 'link', 'user-du', 1, TIMESTAMP WITH TIME ZONE '2026-06-01 10:00:00+00', 'https://fly.io/blog/sqlite-internals/', 'Tokyo → Kyoto Shinkansen guide', 'Everything about the bullet train pass, reservations and scenic route tips.', 'japan-guide.com', 6, 'ok'),
('pin-005', 'coll-japan', 'link', 'user-marco', 5, TIMESTAMP WITH TIME ZONE '2026-06-06 18:40:00+00', 'https://example.com/best-ramen-tokyo-2026', 'Best ramen in Tokyo 2026', 'Updated list from a local food blogger with neighborhood maps.', 'tokyoeats.blog', 9, 'ok'),
('pin-101', 'coll-dev', 'link', 'user-du', 1, TIMESTAMP WITH TIME ZONE '2026-07-01 09:00:00+00', 'https://angular.dev/guide/signals', 'Angular Signals guide', 'Official reactive primitives documentation.', 'angular.dev', 12, 'ok'),
('pin-201', 'coll-rezepte', 'link', 'user-sara', 1, TIMESTAMP WITH TIME ZONE '2026-07-10 19:00:00+00', 'https://example.com/carbonara-original', 'Original Carbonara ohne Sahne', 'Das römische Original mit Guanciale und Pecorino.', 'italiancooking.blog', 4, 'ok');

INSERT INTO pins (id, collection_id, type, created_by, sort_order, created_at, file_key, caption, image_width, image_height) VALUES
('pin-002', 'coll-japan', 'photo', 'user-anna', 2, TIMESTAMP WITH TIME ZONE '2026-06-02 08:30:00+00', 'seed/fuji.jpg', 'Fuji Aussichtspunkt – Chureito Pagoda, morgens um 6', 1920, 1080);

INSERT INTO pins (id, collection_id, type, created_by, sort_order, created_at, content, note_color) VALUES
('pin-003', 'coll-japan', 'note', 'user-du', 3, TIMESTAMP WITH TIME ZONE '2026-06-02 15:00:00+00', 'JR Pass bestellen (21 Tage vorher!)\nAdapter Typ A/B\nSuica-Karte am Flughafen\nPocket WiFi reservieren\nReisepass: läuft 03/2028 ✓', 'yellow'),
('pin-004', 'coll-japan', 'note', 'user-anna', 4, TIMESTAMP WITH TIME ZONE '2026-06-05 09:15:00+00', 'Flug: ~600 €\nHotels: ~1200 € (14 Nächte)\nJR Pass: ~280 €\nEssen/Tag: ~40 €\nGesamt: ~2640 €', 'blue'),
('pin-102', 'coll-dev', 'note', 'user-du', 2, TIMESTAMP WITH TIME ZONE '2026-07-02 14:20:00+00', 'Domain-Regel: feature/ hat inject(), ui/ hat null. Selector-Präfix feature- / ui- konsequent durchziehen.', 'yellow');

UPDATE pins
SET grid_x = MOD(sort_order - 1, 5) * 18,
    grid_y = FLOOR((sort_order - 1) / 5) * 22,
    height_clips = CASE type
        WHEN 'link' THEN 18
        WHEN 'photo' THEN 16
        ELSE 14
    END,
    layer = sort_order;

INSERT INTO pin_tags (pin_id, tag) VALUES
('pin-001', 'transport'), ('pin-002', 'sehenswuerdigkeit'), ('pin-004', 'budget'),
('pin-005', 'essen'), ('pin-101', 'angular'), ('pin-102', 'ddd'), ('pin-201', 'pasta');

INSERT INTO pin_comments (pin_id, author_id, body, created_at) VALUES
('pin-003', 'user-anna', 'Suica gibt es jetzt auch als App, brauchen wir die Karte noch?', TIMESTAMP WITH TIME ZONE '2026-06-03 12:00:00+00');

INSERT INTO tags (id, owner_id, name) VALUES
('tag-transport', 'user-du', 'transport'), ('tag-budget', 'user-du', 'budget'),
('tag-angular', 'user-du', 'angular'), ('tag-ddd', 'user-du', 'ddd'), ('tag-pasta', 'user-du', 'pasta');
