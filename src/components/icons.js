import Svg, { Path, Circle, Rect } from 'react-native-svg'

/* Los mismos iconos que la web, dibujados con react-native-svg. Son de línea y
   de un solo color: el color y el tamaño llegan por props, así el mismo icono
   sirve en la barra de pestañas, en un botón o en un cartel.

   En la web heredaban currentColor del padre; en React Native no existe eso,
   por eso hay que pasarles `color` a mano. */
function Icono({ size = 20, color = '#fff', grosor = 2, children }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  )
}

export const TrashIcon = (p) => (
  <Icono {...p}>
    <Path d="M4 7h16M10 11v6M14 11v6" />
    <Path d="M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12" />
    <Path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" />
  </Icono>
)

export const SunIcon = (p) => (
  <Icono {...p}>
    <Circle cx="12" cy="12" r="4.5" />
    <Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icono>
)

export const MoonIcon = (p) => (
  <Icono {...p}>
    <Path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />
  </Icono>
)

export const PlusIcon = (p) => (
  <Icono {...p}>
    <Path d="M12 5v14M5 12h14" />
  </Icono>
)

export const CloseIcon = (p) => (
  <Icono {...p}>
    <Path d="M6 6l12 12M18 6L6 18" />
  </Icono>
)

export const UndoIcon = (p) => (
  <Icono {...p}>
    <Path d="M9 14L4 9l5-5" />
    <Path d="M4 9h10a6 6 0 010 12h-3" />
  </Icono>
)

export const PlayIcon = (p) => (
  <Icono {...p}>
    <Path d="M7 4.5l12 7.5-12 7.5z" />
  </Icono>
)

export const StopIcon = (p) => (
  <Icono {...p}>
    <Rect x="6" y="6" width="12" height="12" rx="2" />
  </Icono>
)

export const BoxIcon = (p) => (
  <Icono {...p}>
    <Path d="M3 8l9-5 9 5v8l-9 5-9-5V8z" />
    <Path d="M3 8l9 5 9-5M12 13v8" />
  </Icono>
)

export const GiftIcon = (p) => (
  <Icono {...p}>
    <Rect x="3" y="9" width="18" height="12" rx="2" />
    <Path d="M3 13h18M12 9v12" />
    <Path d="M12 9S10.5 4 8 4a2.5 2.5 0 000 5h4zM12 9s1.5-5 4-5a2.5 2.5 0 010 5h-4z" />
  </Icono>
)

export const CashIcon = (p) => (
  <Icono {...p}>
    <Rect x="2.5" y="6" width="19" height="12" rx="2" />
    <Circle cx="12" cy="12" r="2.5" />
    <Path d="M6 12h.01M18 12h.01" />
  </Icono>
)

export const TagIcon = (p) => (
  <Icono {...p}>
    <Path d="M3 12.5V4a1 1 0 011-1h8.5L21 11.5 12.5 20 3 12.5z" />
    <Circle cx="7.5" cy="7.5" r="1.4" />
  </Icono>
)

export const PowerIcon = (p) => (
  <Icono {...p}>
    <Path d="M12 3v9" />
    <Path d="M6.5 6.5a8 8 0 1011 0" />
  </Icono>
)

export const ArrowRightIcon = (p) => (
  <Icono size={16} {...p}>
    <Path d="M4 12h15M13 6l6 6-6 6" />
  </Icono>
)

export const ListIcon = (p) => (
  <Icono {...p}>
    <Path d="M9 6h11M9 12h11M9 18h11" />
    <Path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
  </Icono>
)

export const ChartIcon = (p) => (
  <Icono {...p}>
    <Path d="M5 20V10M12 20V4M19 20v-7" />
  </Icono>
)

export const LockIcon = (p) => (
  <Icono size={12} grosor={2.6} {...p}>
    <Rect x="4" y="10" width="16" height="11" rx="2.5" />
    <Path d="M8 10V7a4 4 0 018 0v3" />
  </Icono>
)

export const EyeIcon = (p) => (
  <Icono {...p}>
    <Path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z" />
    <Circle cx="12" cy="12" r="3" />
  </Icono>
)

export const EyeOffIcon = (p) => (
  <Icono {...p}>
    <Path d="M10.6 6.1A9.9 9.9 0 0112 6c6.2 0 10 6 10 6a17 17 0 01-3.2 3.7M6.3 7.8A17 17 0 002 12s3.8 6 10 6a9.7 9.7 0 004-.8" />
    <Path d="M9.9 9.9a3 3 0 004.2 4.2" />
    <Path d="M3 3l18 18" />
  </Icono>
)

export const PencilIcon = (p) => (
  <Icono {...p}>
    <Path d="M4 20h4L19 9a2.5 2.5 0 10-3.5-3.5L4.5 16.5 4 20z" />
    <Path d="M14.5 6.5L17.5 9.5" />
  </Icono>
)
