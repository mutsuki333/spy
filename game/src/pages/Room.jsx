import { useEffect, useState } from "react"

import PlayerCard from "../components/PlayerCard"


const Room = ({players, playerCnt, start, me}) => {

  const [pcClass, setPcClass] = useState("text-red-600")
  const [winner, setWinner] = useState(-1)

  useEffect(()=>{
    if (playerCnt < 4) {
      setPcClass("text-red-600")
    } else if (playerCnt < 17) {
      setPcClass("text-green-600")
    } else {
      setPcClass("text-red-500")
    }
  }, [playerCnt])

  useEffect(()=>{
    let max = -1
    for (const it of players)
      if (it.Wins && it.Wins>max) max=it.Wins
    setWinner(max)
  }, [players])

  return <>
    <div className='title room'>
      <span>誰是臥底</span>
    </div>
    
    <div className="room-count-before"><span>玩家</span></div>
    <div className="room-count">
      <span className={pcClass}>{playerCnt}</span>
    </div>
    <div className="room-count-after"><span>人</span></div>

    { playerCnt >= 2 &&
      <button className='room-start cursor-pointer'
        onClick={start}
      >開始!</button>
    }

    <div className="players grid">

      { players.map( (p) => 
        <div className="col-4" key={p.ID} >
          <PlayerCard
            me={p.ID==me}
            wins={p.Wins}
            isWinner={p.Wins && p.Wins >= winner}
          />
          <span className="player-name">{p.Name}</span>
        </div>
      )}

    </div>
  </>
}


export default Room