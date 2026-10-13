import { useEditor, updateField } from '@/lib/editor/store';

/** Teksti, jota ylläpitäjä voi muokata suoraan paikallaan muokkaustilassa. */
export function Editable({ file, obj, field, multiline = true }: { file: string; obj: object; field: string; multiline?: boolean }) {
  const { editing, version } = useEditor();
  const rec = obj as Record<string, unknown>;
  const value = String(rec[field] ?? '');
  if (!editing) return <>{value}</>;
  return (
    <span
      key={version}
      className="ed-field"
      contentEditable
      suppressContentEditableWarning
      spellCheck
      title="Muokkaa tekstiä — muutos tallentuu kun siirryt pois kentästä"
      onKeyDown={e => { if (e.key === 'Enter' && !multiline) { e.preventDefault(); e.currentTarget.blur(); } e.stopPropagation(); }}
      onBlur={e => updateField(file, rec, field, (e.currentTarget.textContent ?? '').trim())}
    >{value}</span>
  );
}
