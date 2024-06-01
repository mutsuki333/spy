
import PlayerCard from "../components/PlayerCard"

const Narrate = ({
  players, me,
  stmt, isDead,
  narrating, narrate, narrated
}) => {

  
  return <>

    <div className={isDead?"stmt narrate is-dead":"stmt narrate"}>
      <span>{stmt}</span>
    </div>

    <div className="players narrate grid">
      { players.map( (p) => 
        <div className="col-4" key={p.ID} >
          <PlayerCard
            me={p.ID==me}
            isNarrating={p.ID == narrating}
            isDead={p.IsDead}
            role={p.Role}
          />
          <span className="player-name">{p.Name}</span>
        </div>
      )}
    </div>

    { narrate &&
      <div className="narrate-btn-cntr">
        <button className='narrate-btn cursor-pointer' onClick={narrated}>
          我說完了
        </button>
      </div>
    }
  </>
}


export default Narrate

