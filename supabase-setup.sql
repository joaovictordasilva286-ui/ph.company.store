-- PH Company: catálogo editável e painel protegido.
-- Execute no SQL Editor do Supabase antes de colocar os dados no site.

create table if not exists public.ph_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.ph_products (
  id text primary key,
  name text not null,
  category text not null check (category in ('camisetas','conjuntos','calcoes')),
  price numeric(10,2) not null check (price >= 0),
  old_price numeric(10,2) check (old_price is null or old_price >= 0),
  image_urls text[] not null default '{}',
  sizes text not null default 'Consulte tamanhos',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ph_admins enable row level security;
alter table public.ph_products enable row level security;

create or replace function public.is_ph_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.ph_admins where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_ph_admin() from public;
grant execute on function public.is_ph_admin() to authenticated;

grant select on public.ph_admins to authenticated;
grant select on public.ph_products to anon, authenticated;
grant insert, update, delete on public.ph_products to authenticated;

drop policy if exists "PH admin can check own access" on public.ph_admins;
create policy "PH admin can check own access" on public.ph_admins
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Anyone can read active PH products" on public.ph_products;
create policy "Anyone can read active PH products" on public.ph_products
  for select to anon, authenticated using (active = true);

drop policy if exists "PH admins can read every product" on public.ph_products;
create policy "PH admins can read every product" on public.ph_products
  for select to authenticated using ((select public.is_ph_admin()));

drop policy if exists "PH admins can add products" on public.ph_products;
create policy "PH admins can add products" on public.ph_products
  for insert to authenticated with check ((select public.is_ph_admin()));

drop policy if exists "PH admins can edit products" on public.ph_products;
create policy "PH admins can edit products" on public.ph_products
  for update to authenticated using ((select public.is_ph_admin()))
  with check ((select public.is_ph_admin()));

drop policy if exists "PH admins can delete products" on public.ph_products;
create policy "PH admins can delete products" on public.ph_products
  for delete to authenticated using ((select public.is_ph_admin()));

insert into public.ph_products (id,name,category,price,old_price,image_urls,sizes,active,sort_order)
values
  ('conjunto-esportivo','Calção esportivo','calcoes',129.90,null,array['public/products/conjunto-esportivo.jpg'],'Tamanhos a confirmar',true,1),
  ('camiseta-estampada','Camiseta estampada','camisetas',99.90,null,array['public/products/camiseta-estampada.jpg'],'Tamanhos a confirmar',true,2),
  ('camiseta-nike','Camiseta Nike','camisetas',99.90,null,array['public/products/nike-01.jpg'],'Tamanhos a confirmar',true,3),
  ('conjunto-nike','Conjunto Nike','conjuntos',149.90,null,array['public/products/nike-02.jpg'],'Tamanhos a confirmar',true,4),
  ('conjunto-jordan-branco','Conjunto Jordan branco','conjuntos',200.00,230.00,array['public/products/jordan-branco-01.jpg','public/products/jordan-branco-02.jpg'],'Tamanhos a confirmar',true,5),
  ('conjunto-jordan-preto','Conjunto Jordan preto','conjuntos',200.00,240.00,array['public/products/jordan-preto-01.jpg','public/products/jordan-preto-02.jpg'],'Tamanhos a confirmar',true,6)
on conflict (id) do nothing;

-- Fotos enviadas pelo painel ficam em um bucket público para o catálogo exibi-las.
-- O acesso de leitura é público; envio, alteração e exclusão são só para administradores.
insert into storage.buckets (id,name,public)
values ('product-images','product-images',true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can view PH product images" on storage.objects;
create policy "Anyone can view PH product images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'product-images');

drop policy if exists "PH admins can upload product images" on storage.objects;
create policy "PH admins can upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and (select public.is_ph_admin()));

drop policy if exists "PH admins can update product images" on storage.objects;
create policy "PH admins can update product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and (select public.is_ph_admin()))
  with check (bucket_id = 'product-images' and (select public.is_ph_admin()));

drop policy if exists "PH admins can delete product images" on storage.objects;
create policy "PH admins can delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and (select public.is_ph_admin()));
