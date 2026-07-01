export type ProvinceStatus =
  | "online"
  | "offline"
  | "warning"
  | "maintenance";

export interface ProvinceInfo {
  id: string;
  name: string;

  status: ProvinceStatus;

  color: string;

  alarms: number;

  users: number;

  sites: number;

  x: number;

  y: number;
}
