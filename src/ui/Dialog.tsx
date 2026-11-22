import { useEffect, useRef, type ReactElement, type ReactNode } from 'react'

type DialogProps = {
  isOpen: boolean
  onClose: () => void
  labelledBy: string
  children: ReactNode
}

/** Native modal dialog: focus trapping, Escape and the inert background come from the platform. */
export function Dialog({ isOpen, onClose, labelledBy, children }: DialogProps): ReactElement {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (isOpen && !dialog.open) dialog.showModal()
    if (!isOpen && dialog.open) dialog.close()
  }, [isOpen])

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      className="m-auto w-[min(92vw,24rem)] rounded-[28px] border border-line bg-surface p-0 text-ink shadow-float backdrop:bg-primary-deep/50 backdrop:backdrop-blur-sm open:animate-[dialog-in_260ms_var(--ease-out-soft)]"
    >
      {isOpen && children}
    </dialog>
  )
}
