import { z } from "zod";

export const RECEIVING_PREFIX = "nearcom:";
const accountPattern = /^(?:0x[0-9a-fA-F]{40}|[a-z0-9]+(?:[._-][a-z0-9]+)*)$/;

// Require the internal-network prefix so a bare chain address cannot silently
// become an internal recipient. Validation establishes format, not ownership.
export const receivingAddress = z.string().trim().max(72).superRefine((value, ctx) => {
  const reject = (message: string) => ctx.addIssue({code: z.ZodIssueCode.custom, message});
  if (!value) return reject("Paste your near.com internal address.");
  if (!value.toLowerCase().startsWith(RECEIVING_PREFIX))
    return reject("Copy the internal address from near.com. It starts with nearcom:.");
  const account = value.slice(RECEIVING_PREFIX.length);
  if (account.length < 2 || account.length > 64 || !accountPattern.test(account) || (account.startsWith("0x") && !/^0x[0-9a-fA-F]{40}$/.test(account)) || /^(?:0x)?0+$/.test(account))
    reject("This address looks incomplete. Copy the full internal address from near.com.");
}).transform(value => {
  const account = value.slice(RECEIVING_PREFIX.length);
  return RECEIVING_PREFIX + (account.startsWith("0x") ? account.toLowerCase() : account);
});

export function receivingAccount(value: string): string {
  return receivingAddress.parse(value).slice(RECEIVING_PREFIX.length);
}
export function displayReceivingAddress(account: string): string {
  return RECEIVING_PREFIX + account;
}
