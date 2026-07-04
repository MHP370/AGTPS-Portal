export type ProvinceStatus =
  | "online"
  | "offline"
  | "warning"
  | "maintenance";

export interface Province {
  id: string;
  name: string;
  color: string;
  status: ProvinceStatus;
  alarms: number;
  users: number;
  url: string;
}
