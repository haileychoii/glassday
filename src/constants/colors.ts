export type PastelEventColor = {
  name: string;
  value: string;
};

export const pastelEventColors: PastelEventColor[] = [
  { name: "Powder Blue", value: "#BFD8FF" },
  { name: "Cloud Blue", value: "#C8CDFB" },
  { name: "Soft Lavender", value: "#DAC7F6" },
  { name: "Blush Pink", value: "#F4C3D8" },
  { name: "Milk Rose", value: "#F4C9C7" },
  { name: "Cream Peach", value: "#F2D2B2" },
  { name: "Butter Cream", value: "#EEDB9B" },
  { name: "Pale Lime", value: "#CDE6A7" },
  { name: "Mint Cream", value: "#B7E3CA" },
  { name: "Aqua Mist", value: "#B4E1E4" },
  { name: "Ice Blue", value: "#BCDDF6" },
  { name: "Dusty Lilac", value: "#D2D0E5" },
  { name: "Oat Beige", value: "#E2D2C3" },
  { name: "Mauve Milk", value: "#EAC6D7" },
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
