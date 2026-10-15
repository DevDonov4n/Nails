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
    description: "Cuidado delicado para mãos bem cuidadas e unhas impecáveis.",
    duration: "1 hora",
    price: 30,
    priceLabel: "R$ 30,00",
  },
  {
    id: "FOOT",
    number: "02",
    name: "Pé",
    description: "Um momento de cuidado e conforto para seus pés.",
    duration: "1 hora",
    price: 35,
    priceLabel: "R$ 35,00",
  },
  {
    id: "BOTH",
    number: "03",
    name: "Pé + mão",
    description: "Um cuidado completo para você sair renovada.",
    duration: "1 hora",
    price: 60,
    priceLabel: "R$ 60,00",
  },
];

export const getService = (id: string) => services.find((service) => service.id === id);
