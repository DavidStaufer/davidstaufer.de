import type { ModelBuilder } from './kit';
import { PROJEKT_MODELLE } from './projekte';
import { HOBBY_MODELLE } from './hobbys';
import { MODUL_MODELLE } from './module';

export { statusLook, rng, type Model } from './kit';

/** Alle Monde, die sich aus der Nähe in ein 3D-Modell verwandeln, nach Knoten-Schlüssel. */
export const MODELS: Record<string, ModelBuilder> = { ...PROJEKT_MODELLE, ...HOBBY_MODELLE, ...MODUL_MODELLE };
