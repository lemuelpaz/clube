'use client'

import { useEffect } from 'react'

export default function PrintProtection() {
  useEffect(() => {
    function block(e: Event) { e.preventDefault() }

    // Block print keyboard shortcuts
    function onKeydown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    // Block print dialog
    function beforePrint() {
      document.documentElement.style.display = 'none'
    }
    function afterPrint() {
      document.documentElement.style.display = ''
    }

    window.addEventListener('beforeprint', beforePrint)
    window.addEventListener('afterprint', afterPrint)
    window.addEventListener('keydown', onKeydown)

    // Disable right-click on images
    function noCtxMenu(e: MouseEvent) {
      if (e.target instanceof HTMLImageElement) e.preventDefault()
    }
    document.addEventListener('contextmenu', noCtxMenu)

    return () => {
      window.removeEventListener('beforeprint', beforePrint)
      window.removeEventListener('afterprint', afterPrint)
      window.removeEventListener('keydown', onKeydown)
      document.removeEventListener('contextmenu', noCtxMenu)
    }
  }, [])

  return null
}
