# Agenda42.fr

# Makefile:

make dev

with file .env.local
------------------------
API_URI=https://aron.agenda42.fr/api/auth/callback
CLIENT_ID=u-...
API_TOKEN=s-...
PORT=3002
STATUS=development
------------------------

# Docker
docker build -t agenda42-app .
docker run --env-file .env.production -p 3002:3002 agenda42-app

----------------
kill -9 $(lsof -t -i:3002)
