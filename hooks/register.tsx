import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { lakeScene } from './scene'

const SCENE_ID = 'paper-lake'
const SCENE = lakeScene()

// A night scene on dark kraft, so the app wears its dark half only: pond-dark paper grays.
const { theme, problems } = makeColors({
  label: 'Paper lake',
  only: 'dark',
  roles: { accent: '#2fb8a8', danger: '#e0606a', success: '#7cc35a', warning: '#e0a83a', pro: '#a58ae0' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#111b1c',
        'surface-1': '#162324',
        'surface-2': '#1a2a2a',
        'surface-3': '#1e3030',
        'text-primary': '#eef3e8',
        'text-secondary': '#c9d6cc',
        'text-muted': '#a3b5ac',
      },
    },
  },
})

const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: SCENE_ID, glass: { blur: 14, tint: '#111b1c', opacity: 0.55 } },
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'lake', description: 'Bring the paper lake back' })
    await $.command.register({ name: 'lake-off', description: 'Put the paper lake away' })
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) $.ui.toast(unpainted)
    const set = await $.theme.set(LOOK)
    if (!set.isDrawn) $.ui.status(set.reason)
    return next(e)
  })

  on('command.run', { command: 'lake' }, async $ => {
    const set = await $.theme.set(LOOK)
    if (set.isDrawn) $.ui.status(undefined)
    return { text: set.isDrawn ? 'The lake is back.' : `Lake set, not drawn yet: ${set.reason}` }
  })

  on('command.run', { command: 'lake-off' }, async $ => {
    await $.theme.clear()
    return { text: 'Lake put away. /lake brings it back.' }
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.props.scene !== SCENE_ID || e.props.plugin !== 'paper-lake') return next(e)
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    const { Svg } = $.ui.resolve(e)
    return (
      <Svg
        source={SCENE}
        alt="A night lake in cut paper: frogs on lily pads, rain ripples, falling stars"
        isInteractive
      />
    )
  })
}
