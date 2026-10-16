\set ON_ERROR_STOP on

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM users u
        WHERE NOT EXISTS (
            SELECT 1 FROM collections c
            WHERE c.owner_id = u.id AND c.board_kind = 'WORK'
        ) OR NOT EXISTS (
            SELECT 1 FROM collections c
            WHERE c.owner_id = u.id AND c.board_kind = 'PERSONAL'
        )
    ) THEN
        RAISE EXCEPTION 'At least one user is missing a profile board';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM collections
        WHERE board_kind IS NOT NULL
        GROUP BY owner_id, board_kind
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate profile boards found';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_pins_type'
    ) THEN
        RAISE EXCEPTION 'Pin type constraint is missing';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'board_connectors' AND column_name = 'label'
    ) OR to_regclass('public.board_pin_dates') IS NULL
      OR to_regclass('public.board_presentation_paths') IS NULL
      OR to_regclass('public.board_presentation_steps') IS NULL THEN
        RAISE EXCEPTION 'Board experience schema V20 is missing';
    END IF;
END $$;

