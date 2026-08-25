create table if not exists public.cuku_payment_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  order_description text not null,
  customer_name text not null,
  customer_email text not null,
  customer_document text not null,
  product_amount_cents bigint not null check (product_amount_cents >= 100000),
  delivery_amount_cents bigint not null check (delivery_amount_cents >= 0),
  processing_fee_cents bigint not null default 0 check (processing_fee_cents >= 0),
  total_amount_cents bigint not null check (
    total_amount_cents = product_amount_cents + delivery_amount_cents + processing_fee_cents
  ),
  currency text not null default 'COP' check (currency = 'COP'),
  status text not null default 'PENDING' check (
    status in ('PENDING', 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR')
  ),
  wompi_transaction_id text unique,
  payment_method_type text,
  operations_notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cuku_payment_orders enable row level security;

revoke all on table public.cuku_payment_orders from anon;
revoke all on table public.cuku_payment_orders from authenticated;

comment on table public.cuku_payment_orders is
  'Conciliación privada de cobros de Cúku. Solo el servidor con service_role puede acceder.';

comment on column public.cuku_payment_orders.customer_document is
  'Dato privado de conciliación; nunca se expone mediante las políticas públicas de Supabase.';
