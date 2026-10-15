export type BookingServiceId = "HAND" | "FOOT" | "BOTH";

export type SalonService = {
  id: BookingServiceId;
  number: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  priceLabel: string;
};

export const services: SalonService[] = [
  {
    id: "HAND",
    number: "01",
    name: "Mão",
    description: "Cuidado com as unhas das mãos, acabamento caprichado e um toque de beleza para acompanhar você em qualquer ocasião.",
    duration: "1 hora",
    price: 30,
    priceLabel: "R$ 30,00",
  },
  {
    id: "FOOT",
    number: "02",
    name: "Pé",
    description: "Um momento para cuidar das unhas dos pés com atenção e carinho, trazendo aquela sensação gostosa de cuidado renovado.",
    duration: "1 hora",
    price: 35,
    priceLabel: "R$ 35,00",
  },
  {
    id: "BOTH",
    number: "03",
    name: "Pé + mão",
    description: "Aproveite para cuidar das mãos e dos pés no mesmo atendimento e sair se sentindo ainda mais bonita e bem-cuidada.",
    duration: "1 hora",
    price: 60,
    priceLabel: "R$ 60,00",
  },
];

export const getService = (id: string) => services.find((service) => service.id === id);
