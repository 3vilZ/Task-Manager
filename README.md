# Task Manager MVP

Un MVP de Task Manager desarrollado con Next.js, FastAPI y Supabase.

## Arquitectura

- **Frontend**: Next.js 14+ con TypeScript y Tailwind CSS
- **Backend**: FastAPI con Python
- **Base de datos**: Supabase (PostgreSQL con RLS)
- **Autenticación**: Supabase Auth (JWT)

## Requisitos Previos

- Node.js 18+ y npm
- Python 3.9+
- Cuenta de Supabase (gratuita)

## Setup Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ve a Settings > API y copia:
   - Project URL
   - `anon` key (para el frontend)
   - `service_role` key (para el backend)
3. Ejecuta la migración SQL en el SQL Editor de Supabase:
   - Abre `backend/migrations/001_create_tables.sql`
   - Copia y pega el contenido en el SQL Editor
   - Ejecuta la migración

## Configuración Backend

1. Navega a la carpeta backend:
```bash
cd backend
```

2. Activa el entorno virtual (si ya existe en la raíz del proyecto):
   - Windows: `.\env\Scripts\Activate.ps1` o `env\Scripts\activate`
   - Linux/Mac: `source env/bin/activate`
   
   Si no existe, créalo:
   ```bash
   python -m venv env
   ```

3. Instala las dependencias (con el env activado):
```bash
cd backend
pip install -r requirements.txt
```

5. Crea un archivo `.env` en `backend/`:
```env
SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_KEY=tu_service_role_key
JWT_SECRET=tu_jwt_secret (opcional, para validación adicional)
```

6. Ejecuta el servidor (asegúrate de tener el env activado):
```bash
cd backend
python -m uvicorn app.main:app --reload
```

El backend estará disponible en `http://localhost:8000`

## Configuración Frontend

1. Navega a la carpeta frontend:
```bash
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env.local` en `frontend/`:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_KEY=tu_anon_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

**Nota**: En Next.js, las variables usadas en el cliente deben tener el prefijo `NEXT_PUBLIC_`

4. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

## Uso

1. Abre `http://localhost:3000` en tu navegador
2. Crea una cuenta o inicia sesión
3. Accede al dashboard para ver tus tareas del día
4. Crea, edita y elimina tareas desde la página "All Tasks"
5. Ve tu agenda diaria en "Schedule"

## Estructura del Proyecto

```
Task-Manager/
├── backend/
│   ├── app/
│   │   ├── api/          # Endpoints de la API
│   │   ├── schemas/      # Modelos Pydantic
│   │   ├── services/     # Lógica de negocio
│   │   ├── db.py         # Cliente Supabase
│   │   └── main.py       # Aplicación FastAPI
│   ├── migrations/       # Migraciones SQL
│   └── requirements.txt
├── frontend/
│   ├── app/              # Páginas Next.js
│   ├── components/       # Componentes React
│   ├── lib/             # Utilidades (API, Supabase)
│   └── hooks/            # Custom hooks
└── README.md
```

## Endpoints API

### Autenticación
- `GET /auth/me` - Obtiene información del usuario autenticado

### Tareas
- `GET /tasks` - Lista todas las tareas (filtros: status, task_date)
- `GET /tasks/today` - Tareas del día actual
- `GET /tasks/current` - Tarea actual recomendada
- `GET /tasks/{id}` - Obtiene una tarea específica
- `POST /tasks` - Crea una nueva tarea
- `PUT /tasks/{id}` - Actualiza una tarea
- `DELETE /tasks/{id}` - Elimina una tarea

## Decisiones Técnicas

- **RLS (Row Level Security)**: Todas las tablas tienen políticas RLS para asegurar que los usuarios solo accedan a sus propios datos
- **JWT**: El frontend obtiene el token de Supabase y lo envía al backend en cada request
- **Separación de responsabilidades**: El frontend solo usa Supabase para autenticación, todos los datos pasan por FastAPI

## Limitaciones y Mejoras Futuras

- Validación completa de JWT con clave pública de Supabase
- Tabla de perfiles de usuario para información adicional
- Notificaciones y recordatorios
- Etiquetas y categorías de tareas
- Vista Kanban
- Estadísticas y reportes
- Sincronización en tiempo real

