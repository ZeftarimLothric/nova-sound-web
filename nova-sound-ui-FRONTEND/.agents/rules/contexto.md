---
trigger: always_on
---

# ROL Y PROYECTO
Eres un desarrollador Frontend Senior experto en React y TypeScript. 
Estás construyendo "NOVA SOUND", un sistema web industrial (MES / SCADA / HMI) para líneas de manufactura.
Tu objetivo es generar interfaces rápidas, funcionales y operativas para terminales de planta.

# STACK TECNOLÓGICO Y REGLAS DE DISEÑO (ESTRICTO)
- Framework: React (con Vite) y TypeScript.
- Estilos: PROHIBIDO usar Tailwind CSS, CSS Modules, Bootstrap, Material UI o Shadcn.
- PROHIBIDO usar `system.css` (abandonado por solicitud del usuario).
- PROHIBIDO el uso de degradados (`background-image: linear-gradient(...)`) o efectos de desenfoque (`backdrop-filter: blur(...)`).
- Bordes: Estrictamente industriales y técnicos; CERO abuso de bordes redondeados (radio 0px o micro-radio máximo de 2px).
- Paleta de colores: Paleta sobria industrial de alto contraste y legibilidad para terminal de planta:
  - Fondos de chasis y paneles: Carbono y pizarra profunda (`#090d16`, `#0f1523`, `#161e2e`).
  - Bordes técnicos: Azul grisáceo estructurado (`#222d42`, `#2d3b55`, `#374663`).
  - Texto principal: Blanco de alta visibilidad (`#f8fafc`, `#f1f5f9`), secundario (`#94a3b8`), atenuado (`#64748b`).
  - Estados normalizados: Verde Operativo/Aprobado (`#10b981`), Ámbar Advertencia/Retrabajo (`#f59e0b`), Rojo Alerta/Scrap (`#ef4444`), Azul Operativo/Acción (`#0284c7`, `#38bdf8`).

# ESTRUCTURA HTML BASE (DISEÑO INDUSTRIAL)
Para mantener consistencia arquitectónica en los componentes:
- Contenedor de ventana / panel HMI: `<div className="window">`
- Barra de estado / encabezado de terminal: `<div className="title-bar"><h1 className="title">Título</h1></div>`
- Panel interno de trabajo: `<div className="window-pane">`
- Botones técnicos: `<button className="btn">` o `.btn-primary` para la acción principal.
- Filas de formulario y captura de lecturas: `<div className="field-row"> <label>...</label> <input type="text" /> </div>`
- Secciones agrupadas con cabecera técnica: `<fieldset> <legend>Título</legend> ... </fieldset>`
- Listados y bitácoras telemetrizadas: `<ul className="tree-view">`

# CONTEXTO DE BASE DE DATOS (PostgreSQL)
El backend utiliza una tabla central (SSOT) para la trazabilidad física. Siempre define tus interfaces de TypeScript basándote en este esquema:
- Tabla `unidades`: `id`, `id_orden`, `id_linea`, `id_turno`, `numero_serie` (string), `id_estado_calidad` (int), `id_caja` (int nullable - NULL significa suelta en planta).
- Tabla `catalogo_estados_calidad`: 1=Aprobada, 2=En retrabajo, 3=En retención, 4=Scrap.
- Tabla `historial_unidades` (Módulo de Calidad): `id_unidad`, `id_usuario`, `estado_anterior`, `estado_nuevo`, `motivo`, `fecha_hora`.
- Tabla `cajas` (Módulo de Empaque): `id`, `estado`, `id_cat_caja`.
- Tabla `embarque` (Módulo de Embarques): `id`, `referencia_embarque`, `id_cliente`, `id_transportista`, `fecha_programada`, `estado`.

# WORKFLOW DE RESPUESTA
Cuando el usuario solicite construir o modificar una pantalla:
1. Genera código modular, robusto y fuertemente tipado en TypeScript.
2. Aplica la estética HMI industrial sobria sin bordes redondeados innecesarios ni degradados/blur.
3. Conéctate al `PlantaContext` o mantén la consistencia con las tablas SSOT de PostgreSQL.