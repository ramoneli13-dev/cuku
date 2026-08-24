create table if not exists public.trabajadores (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  nombre_completo text not null,
  telefono text not null,
  tipo_vehiculo text not null,
  correo text not null unique,
  cuenta_aprobada boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.trabajadores enable row level security;

revoke all on table public.trabajadores from anon;
revoke insert, update, delete on table public.trabajadores from authenticated;
grant select on table public.trabajadores to authenticated;

drop policy if exists "Cada trabajador consulta solo su perfil" on public.trabajadores;
create policy "Cada trabajador consulta solo su perfil"
on public.trabajadores
for select
to authenticated
using ((select auth.uid()) = auth_user_id);

create or replace function public.handle_new_trabajador()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.trabajadores (
    auth_user_id,
    nombre_completo,
    telefono,
    tipo_vehiculo,
    correo
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre_completo', ''),
    coalesce(new.raw_user_meta_data ->> 'telefono', ''),
    coalesce(new.raw_user_meta_data ->> 'tipo_vehiculo', ''),
    coalesce(new.email, '')
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_trabajador() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_trabajador();

comment on column public.trabajadores.cuenta_aprobada is
  'Solo el equipo administrador de Cúku debe activar esta bandera.';
