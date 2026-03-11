-- PMP OPS — Enable Realtime for operational tables
-- Run once in Supabase SQL Editor. Required for Realtime subscriptions (see docs/REALTIME.md).

ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.presses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.progress_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.qc_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes_channels;
