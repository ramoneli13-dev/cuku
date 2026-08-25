create table if not exists public.cuku_transfer_payment_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  order_description text not null,
  customer_name text not null,
  customer_email text not null,
  product_amount_cents bigint not null check (product_amount_cents >= 100000),
  delivery_amount_cents bigint not null check (delivery_amount_cents >= 0),
  total_amount_cents bigint not null check (
    total_amount_cents = product_amount_cents + delivery_amount_cents
  ),
  currency text not null default 'COP' check (currency = 'COP'),
  status text not null default 'AWAITING_TRANSFER' check (
    status in (
      'AWAITING_TRANSFER', 'OCR_PROCESSING', 'AWAITING_BANK_CONFIRMATION',
      'MANUAL_REVIEW', 'DUPLICATE_PROOF', 'APPROVED', 'REJECTED'
    )
  ),
  qr_mode text not null check (qr_mode in ('dynamic', 'official-static')),
  provider_payment_id text unique,
  proof_sha256 text unique,
  proof_receipt_number text unique,
  proof_amount_cop numeric,
  proof_status text,
  proof_confidence numeric check (proof_confidence between 0 and 1),
  proof_analysis jsonb,
  bank_transaction_id text unique,
  operations_notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cuku_transfer_payment_orders enable row level security;

revoke all on table public.cuku_transfer_payment_orders from anon;
revoke all on table public.cuku_transfer_payment_orders from authenticated;

comment on table public.cuku_transfer_payment_orders is
  'Órdenes privadas de transferencia. La IA extrae datos, pero solo una confirmación bancaria firmada puede aprobar.';

comment on column public.cuku_transfer_payment_orders.proof_sha256 is
  'Huella irreversible del comprobante para impedir que una misma captura se reutilice.';
