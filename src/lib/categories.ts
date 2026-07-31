export const CATEGORIES = [
  { value: 'elektronik', label: 'Elektronik' },
  { value: 'moebel', label: 'Möbel' },
  { value: 'kleidung', label: 'Kleidung' },
  { value: 'haushalt', label: 'Haushalt' },
  { value: 'freizeit', label: 'Freizeit & Hobby' },
  { value: 'dienstleistung', label: 'Dienstleistung' },
  { value: 'sonstiges', label: 'Sonstiges' },
] as const

export function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value
}
