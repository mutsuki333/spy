

import Logo from '../assets/ania.png'
// import Logo from '../assets/spy.svg'

const Home = ({join, name, setName}) => {

  return <>
    <div className='title home'>
      <span>誰是臥底</span>
    </div>
    
    <img src={Logo} className='home-logo'></img>

    <div className='home-join-ctr'>
      <input type="text" placeholder="暱稱" value={name} onChange={e => setName(e.target.value.trim())}/>
    </div>
    <div className='text-center'>
      <button className='home-join-btn cursor-pointer' onClick={join} onTouchStart={join}>GO</button>
    </div>
  </>
}


export default Home