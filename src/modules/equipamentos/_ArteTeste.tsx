import { ART_TYPE_IDS, TypeArt } from './components/TypeArt'
export default function ArteTeste() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {ART_TYPE_IDS.map((id) => (
        <div key={id} className="rounded-card bg-accent-soft p-6"><TypeArt typeId={id} className="h-56 w-full" /></div>
      ))}
      {ART_TYPE_IDS.map((id) => (
        <div key={id + 'r'} className="rounded-card bg-raised p-3"><TypeArt typeId={id} className="h-24 w-full" /></div>
      ))}
      <div className="rounded-card bg-accent-soft p-6"><TypeArt typeId="xx" className="h-56 w-full" /></div>
    </div>
  )
}
