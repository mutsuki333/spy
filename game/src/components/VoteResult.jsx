
import { getRole, getRoleClass } from "../util"

const VoteResult = ({
  liveLoyal=0, liveSpy=0, role=0, name="DEV",
  isDead=false
}) => {
  return <div className="vr">
    <div className={`player-icon ${isDead?"me":""}`}>
      <i className="pi pi-user"></i>
      <i className="pi pi-times-circle vr-x"></i>
      <div className={`player-role ${getRoleClass(role)}`}>{getRole(role)}</div>
    </div>
    {isDead?
      <h1>你死了!</h1>
    :
      <h1>{name}被殺了!</h1>
    }
    
    <div className="rv-report">
      <span>剩餘{getRole(0)}:</span> {liveLoyal}
      <br/>
      <span>剩餘{getRole(1)}:</span> {liveSpy}
    </div>

  </div>
}

export default VoteResult