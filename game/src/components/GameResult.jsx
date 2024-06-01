
import { useEffect, useState } from "react"

import PlayerCard from "./PlayerCard"
import { getRole, getRoleClass } from "../util"

const GameResult = ({
  loyal="", spy="",
  role=0, isWin=false, players=[]
}) => {

  const [winner, setWinner] = useState([])
  const [loyalPlayers, setLoyalPlayers] = useState([])
  const [spyPlayers, setSpyPlayers] = useState([])


  useEffect(()=>{

    setLoyalPlayers(players.filter(v=>v.Role==0))
    setSpyPlayers(players.filter(v=>v.Role==1))

    let _players = [...players]
    _players.sort((a,b)=>b.Wins-a.Wins)
    let _winners = []
    for (let i = 0; i < Math.min(_players.length,3); i++) {
      if (i==1) _winners.unshift(_players[i])
      else _winners.push(_players[i])
    }
    setWinner(_winners)
  }, [players])
  return <div className="gr">
    { isWin ?
      <span className="result win">你贏了!</span>
      :
      <span className="result lose">你輸了!</span>
    }
    <br/>
    <span>{getRole(role)}獲勝</span>
    <div className="grid gr-players">
      <div className="col-6">
        <div className={`gr-role ${getRoleClass(0)}`}>{loyal}</div>
        { loyalPlayers.map(v=><div className="voter" key={v.ID}>{v.Name}</div>)}
      </div>
      <div className="col-6">
        <div className={`gr-role ${getRoleClass(1)}`}>{spy}</div>
        { spyPlayers.map(v=><div className="voter" key={v.ID}>{v.Name}</div>)}
      </div>
    </div>

    <div className="grid podium">
      { winner.map( (v,idx) => (
      <div className="col-4">
        <div className={`podium-player podium-${idx+1}`}>{v.Name}</div>
        <div className={`podium-stage podium-stage-${idx+1}`}>
          <div>{v.Wins}</div>
        </div>
      </div>
      ))}
    </div>
  </div>
}

export default GameResult