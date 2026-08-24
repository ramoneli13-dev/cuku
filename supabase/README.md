# Activación de Supabase para Cúku

1. Crea o abre un proyecto en Supabase.
2. En **SQL Editor**, ejecuta `migrations/20260824_create_trabajadores.sql`.
3. En **Authentication > Providers > Email**, deja habilitado Email.
4. Copia **Project URL** y la clave **Publishable** desde **Project Settings > API**.
5. Añade `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` en los entornos Production,
   Preview y Development del proyecto `cuku` en Vercel.
6. Para aprobar una cuenta, abre **Table Editor > trabajadores** y cambia
   `cuenta_aprobada` de `false` a `true` para el trabajador validado.

Las contraseñas pertenecen a Supabase Auth. La tabla pública solo conserva el
perfil del trabajador y nunca contiene contraseñas ni hashes.
