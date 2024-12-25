import { faker } from "@faker-js/faker";

export const users = [
  {
    id: faker.string.uuid(),
    name: "first user",
    email: faker.internet.email(),
    category: "ADMIN",
    address: {
      city: faker.location.city(),
      street: faker.location.street(),
      zip: faker.location.zipCode(),
    },
  },
  {
    id: faker.string.uuid(),
    name: "second user",
    email: faker.internet.email(),
    category: "USER",
    address: {
      zip: faker.location.zipCode(),
    },
  },
];
