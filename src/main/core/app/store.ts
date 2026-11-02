import Conf, { type Schema } from 'conf'
import { getEnvironment } from '../environment'

/** A JSON file in the user data folder, opened on first use because its path is known only then. */
export function lazyStore<T extends Record<string, unknown>>(
  configName: string,
  schema: Schema<T>
): () => Conf<T> {
  let store: Conf<T> | null = null
  return () => {
    store ??= new Conf<T>({
      cwd: getEnvironment().userDataPath,
      configName,
      schema,
      clearInvalidConfig: true
    })
    return store
  }
}
