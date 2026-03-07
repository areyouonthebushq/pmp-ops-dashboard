-- PMP OPS — Audit trail (append-only)
-- Run after schema.sql and rls-roles-migration.sql.
-- Database-trigger-based: every write is logged; cannot be skipped by the app.

-- ============================================================
-- 1. audit_log table (append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name text NOT NULL,
  entity_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  occurred_at timestamptz DEFAULT now() NOT NULL,
  changed_fields text[],
  old_values jsonb,
  new_values jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_entity ON public.audit_log(table_name, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_occurred_at ON public.audit_log(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by ON public.audit_log(changed_by);

COMMENT ON TABLE public.audit_log IS 'Append-only audit trail. Populated by triggers on jobs, presses, todos, progress_log, qc_log.';

-- ============================================================
-- 2. Generic trigger function (works for tables with "id" column)
-- ============================================================
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  old_j jsonb;
  new_j jsonb;
  changed_keys text[];
  old_vals jsonb := '{}';
  new_vals jsonb := '{}';
  k text;
  entity_id_val text;
BEGIN
  entity_id_val := (COALESCE(NEW, OLD)).id::text;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (table_name, entity_id, action, changed_by, old_values, new_values, changed_fields)
    VALUES (
      TG_TABLE_NAME,
      entity_id_val,
      'insert',
      auth.uid(),
      NULL,
      to_jsonb(NEW),
      NULL
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (table_name, entity_id, action, changed_by, old_values, new_values, changed_fields)
    VALUES (
      TG_TABLE_NAME,
      entity_id_val,
      'delete',
      auth.uid(),
      to_jsonb(OLD),
      NULL,
      NULL
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    old_j := to_jsonb(OLD);
    new_j := to_jsonb(NEW);
    SELECT array_agg(key) INTO changed_keys
    FROM jsonb_each(new_j) AS j(key)
    WHERE old_j->key IS DISTINCT FROM new_j->key;
    IF changed_keys IS NOT NULL THEN
      FOREACH k IN ARRAY changed_keys LOOP
        old_vals := old_vals || jsonb_build_object(k, old_j->k);
        new_vals := new_vals || jsonb_build_object(k, new_j->k);
      END LOOP;
      INSERT INTO public.audit_log (table_name, entity_id, action, changed_by, old_values, new_values, changed_fields)
      VALUES (
        TG_TABLE_NAME,
        entity_id_val,
        'update',
        auth.uid(),
        old_vals,
        new_vals,
        changed_keys
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- ============================================================
-- 3. Attach triggers
-- ============================================================
DROP TRIGGER IF EXISTS audit_jobs ON public.jobs;
CREATE TRIGGER audit_jobs
  AFTER INSERT OR UPDATE OR DELETE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_presses ON public.presses;
CREATE TRIGGER audit_presses
  AFTER INSERT OR UPDATE OR DELETE ON public.presses
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_todos ON public.todos;
CREATE TRIGGER audit_todos
  AFTER INSERT OR UPDATE OR DELETE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_progress_log ON public.progress_log;
CREATE TRIGGER audit_progress_log
  AFTER INSERT OR UPDATE OR DELETE ON public.progress_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_qc_log ON public.qc_log;
CREATE TRIGGER audit_qc_log
  AFTER INSERT OR UPDATE OR DELETE ON public.qc_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================================
-- 4. RLS: only authenticated can insert (via trigger); only admin can read
-- ============================================================
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_insert_authenticated"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "audit_log_select_admin"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (public.get_my_role() = 'admin');

-- No UPDATE or DELETE: append-only (no policy = no access).

-- ============================================================
-- 5. Allow admin to read all profiles (so audit view can show who did what)
-- ============================================================
CREATE POLICY "profiles_admin_select_all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 6. Admin view: audit log with actor display (for queries)
-- ============================================================
CREATE OR REPLACE VIEW public.audit_log_with_actor AS
SELECT
  a.id,
  a.table_name,
  a.entity_id,
  a.action,
  a.changed_by,
  p.email AS changed_by_email,
  p.display_name AS changed_by_display_name,
  a.occurred_at,
  a.changed_fields,
  a.old_values,
  a.new_values
FROM public.audit_log a
LEFT JOIN public.profiles p ON p.id = a.changed_by
ORDER BY a.occurred_at DESC;

COMMENT ON VIEW public.audit_log_with_actor IS 'Convenience view joining audit_log to profiles. Query as admin; RLS on audit_log and profiles applies.';
