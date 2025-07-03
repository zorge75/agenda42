# Agenda 42 --> [agenda42.fr](https://agenda42.fr)

Manage slots, check evals history, and 42 school events from a single interface.

## Developing
## Setup & configuration
- Create a Oauth application on [intra](https://profile.intra.42.fr/oauth/applications)
- Copy the file `./.env.example` to `./env/.env.local` and fill out the (secret) data
- Make the file `./.env.prod` to build this project in production mode

```
API_URI=https://aron.agenda42.fr/api/auth/callback
CLIENT_ID=u-...
API_TOKEN=s-...
PORT=3002
STATUS=development
```

## Updating the secrets / API tokens
```shell
cd agenda42
vim .env.local
# make changes
docker compose down
docker compose up -d

# To get logs
docker logs --tail 10000 -f agenda42-app

# Or without compose
docker build -t agenda42-app .
docker run --env-file .env.production -p 3002:3002 agenda42-app
```

# Other command
kill -9 $(lsof -t -i:3002)


## Monitoring
At the (unauthenticated) route `/status/pull` you can see a summary of the pull status of every campus
It contains the key `hoursAgo` for every campus, which is the amount of hours since the last successful pull (syncing the 42 DB of the users' completed projects) of that campus
This value should not be higher than 2 * the pull timeout (currently 24 hours)

## Configuration files
| File path                                    | Description                                                                           | Managed by server |
|----------------------------------------------|---------------------------------------------------------------------------------------|-------------------|
| `.env.example`                               | Example file for api tokens, rename to `.env` to activate                             | no                |

### Makefile
```
make dev // for development mode in the server port 3002 (npm run dev)
```

### Docker and Docker-compose
This is in production
```shell
git clone https://github.com/brgman/agenda42.git
cd agenda42
docker compose up -d

# To get logs
docker logs --tail 10000 -f agenda42-app
```

### Locally
- Install Nodejs >= 18.x
- Install dependencies\
`npm install`
- Start development server\
`npm run dev`