APP_NAME=auth-service
DIST_DIR=dist/$(APP_NAME)-backend
BIN_NAME=$(APP_NAME)
MIGRATOR_NAME=$(APP_NAME)-migrator

.PHONY: build clean deploy-prep

build:
	go build -o $(BIN_NAME) ./main.go
	go build -o $(MIGRATOR_NAME) ./cmd/migrator

clean:
	rm -rf dist $(BIN_NAME) $(MIGRATOR_NAME)

deploy-prep: clean
	mkdir -p $(DIST_DIR)/deploy
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o $(DIST_DIR)/$(BIN_NAME) ./main.go
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o $(DIST_DIR)/$(MIGRATOR_NAME) ./cmd/migrator
	cp -r migrations $(DIST_DIR)/migrations
	cp deploy/deploy_backend.sh $(DIST_DIR)/deploy/deploy_backend.sh
	chmod +x $(DIST_DIR)/$(BIN_NAME) $(DIST_DIR)/$(MIGRATOR_NAME) $(DIST_DIR)/deploy/deploy_backend.sh
	@echo "Deployment package ready in $(DIST_DIR)/"
