# Nom de l'image Docker
SERVICE_NAME=agenda42-prod
PORT = 3000

# Lancement en mode développement avec .env.local
dev:
	npx env-cmd -f .env.local npm run dev

COMPOSE_FILE=docker-compose.yml

# Construction de l'image avec Docker Compose
docker-build:
	docker-compose -f $(COMPOSE_FILE) build $(SERVICE_NAME)

# Lancement du conteneur avec Docker Compose
docker-up:
	docker-compose -f $(COMPOSE_FILE) up -d $(SERVICE_NAME)

# Arrêt du conteneur
#docker-down:
#	docker-compose -f $(COMPOSE_FILE) down

# Nettoyage des images (optionnel)
#docker-clean:
#	docker rmi $$(docker images -q agenda42-app) || true

# Reconstruction complète (nettoyage et construction)
#docker-rebuild: docker-down docker-clean docker-build

# Logs en temps réel
docker-logs:
	docker-compose -f $(COMPOSE_FILE) logs -f $(SERVICE_NAME)

# Accès à un shell dans le conteneur
docker-shell:
	docker-compose -f $(COMPOSE_FILE) exec $(SERVICE_NAME) sh
