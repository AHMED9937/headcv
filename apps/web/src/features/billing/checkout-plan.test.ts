import { describe, expect, it } from "vitest";
import { CHECKOUT_PLANS, isCheckoutPlan, toCheckoutInput } from "./checkout-plan";

describe("checkout plans", () => {
	it("opens a trial checkout on the plan the user chose", () => {
		expect(toCheckoutInput("yearly-trial")).toEqual({ plan: "yearly", trial: true });
		expect(toCheckoutInput("monthly-trial")).toEqual({ plan: "monthly", trial: true });
	});

	it("buys the plan outright from Get Pro", () => {
		expect(toCheckoutInput("monthly")).toEqual({ plan: "monthly", trial: false });
		expect(toCheckoutInput("yearly")).toEqual({ plan: "yearly", trial: false });
	});

	it("ignores the retired weekly trial and unknown values from links", () => {
		expect(isCheckoutPlan("trial")).toBe(false);
		expect(isCheckoutPlan("lifetime")).toBe(false);
		expect(isCheckoutPlan(undefined)).toBe(false);
		expect(CHECKOUT_PLANS.every(isCheckoutPlan)).toBe(true);
	});
});
