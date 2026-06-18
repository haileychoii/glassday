export type PastelEventColor = {
  name: string;
  value: string;
};

export const pastelEventColors: PastelEventColor[] = [
  { name: "Powder Blue", value: "#DCEBFF" },
  { name: "Cloud Blue", value: "#E3E5FF" },
  { name: "Soft Lavender", value: "#EFE3FF" },
  { name: "Blush Pink", value: "#FFE3F1" },
  { name: "Milk Rose", value: "#FFE5E5" },
  { name: "Cream Peach", value: "#FFEBD8" },
  { name: "Butter Cream", value: "#FFF6D8" },
  { name: "Pale Lime", value: "#EAF9D8" },
  { name: "Mint Cream", value: "#DDF7EA" },
  { name: "Aqua Mist", value: "#DCF7F7" },
  { name: "Ice Blue", value: "#E3F2FF" },
  { name: "Dusty Lilac", value: "#E8E8F4" },
  { name: "Oat Beige", value: "#F2E8DF" },
  { name: "Mauve Milk", value: "#F8E4EE" },
];

export const getRandomPastelEventColor = () => {
  const index = Math.floor(Math.random() * pastelEventColors.length);
  return pastelEventColors[index].value;
};

export const getPastelColorById = (id: string) => {
  const hash = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return pastelEventColors[hash % pastelEventColors.length].value;
};

export const getEventColor = (event: { id: string; color?: string }) => {
  return event.color || getPastelColorById(event.id);
};