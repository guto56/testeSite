import { STATUS_COLOR, type ApartmentStatus } from '@/data/apartments';

export function StatusDot({ status, size = 8 }: { status: ApartmentStatus; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: STATUS_COLOR[status], boxShadow: `0 0 10px ${STATUS_COLOR[status]}88` }}
    />
  );
}
