import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Navbar from './components/Navbar';
import Home from './pages/Home/index.tsx';
import CreateFile from './pages/CreateFile/index.tsx';
import { Route, Routes } from 'react-router-dom';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Navbar />
      <div className='container'>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/createpdf" element={<CreateFile />} />
      </Routes>
      </div>
    </>
  )
}

export default App
