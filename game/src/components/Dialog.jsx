import { useEffect, useState } from "react"

import { emitter } from "../util"

const Dialog = ({content}) => {

  const [show, setShow] = useState(true)

  const close = () => {
    setShow(false)
    emitter.emit("unblock_banner")
  }

  useEffect(()=>{
    if(!content) {
      close()
      return
    }
    emitter.emit("block_banner")
    setShow(true)
  }, [content])

  if (!show) return null
  return <div className="dialog">
    <div className="dialog-content">
      {content}
      <button onClick={close}>確認</button>
    </div>
  </div>
}

export default Dialog