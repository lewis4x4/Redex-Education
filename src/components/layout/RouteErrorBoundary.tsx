import { Component, type ErrorInfo, type ReactNode } from 'react'

import { RouteErrorFallback } from './RouteErrorFallback'

interface RouteErrorBoundaryProps {
  children: ReactNode
}

interface RouteErrorBoundaryState {
  hasError: boolean
}

export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RouteErrorBoundary] Route failed to render', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <RouteErrorFallback />
    }

    return this.props.children
  }
}
