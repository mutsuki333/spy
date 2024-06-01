import { useCallback, useEffect, useRef, useState } from "react"
import { emitter } from "../util"

const Banner = ({delay=2000}) => {

  const daemon = useRef(false)
  const queue = useRef([])
  const blocked = useRef(false)
  const [msg, setMsg] = useState("")

  const showMsg = useCallback(() => {
    if (daemon.current || queue.current.length==0 || blocked.current) return
    daemon.current = true
    setMsg(()=>{
      while (true) {
        let next = queue.current.shift()
        if (next.startsWith("輪到") && queue.current.length>0 && queue.current[0].startsWith("輪到")){
          continue
        } else {
          return next
        }
      }
    })
    setTimeout(()=>{
      setMsg("")
      daemon.current = false
      showMsg()
    }, delay)
  }, [delay, setMsg])

  useEffect(()=>{
    emitter.on("banner", evt => {
      queue.current.push(evt)
      if (blocked.current) {
        return
      }
      showMsg()
    })
    
    emitter.on("block_banner", () => {
      blocked.current=true
    })
    emitter.on("unblock_banner", () => {
      blocked.current=false
      showMsg()
    })

    return () => {
      emitter.off("banner")
      emitter.off("block_banner")
      emitter.off("unblock_banner")
    }
  }, [showMsg])

  if (!msg) return null
  return <div className="banner">
    <div className="banner-text">
      {msg}
    </div>
  </div>
}


export default Banner