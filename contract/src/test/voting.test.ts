// Voting Contract Unit Tests
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from "vitest";
import { pureCircuits, VotingStatus } from "../index.js";

describe("Voting Contract", () => {
  it("exports VotingStatus enum values", () => {
    expect(VotingStatus.OPEN).toBe(0);
    expect(VotingStatus.CLOSED).toBe(1);
  });

  it("derives nullifier deterministically", () => {
    const sk = new Uint8Array(32).fill(1);
    const nul1 = pureCircuits.deriveNullifier(sk);
    const nul2 = pureCircuits.deriveNullifier(sk);
    expect(nul1).toEqual(nul2);
    expect(nul1.length).toBe(32);
  });
});
