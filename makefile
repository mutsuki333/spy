

SERVER_SRC = $(wildcard server/*.go)

.PHONY: all
all: build

dist/spy: $(SERVER_SRC)
	GOOS=linux go build -o $@ server/*

.PHONY: build
build:
	GOOS=linux go build -o dist/spy server/*

.PHONY: web
web:
	cd game && npm run build

.PHONY: run
run:
	go run server/* -addr 127.0.0.1:8080 -ibm