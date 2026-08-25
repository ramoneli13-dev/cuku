alter table public.cuku_payment_orders
  add column if not exists processing_fee_cents bigint not null default 0
  check (processing_fee_cents >= 0);

alter table public.cuku_payment_orders
  drop constraint if exists cuku_payment_orders_total_amount_cents_check;

alter table public.cuku_payment_orders
  add constraint cuku_payment_orders_total_amount_cents_check check (
    total_amount_cents = product_amount_cents + delivery_amount_cents + processing_fee_cents
  );

comment on column public.cuku_payment_orders.processing_fee_cents is
  'Tarifa de procesamiento mostrada al cliente antes de abrir el Checkout.';
