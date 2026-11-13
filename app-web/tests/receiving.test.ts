import { expect, test } from "vitest";
import { receivingAddress, receivingAccount } from "../lib/receiving";

test("internal addresses retain explicit network identity while normalizing EVM-style account IDs", () => {
 const mixed = '  NEARCOM:0x' + 'Ab'.repeat(20) + '  ';
 expect(receivingAddress.parse(mixed)).toBe('nearcom:0x'+'ab'.repeat(20));
 expect(receivingAccount(mixed)).toBe('0x'+'ab'.repeat(20));
 expect(receivingAddress.parse('nearcom:alice.near')).toBe('nearcom:alice.near');
 expect(receivingAccount('nearcom:'+'ab'.repeat(32))).toBe('ab'.repeat(32));
});
test("chain addresses, malformed prefixes, incomplete values and URI payloads are rejected", () => {
 for (const value of ['', '0x'+'ab'.repeat(20), 'nearcom:0x…', 'nearcom:0x123', 'nearcom:0x'+'0'.repeat(40),
 'nearcom:nearcom:alice.near', 'nearcom:a', 'nearcom:alice..near', 'nearcom:Alice.near',
 'nearcom:alice.near?amount=5', 'https://near.com/receive', 'nearcom:'+'a'.repeat(65)]) {
  expect(receivingAddress.safeParse(value).success, value).toBe(false);
 }
});
