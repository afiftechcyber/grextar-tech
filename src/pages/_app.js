import '../styles/globals.css'

console.log(
  '✅ globals.css berhasil dimuat'
)

export default function App({
  Component,
  pageProps,
}) {
  return (
    <Component {...pageProps} />
  )
}