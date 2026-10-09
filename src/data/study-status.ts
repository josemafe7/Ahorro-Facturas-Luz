/** Los estados de un estudio. Va en su propio archivo, sin nada de servidor, para que lo usen las pantallas. */
export const STUDY_STATUSES = ["draft", "sent", "accepted", "contracted"] as const;
export type StudyStatus = (typeof STUDY_STATUSES)[number];
