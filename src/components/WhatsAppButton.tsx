export default function WhatsAppButton({
  label = "WhatsApp",
  message = "Hello Samiz Tech, I would like to discuss a project.",
  className = "",
}: {
  label?: string;
  message?: string;
  className?: string;
}) {
  const url = `https://wa.me/2348155721739?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`transition ${className}`}
    >
      {label}
    </a>
  );
}
