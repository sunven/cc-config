import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import './App.css'

function App() {
  const [greetMsg, setGreetMsg] = useState('')
  const [name, setName] = useState('')

  async function greet() {
    setGreetMsg(await invoke('greet', { name }))
  }

  return (
    <div className="container">
      <h1>Welcome to cc-config</h1>

      <div className="row">
        <a href="https://tauri.app" target="_blank">
          <img src="/assets/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src="/assets/javascript.svg" className="logo react" alt="React logo" />
        </a>
      </div>

      <p>Click on the Tauri and React logos to learn more</p>

      <div className="row">
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="button" onClick={greet}>Greet</button>
      </div>

      <p>{greetMsg}</p>
    </div>
  )
}

export default App
