import { catalogGroups } from '../lib/catalog'

export function ModelOptions({ models }: { models: string[] }) {
  const available = new Set(models)
  const catalogNames = new Set(catalogGroups.flatMap((group) => group.models))
  const imported = models.filter((model) => !catalogNames.has(model))
  return (
    <>
      {catalogGroups.map((group) => {
        const options = group.models.filter((model) => available.has(model))
        return options.length ? (
          <optgroup key={group.brand} label={group.brand}>
            {options.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </optgroup>
        ) : null
      })}
      {imported.length > 0 && (
        <optgroup label="Other imported models">
          {imported.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </optgroup>
      )}
    </>
  )
}
