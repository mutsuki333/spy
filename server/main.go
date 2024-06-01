package main

import (
	"flag"
	"imposter/dist/game"
	"log"
	"net/http"
)

var addr = flag.String("addr", ":8080", "http service address")
var ibm = flag.Bool("ibm", false, "Include IBM Questions")

func main() {
	flag.Parse()
	hub := newHub()
	hub.Reset()
	go hub.run()

	ui := http.FileServer(http.FS(game.FS))
	http.Handle("/", ui)
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})
	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
