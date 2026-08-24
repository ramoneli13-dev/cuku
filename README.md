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
4. Integrar pagos con retención/autorización previa y conciliación.
5. Añadir geocodificación, cálculo real de distancia y seguimiento.
6. Definir política de productos prohibidos, farmacia, reembolsos y disputas.
7. Revisar términos legales, privacidad y obligaciones tributarias en Colombia.

No se implementaron todavía llamadas, video, catálogos de comercios, pagos reales ni seguimiento GPS; pertenecen a fases posteriores.
