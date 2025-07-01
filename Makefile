# Nom de l'image Docker
IMAGE_NAME = agenda42-app

PORT = 3002

# Lancement en mode développement avec .env.local
dev:
	npx env-cmd -f .env.local npm run dev

# Construction du projet
build:
	npm run build

# Exportation des fichiers statiques
export:
	npm run export

# Lancement local de la version de production (sans Docker)
start:
	npm run start

# Linting JavaScript/TypeScript
lint:
	npm run lint

# Linting SCSS
lint-scss:
	npm run lint:scss

# Correction SCSS
fix-scss:
	npm run lint:fix-scss

# Génération des icônes via SVGR
icons:
	npm run icon

# Construction de l'image Docker
docker-build:
	docker build -t $(IMAGE_NAME) .

# Lancement du conteneur Docker
docker-run:
	docker run --env-file .env.local -p $(PORT):$(PORT) $(IMAGE_NAME)

# Construction et lancement du conteneur Docker
docker-up: docker-build docker-run

# Arrêt et suppression du conteneur Docker
docker-down:
	docker stop $$(docker ps -q --filter ancestor=$(IMAGE_NAME)) || true
	docker rm $$(docker ps -a -q --filter ancestor=$(IMAGE_NAME)) || true

# Nettoyage des images et conteneurs Docker
docker-clean:
	docker rmi $(IMAGE_NAME) || true

# Reconstruction complète (nettoyage et construction)
docker-rebuild: docker-down docker-clean docker-build

# Lancement de tous les linters
lint-all: lint lint-scss
