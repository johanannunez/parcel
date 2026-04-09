-- Allow owners to cancel their own pending block requests
-- The existing RLS policies only granted SELECT + INSERT to owners and
-- SELECT + UPDATE to admins. Without this policy the Supabase client
-- silently returned zero affected rows, making the cancel button appear broken.

create policy "Owners cancel own pending block requests"
  on public.block_requests
  for update
  using (owner_id = auth.uid() and status = 'pending')
  with check (status = 'cancelled');
