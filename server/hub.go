// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"encoding/json"
	"log"
	"sync"
)

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	ID    string
	Owner *Client

	Round     int
	Loyal     string
	LoyalLeft int
	Spy       string
	SpyCnt    int
	SpyLeft   int

	State State

	clients_mirror []*Client

	// Registered clients.
	clients map[*Client]bool

	// Inbound messages from the clients.
	inbound chan *WsMsg

	// Outbound messages from the Hub.
	outbound chan *WsMsg

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	disconnected []*Client

	close chan bool
}

func newHub(ID string) *Hub {
	log.Printf("Hub %v created.", ID)
	return &Hub{
		ID:           ID,
		inbound:      make(chan *WsMsg),
		outbound:     make(chan *WsMsg),
		register:     make(chan *Client),
		unregister:   make(chan *Client),
		clients:      make(map[*Client]bool),
		disconnected: make([]*Client, 0),
		close:        make(chan bool),
	}
}

func (h *Hub) OutString(client *Client, msg string) {
	h.outbound <- &WsMsg{Client: client, Data: []byte(msg)}
}

func (h *Hub) Out(client *Client, body any) {
	b, err := json.Marshal(body)
	if err != nil {
		log.Println(err)
	}
	h.outbound <- &WsMsg{Client: client, Data: b}
}

func (h *Hub) Mirror() {
	h.clients_mirror = make([]*Client, 0)

	for c := range h.clients {
		h.clients_mirror = append(h.clients_mirror, c)
	}
}

var restartLock sync.Mutex

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			if h.State == Ready {
				h.clients[client] = true
				log.Printf("[%s] %s %s joined the game", h.ID, client.ID, client.Name)
				h.Mirror()

				go func() {
					// Joined ID
					h.Out(client, &GameMsg{Type: "ID", ClientID: client.ID, ClientName: client.Name})

					//Broadcast Join Info
					h.Out(nil, h.GetJoinMsg())
				}()
			}

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				log.Printf("[%s] %s %s has left the game.", h.ID, client.ID, client.Name)
				delete(h.clients, client)
				close(client.send)

				// backup client
				h.disconnected = append(h.disconnected, client)

				if h.State != Ready { // Wait for rejoin

					drop := &GameMsg{Type: "dropped", ClientID: client.ID, ClientName: client.Name}

					go h.Out(nil, drop)
					// if restartLock.TryLock() {
					// 	go func() {
					// 		defer restartLock.Unlock()

					// 		// alert count down 20
					// 		h.Out(nil, drop)

					// 		// wait for 20 sec
					// 		time.Sleep(time.Second * 60 * 3)

					// 		if len(h.disconnected) == 0 {
					// 			log.Printf("[%s] All Players re-joined.", h.ID)
					// 			return
					// 		}

					// 		// alert restart if not rejoined
					// 		h.Mirror()
					// 		h.inbound <- &WsMsg{Data: []byte("reset")}
					// 		log.Printf("[%s] Game reset", h.ID)

					// 	}()
					// }

				} else {
					h.Mirror()
					go h.Out(nil, h.GetJoinMsg())
				}

			}
			if len(h.clients) <= 0 {
				log.Printf("[%s] The last client has left the hub.", h.ID)
				h.Reset()
			}
		case message := <-h.inbound:
			h.Tick(message)
		case message := <-h.outbound:
			for client := range h.clients {
				if message.Client != nil && client != message.Client {
					continue
				}
				select {
				case client.send <- message.Data:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		case <-h.close:
			return
		}
	}
}
