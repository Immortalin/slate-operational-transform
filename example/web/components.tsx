import React, { MouseEventHandler, PropsWithChildren } from 'react'
import { css, cx } from 'emotion'

import ReactDOM from 'react-dom'

type ButtonProps = {
  active: boolean
  className?: string
  reversed?: boolean
  onMouseDown?: MouseEventHandler<HTMLSpanElement>
}

export const Button = React.forwardRef<HTMLSpanElement, PropsWithChildren<ButtonProps>>(
  ({ className, active, reversed, ...props }, ref) => (
    <span
      {...props}
      ref={ref}
      className={cx(
        className,
        css`
          cursor: pointer;
          color: ${reversed ? (active ? 'white' : '#aaa') : active ? 'black' : '#ccc'};
        `
      )}
    />
  )
)

type IconProps = {
  className?: string
}

export const Icon = React.forwardRef<HTMLSpanElement, PropsWithChildren<IconProps>>(
  ({ className, ...props }, ref) => (
    <span
      {...props}
      ref={ref}
      className={cx(
        'material-icons',
        className,
        css`
          font-size: 18px;
          vertical-align: text-bottom;
        `
      )}
    />
  )
)

type InstructionProps = {
  className?: string
}

export const Instruction = React.forwardRef<HTMLDivElement, InstructionProps>(
  ({ className, ...props }, ref) => (
    <div
      {...props}
      ref={ref}
      className={cx(
        className,
        css`
          white-space: pre-wrap;
          margin: 0 -20px 10px;
          padding: 10px 20px;
          font-size: 14px;
          background: #f8f8e8;
        `
      )}
    />
  )
)

type MenuProps = {
  className?: string
}

export const Menu = React.forwardRef<HTMLDivElement, MenuProps>(({ className, ...props }, ref) => (
  <div
    {...props}
    ref={ref}
    className={cx(
      className,
      css`
        & > * {
          display: inline-block;
        }

        & > * + * {
          margin-left: 15px;
        }
      `
    )}
  />
))

type PortalProps = {}

export const Portal = ({ children }: PropsWithChildren<PortalProps>) => {
  return ReactDOM.createPortal(children, document.body)
}

type ToolbarProps = {
  className?: string
}

export const Toolbar = React.forwardRef<HTMLDivElement, PropsWithChildren<ToolbarProps>>(
  ({ className, ...props }, ref) => (
    <Menu
      {...props}
      ref={ref}
      className={cx(
        className,
        css`
          position: relative;
          padding: 0.5rem;
          border-bottom: 1px solid #eee;
        `
      )}
    />
  )
)
