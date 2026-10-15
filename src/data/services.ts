export type SalonService = {
  number: string;
  name: string;
  description: string;
  duration: string;
  priceLabel: string;
};

export const services: SalonService[] = [
  {
    number: "01",
    name: "Manicure",
    description: "Cuidado delicado para mãos bem cuidadas e unhas impecáveis.",
    duration: "A consultar",
    priceLabel: "Consulte o valor",
  },
  {
    number: "02",
    name: "Alongamento",
    description: "Comprimento e formato pensados para combinar com seu estilo.",
    duration: "A consultar",
    priceLabel: "Consulte o valor",
  },
  {
    number: "03",
    name: "Esmaltação em gel",
    description: "Brilho marcante e acabamento elegante para sua rotina.",
    duration: "A consultar",
    priceLabel: "Consulte o valor",
  },
];
