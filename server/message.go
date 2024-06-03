package main

import (
	"sort"
)

type State int

const (
	Ready State = iota
	Deliver
	PreNarrate
	Narrate
	Vote
)

type Role int

const (
	Loyal Role = iota
	Spy
	White
)

type WsMsg struct {
	Client *Client
	Data   []byte
}

type JoinMsg struct {
	Type      string
	HubID     string
	State     State
	SpyCnt    int
	PlayerCnt int
	Clients   []*Client
}

func (h *Hub) GetJoinMsg() *JoinMsg {
	msg := &JoinMsg{
		Type:      "status",
		HubID:     h.ID,
		State:     h.State,
		SpyCnt:    1 + (len(h.clients)-1)/4,
		PlayerCnt: len(h.clients),
		Clients:   h.clients_mirror,
	}
	return msg
}

type GameMsg struct {
	Type       string `json:",omitempty"`
	ClientID   string `json:",omitempty"`
	ClientName string `json:",omitempty"`
}

type DeliverMsg struct {
	Type      string `json:",omitempty"`
	Statement string
}

type VotePlayer struct {
	ID       string
	Name     string
	IsDead   bool
	Role     *Role        `json:",omitempty"`
	VoteDone *bool        `json:",omitempty"`
	VotedBy  []VotePlayer `json:",omitempty"`
}

type VoteMsg struct {
	Type    string `json:",omitempty"`
	Players []VotePlayer
}

func (h *Hub) GetVoteMsg(withVotes bool) *VoteMsg {

	vsm := &VoteMsg{
		Type:    "vote",
		Players: make([]VotePlayer, 0),
	}
	for _, c := range h.clients_mirror {
		vp := VotePlayer{
			ID: c.ID, Name: c.Name, IsDead: c.IsDead,
		}
		if c.IsDead {
			vp.Role = &c.role
		}

		if withVotes {
			for _, d := range h.clients_mirror {
				if d.VoteFor == nil || d.VoteFor.ID != c.ID {
					continue
				}
				if vp.VotedBy == nil {
					vp.VotedBy = make([]VotePlayer, 0)
				}
				vp.VotedBy = append(vp.VotedBy, VotePlayer{
					ID: d.ID, Name: d.Name, VoteDone: Ref(d.VoteDone),
				})
			}
		}

		vsm.Players = append(vsm.Players, vp)
	}
	return vsm
}

type VoteResult struct {
	Type string `json:",omitempty"`

	Loyal int
	Spy   int
	White int

	Killed VotePlayer

	Clients []VotePlayer
}

func (h *Hub) GetVoteResult(living_loyal, living_spy int, killed *Client) *VoteResult {
	vr := &VoteResult{
		Type:  "vote_result",
		Loyal: living_loyal, Spy: living_spy,
		Killed: VotePlayer{
			ID: killed.ID, Name: killed.Name, Role: &killed.role,
		},
		Clients: make([]VotePlayer, 0),
	}
	for _, c := range h.clients_mirror {
		vp := VotePlayer{
			ID: c.ID, Name: c.Name, IsDead: c.IsDead,
		}
		if c.IsDead {
			vp.Role = &c.role
		}
		vr.Clients = append(vr.Clients, vp)
	}
	return vr
}

type ClientRole struct {
	ID   string
	Name string
	Stmt string
	Wins int
	Role Role
}
type GameResult struct {
	Type   string `json:",omitempty"`
	Win    Role
	Loyal  string
	Spy    string
	Result []*ClientRole
}

func (h *Hub) GetGameResult(win Role) *GameResult {
	msg := &GameResult{
		Type:   "result",
		Win:    win,
		Loyal:  h.Loyal,
		Spy:    h.Spy,
		Result: make([]*ClientRole, 0),
	}
	for _, c := range h.clients_mirror {
		msg.Result = append(msg.Result, &ClientRole{
			ID: c.ID, Name: c.Name, Role: c.role, Stmt: c.stmt, Wins: c.Wins,
		})
	}
	sort.Slice(msg.Result, func(i, j int) bool { return msg.Result[i].Wins > msg.Result[j].Wins })
	return msg
}
