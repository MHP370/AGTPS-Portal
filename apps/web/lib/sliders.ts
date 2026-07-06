import { api } from "./api";

export interface Slider {
  id: string;
  title: string;
  image: string;
  url?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface CreateSliderDto {
  title: string;
  image: string;
  url?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const slidersQueryKey = ["sliders"];

export function getSliders() {
  return api.get<Slider[]>("/sliders");
}

export function createSlider(dto: CreateSliderDto) {
  return api.post<Slider>("/sliders", dto);
}

export function updateSlider(
  id: string,
  dto: Partial<CreateSliderDto>,
) {
  return api.put<Slider>(`/sliders/${id}`, dto);
}

export function deleteSlider(id: string) {
  return api.delete<void>(`/sliders/${id}`);
}
