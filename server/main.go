package main

import (
	"flag"
	"imposter/dist/game"
	"log"
	"net/http"
	"sync"
	"time"
)

var addr = flag.String("addr", ":8080", "http service address")
var ibm = flag.Bool("ibm", false, "Include IBM Questions")

func main() {
	flag.Parse()

	var hubs = make(map[string]*Hub)

	// clean up empty hub
	var CleanUpLock sync.RWMutex
	go func() {
		for {
			time.Sleep(time.Minute * 5)

			CleanUpLock.Lock()
			for id, h := range hubs {
				if len(h.clients) == 0 {
					log.Printf("Hub %v removed.", h.ID)
					delete(hubs, id)
					go func(_h *Hub) {
						close(_h.close)
					}(h)
				}
			}

			CleanUpLock.Unlock()
		}
	}()

	ui := http.FileServer(http.FS(game.FS))
	http.Handle("/", ui)
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		hubID := r.URL.Query().Get("hub")
		if hubID == "" {
			hubID = "default"
		}

		CleanUpLock.RLock()
		defer CleanUpLock.RUnlock()
		hub, ok := hubs[hubID]
		if !ok {
			hub = newHub(hubID)
			hubs[hubID] = hub
			hub.Reset()
			go hub.run()
		}

		serveWs(hub, w, r)
	})
	log.Println("spy server started.")
	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
