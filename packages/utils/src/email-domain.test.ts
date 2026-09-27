import { describe, expect, it } from "vitest";
import { getEmailDomain, isEmailDomainAllowed } from "./email-domain";

const allowed = ["gmail.com", "outlook.com"];

describe("getEmailDomain", () => {
	it("returns the lowercased domain", () => {
		expect(getEmailDomain("  John.Doe@Gmail.COM ")).toBe("gmail.com");
	});

	it("uses the last @ as the separator", () => {
		expect(getEmailDomain('"a@evil.io"@gmail.com')).toBe("gmail.com");
	});

	it("returns null when there is no local part or domain", () => {
		expect(getEmailDomain("gmail.com")).toBeNull();
		expect(getEmailDomain("@gmail.com")).toBeNull();
		expect(getEmailDomain("john@")).toBeNull();
	});
});

describe("isEmailDomainAllowed", () => {
	it("accepts allowlisted domains case-insensitively", () => {
		expect(isEmailDomainAllowed("john@gmail.com", allowed)).toBe(true);
		expect(isEmailDomainAllowed("john@OUTLOOK.com", allowed)).toBe(true);
	});

	it("rejects domains that are not on the allowlist", () => {
		expect(isEmailDomainAllowed("john@mailinator.com", allowed)).toBe(false);
	});

	it("rejects subdomains and look-alike domains", () => {
		expect(isEmailDomainAllowed("john@mail.gmail.com", allowed)).toBe(false);
		expect(isEmailDomainAllowed("john@gmail.com.evil.io", allowed)).toBe(false);
		expect(isEmailDomainAllowed("john@notgmail.com", allowed)).toBe(false);
	});

	it("rejects malformed addresses", () => {
		expect(isEmailDomainAllowed("gmail.com", allowed)).toBe(false);
		expect(isEmailDomainAllowed("", allowed)).toBe(false);
	});

	it("accepts any domain when the wildcard is allowlisted", () => {
		expect(isEmailDomainAllowed("john@company.io", ["*"])).toBe(true);
	});

	it("rejects everything when the allowlist is empty", () => {
		expect(isEmailDomainAllowed("john@gmail.com", [])).toBe(false);
	});
});
