


import { getRole, getRoleClass } from "../util"

import CrownIcon from '../assets/crown.svg'


const getClass = ({isDead, me, isNarrating, click}) => {
  if (isDead) return "is-dead"
  else if (isNarrating) return "is-narrator"
  else if (me) return "me"
  return click?"cursor-pointer":""
}

const PlayerCard = ({
  role=-1, voted=0, wins,
  me=false, isWinner=false, isDead=false, isNarrating=false,
  click=null
}) => {


  return (
    <div className={`player-icon ${getClass({isDead,me,isNarrating,click})}`} onClick={()=>click?.()}>
      <i className="pi pi-user"></i>
      { isWinner &&
        <div className="player-winner"><img src={CrownIcon}/></div>
      }
      { role>=0 &&
        <div className={`player-role ${getRoleClass(role)}`}>{getRole(role)}</div>
      }
      { wins!=undefined &&
        <div className="player-win">{wins}</div>
      }
      { voted > 0 &&
        <div className="player-vote-count">{voted}</div>
      }
    </div>
  )
}

export default PlayerCard