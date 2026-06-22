export default function SignalDot({
  size = 6,
  pulse = true,
  className = "",
}: {
  size?: number;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {pulse && (
        <span
          className="absolute inset-0 rounded-full bg-relay-signal opacity-60 animate-ping"
          style={{ animationDuration: "2.4s" }}
        />
      )}
      <span
        className="relative rounded-full bg-relay-signal"
        style={{ width: size, height: size }}
      />
    </span>
  );
}
