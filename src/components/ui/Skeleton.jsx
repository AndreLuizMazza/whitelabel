// src/components/ui/Skeleton.jsx
export default function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--text)_8%,transparent)] ${className}`}
      aria-hidden="true"
      {...props}
    />
  )
}
