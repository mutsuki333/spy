import { useCallback, useEffect, useRef, useState } from 'react'

import { throttle, emitter } from './util'

import Home from './pages/Home'
import Room from './pages/Room'
import Narrate from './pages/Narrate'
import Vote from './pages/Vote'
import Result from './pages/Result'

import Nav from './components/Nav'
import Banner from './components/Banner'
import Dialog from './components/Dialog'
import GameResult from './components/GameResult'
import VoteResult from './components/VoteResult'

const conn_msg = "與伺服器連線中..."
const narrate_msg = "開始描述"
const next_round_msg = "開始下一輪"
const your_narrate_msg = "輪到你了!"
const player_narrate_msg = (name) => `輪到 ${name} 了!`
const vote_msg = "開始投票!!"
// const you_die_msg = (role) => `你死了! 你是${getRole(role)}`
// const player_die_msg = (name, role) => `${name}死了! 他是${getRole(role)}`


function App() {

  const [uname, setUname] = useState("")
  const unameRef = useRef("")

  const [state, setState] = useState(-1)
  const [_ID, set_ID] = useState(-1)
  const ID = useRef(null)
  const [players, setPlayers] = useState([])
  const [playerCnt, setPlayerCnt] = useState(-1)
  const [spyCnt, setSpyCnt] = useState(-1)

  const [stmt, setStmt] = useState("觀戰中")
  const [narrate, setNarrate] = useState(false)
  const [isDead, setIsDead] = useState(false)
  const [narrating, setNarrating] = useState("")

  const [voteOpt, setVoteOpt] = useState([])
  const [voted, setVoted] = useState(false)

  const [liveLoyal, setLiveLoyal] = useState(-1)
  const [liveSpy, setLiveSpy] = useState(-1)
  
  const [dialog, setDialog] = useState(null)

  const ws = useRef(null)

  // const getStmt = useCallback(throttle(()=>ws.current?.send?.("stmt"), 1000),[ws])

  const leave = () => {
    ws.current && ws.current.close()
    ws.current = null
    ID.current = null
    setState(-1)
  }

  const join = useCallback(throttle(()=>{

    ws.current?.close?.()
    let protocol = (location.protocol === "https:") ? "wss://" : "ws://";
    let url = protocol + location.host + location.pathname + "ws"
    ws.current = new WebSocket(`${url}?name=${encodeURIComponent(unameRef.current)}`)
    window.dev = ws.current

    ws.current.onopen = function() {
      setState(0)
    };

    ws.current.onmessage = async function(e) {
      let msg = JSON.parse(e.data)
      if (!ID.current && msg.Type!="ID") {
        while (!ID.current) {
          emitter.emit("banner", conn_msg)
          await new Promise(r => setTimeout(r, 500))
        }
      }
      // console.log(msg)
      switch (msg.Type) {
        case "ID":
          ID.current = msg.ClientID
          set_ID(msg.ClientID)
          sessionStorage.setItem("uname", msg.ClientName)
          break;
        case "status":
          setPlayers(msg.Clients)
          setPlayerCnt(msg.PlayerCnt)
          setSpyCnt(msg.SpyCnt)
          switch (msg.State) {
            case 0:
              setState(0)
              setNarrate(false)
              setNarrating("")
              setIsDead(false)
              break;
            case 2,3:
              setState(1)
              for (const it of msg.Clients) {
                if (it.ID == ID.current) {
                  if (!it.IsDead && !it.Narrated)
                    setNarrate(true)
                  setIsDead(it.IsDead)
                  break
                }
              }
              break;
            case 4:
              setState(2)
              break;

            default:
              break;
          }
          break;
        case "stmt":
          setState(v=>{
            if (v>1) return v
            emitter.emit("banner", narrate_msg)
            return 1
          })
          setNarrating("")
          setStmt(msg.Statement)
          break;
        case "narrate":
          setNarrating(msg.ClientID)
          if (msg.ClientID==ID.current) {
            setNarrate(true)
            emitter.emit("banner", your_narrate_msg)
          } else {
            setNarrate(false)
            emitter.emit("banner", player_narrate_msg(msg.ClientName))
          }
          break;
        case "narrated":
          setPlayers(v => {
            let _v = JSON.parse(JSON.stringify(v))
            for (const it of _v) {
              if (it.ID == msg.ClientID) {
                it.Narrated = true
                break
              }
            }
            return _v
          })
          if (msg.ClientID==ID.current) setNarrate(false)
          break;

        case "vote":
          setState(v=>{
            if (v!=2) {
              emitter.emit("banner", vote_msg)
              setVoted(false)
            }
            return 2
          })
          setVoteOpt(msg.Players)
          break;
        case "voted": if (msg.ClientID==ID.current) setVoted(true)
          break;

        case "vote_result":
          emitter.emit("block_banner")
          setState(1)
          setPlayers(msg.Clients)
          setLiveLoyal(msg.Loyal)
          setLiveSpy(msg.Spy)
          if (msg.Killed.ID==ID.current) {
            setDialog(<VoteResult
              liveLoyal={msg.Loyal} liveSpy={msg.Spy}
              role={msg.Killed.Role} name={msg.Killed.Name}
              isDead
            />)
            setIsDead(true)
          } else {
            setDialog(<VoteResult
              liveLoyal={msg.Loyal} liveSpy={msg.Spy}
              role={msg.Killed.Role} name={msg.Killed.Name}
            />)
          }
          emitter.emit("banner", next_round_msg)
          break;

        case "result":

          let isWin = false
          for (const it of msg.Result) {
            if (it.ID==ID.current) {
              isWin=(it.Role==msg.Win)
              break
            }
          }
          setDialog(<GameResult
            loyal={msg.Loyal} spy={msg.Spy}
            players={msg.Result} role={msg.Win} isWin={isWin}
          />)
          setState(0)
          setIsDead(false)
          setPlayers(v => {
            let _v = JSON.parse(JSON.stringify(v))
            for (const it of _v) {
              it.IsDead = false
              it.Role = undefined

              for (const jt of msg.Result) {
                if (it.ID==jt.ID) {
                  it.Wins = jt.Wins
                }
              }
            }
            return _v
          })
          break;

        default:
          break;
      }
    };

    ws.current.onclose = function(e) {
      console.log('Socket is closed.', e.reason);
      // console.log('Socket is closed. Reconnect will be attempted in 5 second.', e.reason);
      // setTimeout(function() {
      //   join();
      // }, 5000);
      leave()
    };

    ws.current.onerror = function(err) {
      console.error('Socket encountered error: ', err.message, 'Closing socket');
      leave()
    };

  }), [setState, setPlayers, setPlayerCnt])


  // auto reconnect
  useEffect(()=>{
    let _uname = sessionStorage.getItem("uname")
    if (_uname) {
      setUname(_uname)
      unameRef.current=_uname
      join()
    }
  }, [])

  return (
    <div className='app'>

      <Banner/>
      <Dialog content={dialog}/>

      { (state==2||state==3) &&
        <Nav/>
      }

      { state>=1 && <Nav playerCnt={playerCnt} spyCnt={spyCnt}/>}
      { state==-1 && <Home join={join} name={uname} setName={v=>{setUname(v);unameRef.current=v}}/>}
      { state==0 && 
        <Room 
          players={players} playerCnt={playerCnt} me={_ID}
          start={()=>ws.current?.send?.("start")}
        />}
      { state==1 &&
        <Narrate
          players={players} stmt={stmt} isDead={isDead} me={_ID}
          narrating={narrating} narrate={narrate}
          narrated={()=>ws.current?.send?.("narrated")}
        />}
      { state==2 && 
        <Vote
          stmt={stmt} isDead={isDead} me={_ID}
          players={voteOpt}
          voted={voted}
          vote={(id)=>ws.current?.send?.(JSON.stringify({Type: "vote", ClientID: id}))}
          done={()=>ws.current?.send?.('{"Type":"voted"}')}
        />
      }
      { state==3 && <Result/>}
    </div>
  )
}



export default App
