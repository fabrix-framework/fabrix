import { faker } from "@faker-js/faker";

export const users = [
  {
    id: faker.string.uuid(),
    name: "first user",
    code: "u001",
  },
  {
    id: faker.string.uuid(),
    name: "second user",
    code: "u002",
  },
];
