import carTaycan from "@/assets/car-taycan.jpg";
import carDefender from "@/assets/car-defender.jpg";
import carFerrari from "@/assets/car-ferrari.jpg";
import carAston from "@/assets/car-aston.jpg";
import carSedan from "@/assets/car-sedan.jpg";
import carMoto from "@/assets/car-moto.jpg";
import carUtility from "@/assets/car-utility.jpg";

const carImages: Record<string, string> = {
  "car-taycan": carTaycan,
  "car-defender": carDefender,
  "car-ferrari": carFerrari,
  "car-aston": carAston,
  "car-sedan": carSedan,
  "car-moto": carMoto,
  "car-utility": carUtility,
};

export const AVAILABLE_CAR_IMAGE_KEYS = Object.keys(carImages);

export function getCarImage(imageKey: string): string {
  return carImages[imageKey] ?? carTaycan;
}

export function formatPrice(price: number): string {
  return `${price.toLocaleString("fr-FR")} €`;
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return iso;
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
