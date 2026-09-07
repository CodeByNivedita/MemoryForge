type IconName =
  | 'home'
  | 'learn'
  | 'lab'
  | 'evidence'
  | 'research'
  | 'arrow'
  | 'plus'
  | 'reset';
const paths: Record<IconName, string> = {
  home: 'M3 10 12 3l9 7M5 9v11h5v-6h4v6h5V9',
  learn: 'M12 5C8 2 3 4 3 4v15s5-2 9 1c4-3 9-1 9-1V4s-5-2-9 1Zm0 0v15',
  lab: 'M9 3h6M10 3v7l-6 9a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2l-6-9V3M8 15h8',
  evidence: 'M4 3v17h17M8 15l4-5 4 2 5-7',
  research: 'M5 3h10l4 4v14H5ZM14 3v5h5M8 12h8M8 16h6',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  reset: 'M4 10a8 8 0 1 1 1 8M4 4v6h6',
};
export function Icon({
  name,
  className = 'size-4',
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={paths[name]} />
    </svg>
  );
}
