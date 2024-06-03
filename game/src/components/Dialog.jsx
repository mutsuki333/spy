import { useEffect, useState } from "react"

import { emitter } from "../util"

const Dialog = () => {

  const [show, setShow] = useState(false)
  const [yes, setYes] = useState(null)
  const [no, setNo] = useState(null)
  const [content, setContent] = useState(null)

  useEffect(()=>{

    const close = () => {
      setShow(false)
      emitter.emit("unblock_banner")
    }

    emitter.on("dialog", evt => {
      // console.log(evt)
      emitter.emit("block_banner")
      setContent(evt.content)
      if (evt.yes) setYes(()=>()=>{evt.yes?.();close()})
      else setYes(null)
      if (evt.no) setNo(()=>()=>{evt.no?.();close()})
      else setNo(()=>()=>close())
      setShow(true)
    })
    return ()=>emitter.off("dialog")
  }, [])

  if (!show) return null
  return <div className="dialog">
    <div className="dialog-content">
      {content}
      <div className="flex justify-content-evenly buttons">
        { yes && <button onClick={yes}>確認</button> }
        <button onClick={no}>關閉</button>
      </div>
    </div>
  </div>
}

export default Dialog