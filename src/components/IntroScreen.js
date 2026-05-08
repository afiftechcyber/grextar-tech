// src/components/IntroScreen.jsx
export default function IntroScreen({ onLaunch }) {
  return (
    <div className="intro-screen">
      <div className="intro-bg" />
      <div className="intro-content">
        <h1>GREXTAR MINSTESION AI</h1>
        <p>Premium AI Assistant</p>
        <button onClick={onLaunch} className="enter-btn">Lewati →</button>
      </div>
    </div>
  )
}