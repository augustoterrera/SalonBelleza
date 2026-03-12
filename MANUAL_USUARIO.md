# Manual de Usuario — Bella Salon Management

## Acceso a la plataforma

| | |
|---|---|
| **URL** | http://localhost:3000 |
| **Email** | `admin@salonbelleza.com` |
| **Contraseña** | `demo1234` |

---

## Índice

1. [Dashboard](#1-dashboard)
2. [Calendario](#2-calendario)
3. [Citas](#3-citas)
4. [Clientes](#4-clientes)
5. [Profesionales](#5-profesionales)
6. [Categorías](#6-categorías)
7. [Servicios](#7-servicios)
8. [Productos](#8-productos)
9. [Promociones](#9-promociones)
10. [Horarios](#10-horarios)
11. [Configuración](#11-configuración)

---

## 1. Dashboard

La pantalla principal muestra un resumen del día:

- **Citas de hoy**: cantidad total, confirmadas, pendientes y completadas
- **Próximas citas**: lista de las siguientes citas programadas
- **Acceso rápido**: botón para crear una nueva cita desde cualquier pantalla

---

## 2. Calendario

Vista visual de todas las citas organizadas por profesional.

### Vistas disponibles
| Vista | Descripción |
|---|---|
| **Día** | Columnas por profesional, franjas horarias de 30 min |
| **Semana** | Vista semanal compacta de toda la agenda |
| **Mes** | Grilla mensual con puntos de color por cita |

### Navegación
- Usar las flechas `<` `>` para ir al día/semana/mes anterior o siguiente
- El botón **Hoy** vuelve a la fecha actual

### Drag & Drop
En la vista de día se pueden **arrastrar citas** a otro horario o profesional. El cambio se guarda automáticamente.

### Detalle de cita
Hacer clic en cualquier cita abre un panel con:
- Datos del cliente y servicio
- Botones para **Confirmar**, **Completar**, **Cancelar** o **Editar**

---

## 3. Citas

Lista completa de todas las citas con filtros avanzados.

### Crear una cita
1. Clic en **+ Nueva cita** (header superior derecho)
2. Buscar y seleccionar el cliente
3. Seleccionar categoría y servicio
4. Elegir duración (se completa automáticamente con la duración del servicio)
5. Seleccionar el profesional disponible
6. Elegir fecha y hora
7. Agregar notas opcionales
8. Clic en **Guardar**

### Editar / Reagendar
En la tabla de citas, usar el menú `···` de cada fila → **Editar / Reagendar**.
Se puede cambiar cualquier campo: cliente, servicio, profesional, fecha, hora y duración.

### Estados de una cita
| Estado | Descripción |
|---|---|
| 🟡 **Pendiente** | Cita creada, sin confirmar |
| 🟢 **Confirmada** | Cliente confirmó asistencia |
| ✅ **Completada** | Servicio realizado |
| 🔴 **Cancelada** | Cita cancelada (se puede registrar el motivo) |
| ⚫ **No asistió** | El cliente no se presentó |

### Filtros disponibles
- Búsqueda por nombre de cliente, servicio o profesional
- Filtro por estado
- Filtro por categoría
- Filtro por fecha: Hoy / Esta semana / Este mes / Personalizado

---

## 4. Clientes

Gestión del listado de clientes del salón.

### Registrar un cliente
1. Clic en **+ Nuevo cliente**
2. Completar nombre, teléfono, WhatsApp y notas opcionales
3. Clic en **Guardar cliente**

### Perfil del cliente
Hacer clic en el nombre de cualquier cliente abre su perfil lateral con:
- Datos de contacto
- Estadísticas: cantidad de visitas y total gastado
- **Historial completo de citas**

### Buscar clientes
El campo de búsqueda filtra por nombre, teléfono o WhatsApp en tiempo real.

---

## 5. Profesionales

Alta y gestión del equipo de trabajo.

### Agregar un profesional
1. Ir a **Gestion → Profesionales** → **+ Nuevo profesional**
2. Completar nombre, teléfono, color identificador y bio opcional
3. Asignar las **categorías** en las que trabaja
4. Asignar los **servicios** que puede realizar
5. Guardar

> El color del profesional se usa para diferenciarlo visualmente en el calendario.

---

## 6. Categorías

Las categorías agrupan los servicios (ej: Cabello, Manicura, Facial).

### Crear una categoría
1. **Gestion → Categorias** → **+ Nueva categoría**
2. Nombre, descripción y color identificador
3. Guardar

Los colores de categoría aparecen como indicadores visuales en el calendario y las tablas.

---

## 7. Servicios

Catálogo de servicios que ofrece el salón.

### Crear un servicio
1. **Gestion → Servicios** → **+ Nuevo servicio**
2. Nombre y descripción opcional
3. Seleccionar la categoría
4. Duración en minutos
5. Precio (marcar "a partir de" si el precio es variable)
6. Guardar

### Activar / Desactivar
El toggle en la columna **Activo** habilita o deshabilita el servicio. Los servicios inactivos no aparecen al crear citas.

### Filtrar por categoría
Usar el selector de categoría en la barra superior de la tabla.

---

## 8. Productos

Inventario de productos disponibles para venta en el salón.

### Agregar un producto
1. **Gestion → Productos** → **+ Nuevo producto**
2. Nombre, descripción, precio e imagen opcional (URL)
3. Guardar

El toggle **Activo** permite habilitar o deshabilitar productos del catálogo.

---

## 9. Promociones

Descuentos y ofertas especiales aplicables a servicios o productos.

### Crear una promoción
1. **Gestion → Promociones** → **+ Nueva promocion**
2. Título y descripción
3. Monto de descuento en $ (opcional)
4. Fecha de inicio y fecha de vencimiento
5. Seleccionar a qué servicio o producto aplica (o dejar en blanco para general)
6. Guardar

### Estados automáticos
| Estado | Condición |
|---|---|
| 🟢 **Vigente** | Fecha actual dentro del rango |
| 🔵 **Futura** | Aún no llegó la fecha de inicio |
| ⚫ **Vencida** | Pasó la fecha de fin |

El toggle **Activa** permite pausar una promoción aunque esté dentro del rango de fechas.

---

## 10. Horarios

Configuración del horario de atención del salón.

### Editar los horarios
Ir a **Configuracion → Horarios**.
Por cada día de la semana se puede configurar:

- **Abierto / Cerrado**: toggle para habilitar el día
- **Hora de apertura y cierre**
- **Tipo de jornada**:
  - **Corrido**: horario continuo (ej: 9:00 a 20:00)
  - **Cortado**: jornada con pausa al mediodía (ej: 9:00–13:00 / 16:00–20:00)

Hacer clic en **Guardar todos los horarios** para confirmar los cambios.

> Los horarios afectan la disponibilidad al momento de crear citas nuevas.

---

## 11. Configuración

Datos generales del salón.

Ir a **Configuracion → Configuracion** para editar:
- Nombre del salón
- Dirección
- Teléfono y WhatsApp
- Email de contacto
- Zona horaria

---

## Preguntas frecuentes

**¿Puedo crear una cita para un cliente nuevo sin registrarlo antes?**
No. El cliente debe estar registrado primero en **Gestion → Clientes**.

**¿Qué pasa si cambio la duración de un servicio?**
Las citas ya creadas no se modifican. El cambio aplica solo a las citas nuevas.

**¿Puedo tener varios profesionales en el mismo horario?**
Sí. El calendario muestra una columna por profesional y cada uno puede tener citas simultáneas.

**¿Cómo cancelo una cita?**
Desde el calendario (clic en la cita → Cancelar) o desde la tabla de Citas (menú `···` → Cancelar). Se puede registrar el motivo de cancelación.

---

*Bella Salon Management — versión beta*
