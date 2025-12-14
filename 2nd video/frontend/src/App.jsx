import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios'

// summary of video 2
// 1. origin same hoga jabhi entry duga
// - in backend addup cors npm package in middleware. (Whitelisting urls)
// - in frontend, addup the proxy in the vite config file.
// Benefits of proxy:
// - It adds the url to the specific routes we want.
// - it make the request coming from url as same origin so you don't have to define cors in backend.
// 2. Bad practice: bundling the whole react code and copy pasting it in backend. Why bad practice? If you change the Frontend, there is a need to bundle the code everytime & then replace the old dist folder(bundle code folder).
// 3. For using import & require as per your choice, addup the type attribute in there either module or commonjs as per ref. respectively.


function App() {
  const [data, setData] = useState({})

  useEffect(()=>{

    // cors error =>It can be resolved using cors npm package(white listing)-> on server
    //  or  
    // proxy =>on frontend

    //adding proxy in vite.config
      axios.get('/api/data')
      .then((response)=>{
        setData(response.data)
      })
      .catch((error)=>{
        console.log(error)
      })
    },[])

  return (
    <>
     <div>this is the data {data.login}</div>

    </>
  )
}

export default App
