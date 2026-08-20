# 🏋️‍♂️ F6 Deporte y Recreación - Plataforma de Gestión de Gimnasio

Plataforma web moderna, responsiva (**Mobile-First**) y completa para la gestión de clases diarias, reservas de cupos, control de asistencia en tiempo real y reportes mensuales de alumnos para el gimnasio **F6 Deporte y Recreación**.

![F6 Deporte y Recreación](public/logo-f6.png)

---

## 🚀 Características Principales

### 📱 Para Alumnos (Socios)
- **Acceso con Cuenta**: Inicio de sesión y registro de perfil.
- **Cartelera Diaria**: Selector de fechas touch (*Hoy*, *Mañana*, semana completa) y filtros por disciplina (*Funcional*, *Spinning*, *Crossfit*, *Boxeo*, *GAP*, *Yoga*, *Pilates*).
- **Inscripción y Desinscripción en 1 Clic**: Reserva inmediata con control de cupos en vivo y opción de liberar el cupo si no se puede asistir.
- **Mis Clases**: Sección con las clases reservadas activas y el historial de entrenamientos tomados.

### 📋 Para el Profesor / Administrador
- **Creación y Edición de Clases**: Publicar horarios, cupos máximos, salas y recomendaciones.
- **Control de Asistencia en Tiempo Real**: Lista de alumnos inscritos con datos de contacto directo (WhatsApp/teléfono) y marcación de asistencia (**Presente** / **Ausente**).
- **Auditoría y Reportes Mensuales**:
  - Selector de mes y año.
  - Indicadores clave: Total de clases, asistencias confirmadas, socios activos y tasa de asistencia.
  - Desglose por alumno: qué clases tomó cada alumno en el mes y fechas.
  - **Exportación a Excel / CSV** en un clic.
- **Directorio de Alumnos**: Listado general de socios registrados.

### ⚡ Selector Rápido de Prueba (Demo)
- Botón en la barra superior para alternar instantáneamente entre la cuenta de **Profesor** y de **Alumno** con un solo clic para pruebas y demostraciones.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Backend**: Node.js, Express 5, Better-SQLite3, JWT (JSON Web Tokens), Bcryptjs.
- **Base de Datos**: SQLite (modo WAL para alta concurrencia).
- **Empaquetador**: Vite 8.

---

## 📦 Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/pistoxenus-collab/sistema-gestion-gimnasio.git
cd sistema-gestion-gimnasio
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar en modo desarrollo (Servidor + Cliente)
```bash
npm run dev
```

La aplicación estará disponible en:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:4000`

---

## 👤 Cuentas de Prueba Preconfiguradas

| Rol | Correo | Contraseña |
| :--- | :--- | :--- |
| **Profesor / Admin** | `profesor@f6.cl` | `123456` |
| **Alumno 1** | `juan@gmail.com` | `123456` |
| **Alumno 2** | `maria@gmail.com` | `123456` |

---

## 📄 Licencia

Desarrollado para **F6 Deporte y Recreación**.
