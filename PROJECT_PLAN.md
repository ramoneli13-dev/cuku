# Plan del proyecto — Cúku

## Visión

Crear con **Cúku** una plataforma local para que una persona solicite compras o diligencias en cualquier negocio legal de Cúcuta y sus alrededores. La operación no depende de convenios comerciales: un comprador personal puede visitar comercios registrados o no registrados, mostrar opciones al cliente y comprar únicamente después de recibir autorización.

## Principios

1. El cliente mantiene el control del presupuesto.
2. Producto y tarifas siempre se muestran por separado.
3. Cada gasto debe dejar evidencia y recibo.
4. Comprador y repartidor son capacidades del mismo rol operativo.
5. Las zonas, tarifas y horarios se configuran sin cambiar código.
6. La arquitectura debe admitir nuevos municipios y comercios con catálogo.

## Fase 1 — MVP funcional (implementada)

- [x] Estructura modular Next.js y TypeScript.
- [x] Modelo PostgreSQL de referencia.
- [x] Roles y permisos de cliente, comprador y administrador.
- [x] Creación libre de solicitudes y fotografías de referencia.
- [x] Comercio específico o búsqueda abierta.
- [x] Aceptación por comprador.
- [x] Opciones con foto, comercio, detalle y precio.
- [x] Aprobación, rechazo o solicitud de otra opción.
- [x] Autorización explícita de excedentes.
- [x] Registro de compra y recibo.
- [x] Recogida, entrega y confirmación del cliente.
- [x] Chat por pedido.
- [x] Costos separados.
- [x] Cuatro zonas iniciales configurables.
- [x] Métricas administrativas básicas.
- [x] Pruebas de reglas críticas.

## Fase 2 — Piloto privado

- PostgreSQL administrado y migraciones.
- Inicio de sesión por teléfono/correo.
- Verificación documental y antecedentes para compradores.
- Almacenamiento privado para fotos y recibos.
- Direcciones con mapa, coordenadas y distancia real.
- Notificaciones por correo, WhatsApp o push.
- Asignación y disponibilidad de compradores.
- Pagos con autorización previa, reembolsos y liquidación al comprador.
- Historial de auditoría que no pueda editarse.

## Fase 3 — Operación comercial

- Calificaciones, soporte y disputas.
- Reglas para farmacia y categorías restringidas.
- Inventario/catálogos opcionales para comercios registrados.
- Promociones, propinas y cupones.
- Seguimiento en mapa.
- Analítica financiera y conciliación.
- Expansión progresiva a otros municipios.

## Máquina de estados

```text
OPEN → ACCEPTED → OPTIONS_SENT → OPTION_APPROVED → PURCHASED → PICKED_UP → DELIVERED → COMPLETED
```

Solo el cliente puede mover `OPTIONS_SENT → OPTION_APPROVED` y `DELIVERED → COMPLETED`. Solo el comprador asignado puede ejecutar las demás transiciones operativas. La compra se rechaza si el precio final excede la opción aprobada.

## Decisiones diferidas

- Dominio y disponibilidad legal de la marca Cúku.
- Estructura de comisión y quién asume cada cargo.
- Pasarela de pagos colombiana.
- Política de efectivo y anticipos.
- Productos prohibidos o con edad mínima.
- Contrato y clasificación legal de compradores.
- Horarios y tarifas definitivas por municipio.
