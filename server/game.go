package main

import (
	"encoding/json"
	"log"
	"math/rand/v2"
	"strings"
	"time"
)

func (h *Hub) Tick(msg *WsMsg) {

	switch string(msg.Data) {
	case "restart":
		h.State = Ready
		msg.Data = []byte("start")

	case "reset":
		h.State = Ready
		go h.Out(nil, h.GetJoinMsg())
		return
	case "stmt":
		go h.Out(msg.Client, &DeliverMsg{Type: "stmt", Statement: msg.Client.stmt})
		return
	case "status":
		go h.Out(msg.Client, h.GetJoinMsg())
		return
	}

	if strings.HasPrefix(string(msg.Data), "fixed_question") {
		fixed_question = strings.TrimSpace(strings.TrimPrefix(string(msg.Data), "fixed_question"))
		log.Println("question is fixed to", fixed_question)
		return
	}

	if strings.HasPrefix(string(msg.Data), "kick ") && h.State == Ready {
		id := strings.TrimPrefix(string(msg.Data), "kick ")
		for c := range h.clients {
			if c.ID == id {
				log.Printf("%s %s is kicked", c.ID, c.Name)
				c.conn.Close()
				return
			}
		}
	}

	switch h.State {
	case Ready:
		if string(msg.Data) == "start" {
			h.State = Deliver
			h.SpyCnt = 1 + (len(h.clients_mirror)-1)/4

			// get stmt
			q := RandomQuestion()
			h.Loyal = q.Loyal
			h.Spy = q.Spy

			// Initiate
			spyLst := generateUniqueRandomNumbers(h.SpyCnt, len(h.clients_mirror))

			for i, c := range h.clients_mirror {
				isSpy := false
				for _, v := range spyLst {
					if v == i {
						isSpy = true
						break
					}
				}
				if isSpy {
					log.Printf("%s is spy.", c.Name)
					c.role = Spy
					c.stmt = h.Spy
				} else {
					log.Printf("%s is loyal.", c.Name)
					c.role = Loyal
					c.stmt = h.Loyal
				}

				c.Narrated = false
				c.IsDead = false
				i++
			}
			go h.Out(msg.Client, h.GetJoinMsg())

			// send stmts
			for c := range h.clients {
				go h.Out(c, &DeliverMsg{Type: "stmt", Statement: c.stmt})
			}

			// start Narrate
			for _, c := range h.clients_mirror {
				c.Narrated = false
			}
			start := h.clients_mirror[h.Round%len(h.clients_mirror)]
			msg := &GameMsg{Type: "narrate", ClientID: start.ID, ClientName: start.Name}
			h.State = PreNarrate
			go func() {
				time.Sleep(time.Second * 1)
				if h.State != PreNarrate {
					return
				}
				h.State = Narrate
				log.Printf("%s is narrating.", start.Name)
				h.Out(nil, msg)
			}()
		}
	case Narrate:
		if string(msg.Data) == "narrated" {
			log.Printf("%s has narrated.", msg.Client.Name)
			go h.Out(nil, &GameMsg{Type: "narrated", ClientID: msg.Client.ID, ClientName: msg.Client.Name})
			msg.Client.Narrated = true

			// get next none dead player
			idx := GetClientIdx(h.clients_mirror, msg.Client)
			search := idx + 1
			for {
				if search >= len(h.clients_mirror) {
					search = 0
				}
				// log.Println("[DEBUG] ", search, idx)
				if search == idx {
					// Done narration
					log.Println("Done narration.")
					for _, c := range h.clients_mirror {
						c.VoteDone = false
						c.VoteFor = nil
						c.voted = 0
					}
					h.State = Vote
					log.Println("Start voting")
					vsm := h.GetVoteMsg(false)
					go h.Out(nil, vsm)
					break
				}
				next := h.clients_mirror[search]
				if next.IsDead || next.Narrated {
					// log.Printf("%s has narrated.", next.Name)
				} else {
					log.Printf("%s is narrating.", next.Name)
					go h.Out(nil, &GameMsg{Type: "narrate", ClientID: next.ID, ClientName: next.Name})
					break
				}

				search++
			}
		}

	case Vote:

		in := &GameMsg{}
		if err := json.Unmarshal(msg.Data, in); err != nil {
			break
		}
		switch in.Type {
		case "vote":
			if msg.Client.VoteDone || msg.Client.IsDead {
				break
			}
			if in.ClientID == "" {
				break
			}
			for _, c := range h.clients_mirror {
				if c.ID == in.ClientID {
					if c.IsDead || c.ID == msg.Client.ID {
						break
					}
					msg.Client.VoteFor = c

					log.Printf("%s votes %s.", msg.Client.Name, c.Name)
					go h.Out(nil, h.GetVoteMsg(true))
					break
				}
			}
		case "voted":
			if msg.Client.VoteFor == nil || msg.Client.VoteDone {
				if msg.Client.VoteDone {
					go h.Out(nil, &GameMsg{Type: "voted", ClientID: msg.Client.ID, ClientName: msg.Client.Name})
				}
				break
			}
			msg.Client.VoteDone = true
			log.Printf("%s done voting.", msg.Client.Name)
			go h.Out(nil, &GameMsg{Type: "voted", ClientID: msg.Client.ID, ClientName: msg.Client.Name})

			// Determine if vote has completed
			left := 0
			for _, c := range h.clients_mirror {
				if !c.IsDead {
					left++
					if c.VoteDone {
						left--
					}
				}
			}
			if left == 0 {
				log.Println("Vote done")
				h.Round++

				// determine who dies
				for _, c := range h.clients_mirror {
					if !c.IsDead && c.VoteFor != nil {
						c.VoteFor.voted++
					}
				}
				var candidate *Client
				for _, c := range h.clients_mirror {
					if candidate == nil {
						candidate = c
					}
					if c.voted > candidate.voted || (c.voted == candidate.voted && rand.IntN(2) > 0) {
						candidate = c
					}
				}
				candidate.IsDead = true
				log.Printf("%s is killed", candidate.Name)

				// determine if game ends
				living_loyal := 0
				living_spy := 0

				for _, c := range h.clients_mirror {
					if !c.IsDead {
						switch c.role {
						case Spy:
							living_spy++
						case Loyal:
							living_loyal++
						case White:
						}
					}
				}

				if living_spy == 0 { // loyal wins
					for _, c := range h.clients_mirror {
						if c.role == Loyal {
							c.Wins++
						}
					}

					// send results
					go h.Out(nil, h.GetGameResult(Loyal))
					h.State = Ready
					log.Println("loyal wins")

					// spy wins
				} else if (living_spy+living_loyal == 3 && living_spy >= 2) || // tree left and two spy
					(living_spy+living_loyal <= 2 && living_spy >= 1) { // two left and one spy
					for _, c := range h.clients_mirror {
						if c.role == Spy {
							c.Wins++
						}
					}

					// send results
					go h.Out(nil, h.GetGameResult(Spy))
					h.State = Ready
					log.Println("spy wins")

				} else { // not ended

					// send results
					vr := h.GetVoteResult(living_loyal, living_spy, candidate)
					go h.Out(nil, vr)

					log.Println("next round")
					for _, c := range h.clients_mirror {
						c.Narrated = false
					}

					idx := h.Round % len(h.clients_mirror)
					search := idx
					for {
						if search >= len(h.clients_mirror) {
							search = 0
						}

						next := h.clients_mirror[search]
						if next.IsDead || next.Narrated {
							// log.Printf("%s has narrated.", next.Name)
						} else {
							msg := &GameMsg{Type: "narrate", ClientID: next.ID, ClientName: next.Name}
							h.State = PreNarrate
							go func() {
								time.Sleep(time.Second * 1)
								if h.State != PreNarrate {
									return
								}
								h.State = Narrate
								log.Printf("%s is narrating.", next.Name)
								h.Out(nil, msg)
							}()
							break
						}
						search++
					}

				}

			}

		}

	}

}

func (h *Hub) Reset() {
	log.Println("Game reset")
	h.Loyal = ""
	h.Spy = ""
	h.LoyalLeft = 0
	h.SpyLeft = 0
	h.SpyCnt = 0
	h.State = Ready
	h.Round = rand.IntN(5)
	h.disconnected = make([]*Client, 0)
}
