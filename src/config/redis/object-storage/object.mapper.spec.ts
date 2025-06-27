import { ObjectMapper } from './object.mapper';
import 'reflect-metadata';
import { ObjectField } from "./decorator";

class User {
    @ObjectField({ type: "string" })
    name: string;

    @ObjectField({ type: "number" })
    age: number;

    @ObjectField({ type: "datetime" })
    birthday: Date;

    @ObjectField({ type: "boolean" })
    married: boolean;
}

describe('ObjectMapper', () => {
    let mapper: ObjectMapper<User>;

    beforeEach(() => {
        mapper = new ObjectMapper(User);
    })

    describe("hMapToInstance", () => {
        it("Map RedisHMap type object to proper instance", async () => {
            const birthday = new Date("1999-06-13");

            const hMap = {
                name: "foo",
                age: "27",
                birthday: birthday.toISOString(),
                married: "0"
            };

            const user = await mapper.hMapToInstance(hMap);

            expect(user).toBeInstanceOf(User);
            expect(user.name).toBe("foo");
            expect(user.age).toBe(27);
            expect(user.birthday).toEqual(birthday);
            expect(user.married).toBe(false);
        });
    });

    describe("instanceToHMapEntries", () => {

        it("Map instance to entries", async () => {

            const user: User = {
                name: "foo",
                age: 27,
                birthday: new Date("1999-06-13"),
                married: false
            };

            await expect(mapper.instanceToHMapEntries(user)).resolves
                .toEqual([
                    ["name", "foo"],
                    ["age", "27"],
                    ["birthday", new Date("1999-06-13").toISOString()],
                    ["married", "0"]
                ]);
        });

        it("When partial instance given, skip missing fields", async () => {
            const user: Partial<User> = { name: "foo", age: 27, married: true };

            await expect(mapper.instanceToHMapEntries(user)).resolves
                .toEqual([
                    ["name", "foo"],
                    ["age", "27"],
                    ["married", "1"]
                ]);
        })
    });

});