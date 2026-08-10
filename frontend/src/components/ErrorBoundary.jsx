import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    this.setState({ info })
    console.error('ErrorBoundary a intercepté une erreur :', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', background: '#ffffff', color: '#0f172a',
          padding: '32px', fontFamily: 'monospace', fontSize: '13px',
        }}>
          <h1 style={{ color: '#dc2626', fontSize: '20px', fontWeight: 900, marginBottom: '12px' }}>
            Une erreur a bloqué l'affichage
          </h1>
          <p style={{ marginBottom: '16px', color: '#334155' }}>
            Copiez-collez le texte ci-dessous et envoyez-le pour diagnostic.
          </p>
          <pre style={{
            background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px',
            padding: '16px', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
{String(this.state.error?.stack || this.state.error?.message || this.state.error)}
{this.state.info?.componentStack ? '\n\nComponentStack:' + this.state.info.componentStack : ''}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px', padding: '10px 20px', background: '#1a3a8f', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Recharger la page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
