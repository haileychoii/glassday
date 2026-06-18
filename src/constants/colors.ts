export type PastelEventColor = {
  name: string;
  value: string;
};

export const pastelEventColors: PastelEventColor[] = [
  { name: "Sky", value: "#B8D7FF" },
  { name: "Bluebell", value: "#C8C7FF" },
  { name: "Lavender", value: "#E5C7FF" },
  { name: "Pink", value: "#FFC9E5" },
  { name: "Rose", value: "#FFD0D0" },
  { name: "Peach", value: "#FFDDB8" },
  { name: "Butter", value: "#FFF1B8" },
  { name: "Lime", value: "#D9F7BE" },
  { name: "Mint", value: "#BFEFD7" },
  { name: "Aqua", value: "#BDEEEE" },
  { name: "Ice", value: "#C9E6FF" },
  { name: "Dust", value: "#D7D7E8" },
  { name: "Latte", value: "#E8D8CF" },
  { name: "Mauve", value: "#F2D6E3" },
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