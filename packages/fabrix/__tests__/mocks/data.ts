import { faker } from "@faker-js/faker";

export const users = [
  {
    id: faker.string.uuid(),
    name: "first user",
    email: faker.internet.email(),
  },
  {
    id: faker.string.uuid(),
    name: "second user",
    email: faker.internet.email(),
  },
];
