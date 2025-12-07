export default function StepHeader({ titulo, descricao }) {
  return (
    <div className="mb-6 text-center">
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">{titulo}</h1>
      {descricao && (
        <p className="text-sm text-[var(--c-muted)] leading-relaxed">{descricao}</p>
      )}
    </div>
  );
}
