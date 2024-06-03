

import Logo from '../assets/ania.png'
// import Logo from '../assets/spy.svg'

const Home = ({join, name, setName, hubID, setHubID}) => {

  return <>
    <div className='title home'>
      <span>誰是臥底</span>
    </div>
    
    <img src={Logo} className='home-logo'></img>

    <div className='home-join-ctr'>
      <span>房間ID:</span>
      <input type="text" placeholder="預設" 
        value={hubID=="default"?"":hubID} onChange={e => setHubID(e.target.value.trim())}
      />
      <br/><br/>
      <span>暱稱:</span>
      <input type="text" placeholder="隨機" value={name} onChange={e => setName(e.target.value.trim())}/>
    </div>

    <div className='text-center'>
      <button className='home-join-btn cursor-pointer' onClick={join} onTouchStart={join}>GO</button>
    </div>
  </>
}


export default Home