import { describe, expect, it } from "vitest";
import { CHECKOUT_PLANS, isCheckoutPlan } from "./checkout-plan";

describe("checkout plans", () => {
	it("sells Monthly, Yearly and the one-time trial", () => {
		expect(CHECKOUT_PLANS).toEqual(["monthly", "yearly", "trial"]);
		expect(CHECKOUT_PLANS.every(isCheckoutPlan)).toBe(true);
	});

	it("ignores retired and unknown plans in links", () => {
		expect(isCheckoutPlan("yearly-trial")).toBe(false);
		expect(isCheckoutPlan("monthly-trial")).toBe(false);
		expect(isCheckoutPlan("lifetime")).toBe(false);
		expect(isCheckoutPlan(undefined)).toBe(false);
	});
});
