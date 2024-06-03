
import QRCode from 'qrcode'

import { emitter } from '../util'


const Nav = ({
  state=-1, exit, reset
}) => {

  return <div className="nav grid">
    { state >=0 ? 
      <>
        <div className="col-3">
          <i className="pi pi-sign-out exit" onClick={exit}></i>
        </div>
        <div className="col-3">
          <i className="pi pi-replay reset" onClick={reset}></i>
        </div>
      </>
      :
      <div className="col-6"></div>
    }
    <div className="col-3">
      <i className="pi pi-share-alt share" onClick={()=>{
        const hub = sessionStorage.getItem("hub")?`?hub=${encodeURIComponent(sessionStorage.getItem("hub"))}`:""
        const url = `${location.origin}${hub}`
        QRCode.toDataURL(url)
        .then(dataURL=>{
          emitter.emit("dialog",{
            content: <div className='share'>
              <img src={dataURL}></img>
              <a target='_blank' href={url}>{url}</a>
            </div>
          })
        })
        .catch(err=>console.log(err))
      }}></i>
    </div>
    <div className="col-3">
      <i className="pi pi-question-circle info" onClick={()=>{
        emitter.emit("dialog",{
          content: <div className='rules'>
            <h1>遊戲規則</h1>
            <ol>
              <li>身份共有「臥底」和「平民」</li>
              <li>遊戲開始後，每人輪流用一段話，隱約地描述、暗示你看到的詞彙，不可說到詞彙上的字</li>
              <li>只有「臥底」的詞彙與其他人不同，「臥底」需掩飾身份與找出隊友</li>
              {/* <li>「白板」看到的詞彙會是一片空白，需觀察其他人的描述來唬爛</li> */}
              <li>一輪講完後大家要討論表決誰是臥底，高票當選的玩家被淘汰，若得票相同，系統將隨機決定</li>
              <li>玩家被淘汰時會公布該玩家是平民或是臥底，但遊戲結束前都不得暴露自己的字詞</li>
              <li>若遊戲場上已無臥底，平民獲勝</li>
              <li>若場上剩兩名玩家，其中一位是臥底，臥底勝利</li>
              <li>場上剩三名玩家，而在其中有兩位是臥底，臥底勝利</li>
            </ol>
          </div>
        })
      }}></i>
    </div>
    
    
  </div>
}


export default Nav