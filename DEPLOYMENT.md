# Deployment Guide

## Docker + MongoDB Atlas + .env

### 1. Backend `.env`
Create `backend/.env` with values for your Atlas cluster:

```env
MONGO_URI=mongodb+srv://username:password@cluster0.xxxx.mongodb.net/healthcare?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost
PORT=5000
```

### 2. Backend environment setup
The backend already uses `dotenv` in `backend/server.js`:

```js
require("dotenv").config();
```

### 3. Docker Compose
The existing `docker-compose.yml` now includes:

- `mongo`
- `backend`
- `frontend`

The backend service loads environment variables from `backend/.env` using `env_file`.

### 4. Build and run
For Atlas deployment (no local Mongo service):

```bash
docker-compose -f docker-compose.yml up --build -d
```

### 5. Local development override
By default, Docker Compose loads `docker-compose.override.yml` automatically when you run `docker-compose up`

That file adds:

- a local `mongo` service for backend development
- a bind mount of `./backend` into the container
- `NODE_ENV=development`

If you want frontend live reload during development, run it from the host:

```bash
cd frontend
npm run dev
```

### 6. Production safety checklist
- Do not use `0.0.0.0/0` in Atlas Network Access
- Use a strong password for your MongoDB user
- Always specify the database in the URI
- Keep `backend/.env` out of version control

### 6. Local vs Docker environment
- Local `.env` file lives on your host
- `env_file` passes values into the Docker container
- If `process.env.MONGO_URI` is `undefined`, Docker is not loading env correctly

### 7. Troubleshooting
Inside the container, check logs:

```bash
docker logs healthcare-backend
```

If needed, rebuild after env changes:

```bash
docker-compose down

docker-compose up --build -d
```
