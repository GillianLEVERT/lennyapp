import { describe, expect, it } from "vitest";
import { pickChestReward, type ChestDraw } from "./gamification";

describe("pickChestReward", () => {
  it("renvoie null sur un pool vide", () => {
    expect(pickChestReward([], undefined)).toBeNull();
  });

  it("renvoie l'unique récompense et compte les répétitions", () => {
    expect(pickChestReward(["a"], undefined)).toEqual({ rewardId: "a", repeats: 1 });
    expect(pickChestReward(["a"], { lastId: "a", repeats: 1 })).toEqual({
      rewardId: "a",
      repeats: 2,
    });
  });

  it("exclut une récompense déjà tirée 2 fois d'affilée (jamais 3×)", () => {
    // Le random forcerait "a" (indice 0), mais a a repeats >= 2 → on doit tomber sur "b".
    const history: ChestDraw = { lastId: "a", repeats: 2 };
    const draw = pickChestReward(["a", "b", "c"], history, () => 0);
    expect(draw?.rewardId).not.toBe("a");
    expect(draw?.repeats).toBe(1);
  });

  it("autorise 2 fois d'affilée (repeats 1 → 2)", () => {
    const history: ChestDraw = { lastId: "a", repeats: 1 };
    // random=0 → "a" reste éligible car repeats < 2.
    const draw = pickChestReward(["a", "b"], history, () => 0);
    expect(draw).toEqual({ rewardId: "a", repeats: 2 });
  });

  it("garde la seule récompense même si elle vient d'être tirée 2×", () => {
    const history: ChestDraw = { lastId: "a", repeats: 2 };
    const draw = pickChestReward(["a"], history, () => 0);
    expect(draw).toEqual({ rewardId: "a", repeats: 3 });
  });

  it("ne dépasse jamais 2 tirages consécutifs sur une longue série", () => {
    const pool = ["a", "b", "c"];
    let history: ChestDraw | undefined;
    let last = "";
    let run = 0;
    let maxRun = 0;
    // random déterministe pour couvrir tout le pool de façon répétée.
    const seq = [0, 0, 0, 0.5, 0.5, 0.9, 0.9, 0.9, 0, 0.5, 0.9, 0];
    let i = 0;

    for (let step = 0; step < 200; step += 1) {
      const random = () => seq[i++ % seq.length];
      const draw = pickChestReward(pool, history, random);
      expect(draw).not.toBeNull();
      const id = draw!.rewardId;
      run = id === last ? run + 1 : 1;
      maxRun = Math.max(maxRun, run);
      last = id;
      history = { lastId: id, repeats: draw!.repeats };
    }

    expect(maxRun).toBeLessThanOrEqual(2);
  });
});
