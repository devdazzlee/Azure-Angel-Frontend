import { motion } from "framer-motion";

interface SpotlightOverlayProps {
  rect: DOMRect;
  padding?: number;
  borderRadius?: number;
}

/**
 * Full-viewport dimmer with a rounded-rect cutout around the target. Built
 * with an SVG `mask` so the highlighted element stays visually crisp through
 * the hole instead of being covered by a semi-transparent layer.
 *
 * The overlay sits at z-index 60 so it dims chat UI but stays below the
 * coach-mark popover (z-70) and React-Toastify (z-9999).
 */
export default function SpotlightOverlay({
  rect,
  padding = 8,
  borderRadius = 14,
}: SpotlightOverlayProps) {
  const x = Math.max(0, rect.left - padding);
  const y = Math.max(0, rect.top - padding);
  const width = rect.width + padding * 2;
  const height = rect.height + padding * 2;

  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="pointer-events-none fixed inset-0 z-[60] h-full w-full"
      aria-hidden
    >
      <defs>
        <mask id="coach-spotlight-mask">
          <rect width="100%" height="100%" fill="white" />
          <motion.rect
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            x={x}
            y={y}
            width={width}
            height={height}
            rx={borderRadius}
            ry={borderRadius}
            fill="black"
          />
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="rgba(15, 23, 42, 0.55)"
        mask="url(#coach-spotlight-mask)"
      />
      <motion.rect
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        x={x}
        y={y}
        width={width}
        height={height}
        rx={borderRadius}
        ry={borderRadius}
        fill="none"
        stroke="rgba(20, 184, 166, 0.9)"
        strokeWidth={2}
      />
    </motion.svg>
  );
}
