import { useEffect, useState } from "react"

import PlayerCard from "../components/PlayerCard"

const Vote = ({
  players, me,
  stmt, isDead,
  vote, voted, done
}) => {

  const [hasVote, setHasVote] = useState(false)

  useEffect(()=>{
    if (!players) setHasVote(false)
    for (const i of players) {
      if (!i.VotedBy) continue
      for (const j of i.VotedBy) {
        if (j.ID == me){
          setHasVote(true)
          return
        }
      }
    }
    setHasVote(false)
  }, [players])

  return <>

    <div className='title vote'>
      <span>誰是臥底</span>
    </div>

    <div className={isDead?"stmt is-dead":"stmt"}>
      <span>{stmt}</span>
    </div>

    <div className="players vote grid">

      { players.map( (p) => 
        <div className="col-4" key={p.ID} >
          <PlayerCard
            me={p.ID==me}
            isDead={p.IsDead}
            role={p.Role}
            voted={p.VotedBy?.length}
            click={isDead?null:()=>{
              if (p.ID!=me) vote(p.ID)
            }}
          />
          <span className="player-name">{p.Name}</span>

          { p.VotedBy?.map( v => 
            <div className="voter" key={v.ID}>{v.Name}</div>
          )}
        </div>
      )}

    </div>


    { hasVote &&
      <div className="vote-btn-cntr">
        { !voted ?
          <button className='vote-btn cursor-pointer' onClick={done}>
            決定
          </button>
          :
          <span>投票完成</span>
        }
      </div>
    }
  </>
}


export default Vote