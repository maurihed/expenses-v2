export type Activity = {
  name: string;
  sets: number;
  action: string;
  weight?: string;
  note?: string;
}

export type Workout = {
  id: string;
  name: string;
  activities: Activity[];
}