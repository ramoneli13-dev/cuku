# Cúku

**Cúku** es un MVP independiente para solicitar compras y diligencias en cualquier comercio legal de Cúcuta y municipios cercanos, incluso si el establecimiento no está registrado en la plataforma.

La marca visible se escribe **Cúku**. En dominios, repositorios y nombres técnicos se usa `cuku`, sin tilde.

## Alcance implementado

- Tipos de servicio: comida, mercado, farmacia, Compra por mí, paquete, diligencia, recogida y entrega, y otro.
- Solicitud libre con comercio opcional, ubicación, producto, talla, color, marca, cantidad, presupuesto, instrucciones y hasta tres fotografías.
- Opción **No sé dónde comprarlo** para permitir búsqueda en varios comercios.
- Un mismo rol operativo funciona como repartidor y comprador personal.
- Flujo básico completo: crear → aceptar → enviar opciones → aprobar → comprar con recibo → recoger → entregar → confirmar.
- Aprobación expresa para cualquier opción que supere el presupuesto.
- Bloqueo del precio final si supera la opción aprobada.
- Chat contextual dentro de cada solicitud.
- Desglose separado de producto, comprador, entrega, plataforma, propina y total.
- Zonas configurables: Cúcuta, Los Patios, Villa del Rosario y El Zulia.
- Panel administrativo con métricas y edición de tarifas, recargos y horarios.
- Permisos de servidor para cliente, comprador y administrador.
- Diseño responsive para móvil y escritorio.
- Pasarela Cúku preparada con el Widget oficial de Wompi, firma de integridad
  generada en servidor, conciliación privada en Supabase y webhook validado.

## Ejecutar localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. La barra superior permite cambiar entre los tres roles de demostración y probar el recorrido completo.

## Verificaciones

```bash
npm run test
npm run lint
npm run build
```

## Arquitectura

```text
app/api/                  Route Handlers y autorización HTTP
components/               Interfaz responsive del MVP
lib/domain/               Validaciones y errores del dominio
lib/services/             Reglas y transiciones del pedido
lib/repositories/         Contrato de persistencia y adaptador en memoria
lib/types.ts              Tipos compartidos
prisma/schema.prisma      Modelo PostgreSQL de producción
tests/                    Pruebas del flujo y permisos
```

La demostración usa memoria para poder arrancar sin credenciales. El contrato `PurchaseRepository` permite sustituirla por PostgreSQL sin reescribir las reglas, las APIs ni las pantallas. Las imágenes se representan como datos locales en el prototipo; producción debe guardarlas en almacenamiento de objetos y conservar solo su URL.

## Permisos por rol

| Acción | Cliente | Comprador | Administrador |
|---|---:|---:|---:|
| Crear solicitud | Sí | No | No |
| Ver solicitudes abiertas | No | Sí | Sí |
| Aceptar solicitud | No | Sí | No |
| Enviar opciones | No | Solo asignado | No |
| Aprobar/rechazar precio | Propietario | No | No |
| Registrar compra y recibo | No | Solo asignado | No |
| Marcar recogida/entrega | No | Solo asignado | No |
| Confirmar recepción | Propietario | No | No |
| Ver métricas y configurar zonas | No | No | Sí |

## Antes de producción

1. Conectar PostgreSQL y generar la migración de Prisma.
2. Integrar autenticación real y verificación de identidad de compradores.
3. Guardar fotos y recibos en almacenamiento privado.
4. Completar la vinculación comercial de Wompi, cargar las llaves de producción
   y configurar la URL de eventos `https://cuku-zeta.vercel.app/api/payments/wompi/webhook`.
5. Añadir geocodificación, cálculo real de distancia y seguimiento.
6. Definir política de productos prohibidos, farmacia, reembolsos y disputas.
7. Revisar términos legales, privacidad y obligaciones tributarias en Colombia.

No se implementaron todavía llamadas, video ni seguimiento GPS; pertenecen a
fases posteriores. Los cobros reales permanecen bloqueados mientras falten las
credenciales de Wompi, la migración privada de pagos o la configuración de
WhatsApp Business Cloud API.

## Activar la Pasarela Cúku

1. Ejecuta `supabase/migrations/20260825_create_cuku_payment_orders.sql`.
2. Copia `.env.example` y configura en Vercel las variables de Wompi, Supabase y
   WhatsApp. La llave pública es la única variable de Wompi expuesta al navegador.
3. Prueba primero con llaves `pub_test_`, `test_integrity_` y `test_events_`.
4. En el panel de Wompi Sandbox registra como URL de eventos
   `https://cuku-zeta.vercel.app/api/payments/wompi/webhook`.
5. Después de aprobar todo el flujo, sustituye las tres credenciales por sus
   equivalentes de producción y registra la URL en el ambiente Producción.

El Checkout muestra antes de abrir Wompi el subtotal y la tarifa configurada
de `3,49% + $900 COP`; el servidor vuelve a calcularla y firma el total para
evitar manipulaciones desde el navegador. Ejecuta también
`supabase/migrations/20260825_add_processing_fee_to_cuku_payment_orders.sql`
si la tabla de pagos ya existía.

Wompi decide qué métodos presenta según los habilitados para el comercio. Su
documentación web para Colombia no anuncia Apple Pay ni Google Pay; por eso Cúku
no muestra botones de marca simulados. Cuando el Widget devuelva la transacción,
el cliente pasa a `/pagar/confirmacion` y el pedido solo se despacha después del
evento firmado `APPROVED` recibido en el webhook.

## Transferencias directas con comprobante

La ruta `/pagar` usa un flujo de transferencia directa protegido:

1. Crea una referencia única y solicita un QR oficial al proveedor configurado.
2. Recibe una imagen JPG, PNG o WebP de hasta 4 MB.
3. Calcula SHA-256 para bloquear la reutilización de una misma captura.
4. OpenAI Vision extrae monto, estado visible y número de comprobante con salida JSON estricta.
5. La IA nunca cambia una orden a `APPROVED`: solo una confirmación bancaria firmada puede hacerlo.
6. Después del abono confirmado se avisa a la central de operaciones por WhatsApp.

Ejecuta también `supabase/migrations/20260825_create_transfer_payment_orders.sql`
y configura las variables `DIRECT_TRANSFER_*` y `OPENAI_*` de `.env.example`.
El endpoint de QR debe ser el oficial de Nequi, DaviPlata, Bre-B o de la entidad
financiera contratada; no se deben construir códigos financieros inventados.

El adaptador bancario debe enviar a
`/api/payments/transfer/bank-confirmation` el JSON:

```json
{
  "reference": "CUKU-T-...",
  "providerTransactionId": "movimiento-unico",
  "amountInCents": 8300000,
  "currency": "COP",
  "status": "APPROVED"
}
```

Debe incluir `x-cuku-timestamp` y `x-cuku-signature`; la firma es HMAC-SHA256
hexadecimal de `<timestamp>.<cuerpo-JSON-exacto>` usando
`DIRECT_TRANSFER_WEBHOOK_SECRET`. Se rechazan eventos con más de cinco minutos.
